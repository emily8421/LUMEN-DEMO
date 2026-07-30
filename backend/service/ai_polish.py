"""REQ-014 AI 润色 / 写作引用 service（Phase2B 首批核心，API-028）。

polish（改写选区）/ citation（带来源引用）两种模式：选区 → 权限校验 → 上下文构造 →
LLM 调用 → 草稿落库 → 返回。citation 复用 RAG 检索（向量 + 关键词 + 权限收敛）。

权限与护栏（见 ``docs/design/ai-polish.md``、``docs/07-api-spec.md`` API-028、
``docs/06-db-design.md`` lumen_ai_drafts、``docs/09-verification.md`` TC-P2-AI-001）：
- 文档可写校验：不可见 → ``DocumentNotFoundError``（API 4004，不泄露存在性）；
  可见但不可写 → ``DocumentAccessError``（API 4003）。
- citation sources 仅当前用户可见 chunk（复用 ``rag._find_candidate_chunks`` 的权限
  收敛）；越权 chunk 不进入 prompt、不返回。
- 数据外发护栏（RG-008，风险已接受 2026-07-30）：草稿只存 ``input_excerpt_hash``
  （选区 sha256）+ ``prompt_summary``（摘要），不存完整敏感原文 / 完整 prompt / API key；
  用户自判是否触发润色，系统不做敏感字段自动过滤。
- LLM 不可用 / 返回空 → 抛 ``LlmUnavailableError``（API 503 / 5030），**不编造、不落库**
  （区别于 RAG 问答的静默降级；润色若悄悄给假结果会被「应用」写回正文，故宁可直接报错）。
- citation 无可见来源 → sources=[]，output 提示「未找到可引用来源」，不调 LLM、不编造。
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from backend.service import llm_adapter
from backend.service.document import (
    DocumentAccessError,
    DocumentNotFoundError,
    _ensure_can_write,
    get_visible_document,
)
from backend.service.rag import MAX_CANDIDATES, _extract_terms, _find_candidate_chunks
from backend.service.term import find_matching_terms


class PolishValidationError(Exception):
    """润色请求字段非法（API 映射 4220）。"""


class PolishAccessError(Exception):
    """空间 / 资源访问被拒（API 映射 4003）。"""


class LlmUnavailableError(Exception):
    """LLM 不可用 / 返回空（API 映射 503 / 5030）。不编造、不落 generated。"""


_POLISH_MODES = ("polish", "citation")
_NO_SOURCES_OUTPUT = "未找到可引用来源"


@dataclass(frozen=True)
class PolishRequest:
    mode: str
    selection_md: str
    instruction: str | None = None
    use_sources: bool = True


@dataclass(frozen=True)
class PolishSource:
    chunk_id: int
    document_id: int
    title: str
    snippet: str


@dataclass(frozen=True)
class PolishView:
    draft_id: int
    output_md: str
    sources: tuple[PolishSource, ...]
    status: str


def polish_selection(
    repository,
    user_id: int,
    space_id: int,
    document_id: int,
    request: PolishRequest,
    chat_fn=None,
) -> PolishView:
    selection = request.selection_md.strip()
    if request.mode not in _POLISH_MODES:
        raise PolishValidationError("mode must be polish / citation")
    if not selection:
        raise PolishValidationError("selection_md must not be empty")

    document = get_visible_document(repository, user_id, space_id, document_id)
    _ensure_can_write(repository, user_id, space_id, document)

    terms = _collect_term_context(repository, space_id, selection, request.instruction)
    retrieve_sources = request.mode == "citation" and request.use_sources
    sources, cited_chunk_ids = (
        _retrieve_citation_sources(repository, user_id, space_id, request.instruction, selection)
        if retrieve_sources
        else ([], [])
    )

    # citation 检索后无可见来源：守产品红线，不调 LLM、不编造，仍落一条 generated 草稿告知用户。
    if retrieve_sources and not sources:
        output_md = _NO_SOURCES_OUTPUT
    else:
        chat = _resolve_chat_fn(chat_fn)
        system_prompt, user_prompt = _build_prompt(request, selection, sources, terms)
        try:
            output_md = chat(system_prompt, user_prompt)
        except Exception as exc:  # 网络超时 / 5xx / openai 错误 → 5030，不落库、不编造
            raise LlmUnavailableError("AI service unavailable") from exc
        if not output_md.strip():
            raise LlmUnavailableError("AI service returned empty result")

    draft = repository.create_ai_draft(
        space_id=space_id,
        document_id=document_id,
        user_id=user_id,
        mode=request.mode,
        input_excerpt_hash=_hash_excerpt(selection),
        prompt_summary=_build_prompt_summary(request, terms, sources),
        output_md=output_md,
        cited_chunk_ids=tuple(cited_chunk_ids),
        status="generated",
    )
    return PolishView(
        draft_id=draft.id,
        output_md=output_md,
        sources=tuple(sources),
        status="generated",
    )


def _resolve_chat_fn(chat_fn):
    """注入优先（测试用）；否则按 ``llm_adapter`` 配置解析，未启用 → 5030。"""
    if chat_fn is not None:
        return chat_fn
    if llm_adapter.load_config().enabled:
        return llm_adapter.chat
    raise LlmUnavailableError("LLM not configured")


def _collect_term_context(repository, space_id: int, selection: str, instruction: str | None) -> list:
    text = selection if not instruction else f"{selection}\n{instruction}"
    return find_matching_terms(repository, space_id, text)


def _retrieve_citation_sources(repository, user_id: int, space_id: int, instruction: str | None, selection: str):
    """citation 复用 RAG 检索（已做权限收敛），sources 仅取有 chunk_id 的可见候选。"""
    query = instruction.strip() if instruction and instruction.strip() else selection
    terms = _extract_terms(query)
    candidates = _find_candidate_chunks(repository, user_id, space_id, terms, query)
    sources: list[PolishSource] = []
    cited: list[int] = []
    for candidate in candidates:
        if candidate.chunk is None:
            continue  # 仅标题匹配无 chunk_id，不作引用来源
        sources.append(
            PolishSource(
                chunk_id=candidate.chunk.id,
                document_id=candidate.document.id,
                title=candidate.document.title,
                snippet=candidate.snippet,
            )
        )
        cited.append(candidate.chunk.id)
        if len(sources) >= MAX_CANDIDATES:
            break
    return sources, cited


def _build_prompt(request: PolishRequest, selection: str, sources: list[PolishSource], terms: list) -> tuple[str, str]:
    constraint = (
        "仅依据用户给出的片段与给定资料改写 / 续写，保持事实、不编造未经给定内容支撑的结论；"
        "返回 Markdown 正文，不要解释、不要复述要求。"
    )
    if request.mode == "citation":
        system = (
            "你是 LUMEN 写作引用助手。仅依据下方「可引用来源」改写或续写用户片段，"
            "在内容中标注信息出自哪个来源；若来源不足以支撑，明确告知缺依据，不要编造。"
            + constraint
        )
    else:
        system = "你是 LUMEN 写作润色助手。" + constraint

    parts = [f"待处理片段：\n{selection}"]
    instruction = (request.instruction or "").strip()
    if instruction:
        parts.append(f"用户要求：\n{instruction}")
    if sources:
        parts.append("可引用来源：\n" + _format_sources(sources))
    if terms:
        parts.append("空间术语：\n" + _format_terms(terms))
    return system, "\n\n".join(parts)


def _format_sources(sources: list[PolishSource]) -> str:
    lines = [
        f"[来源{index}] {source.title}：{source.snippet}" for index, source in enumerate(sources, start=1)
    ]
    return "\n".join(lines)


def _format_terms(terms: list) -> str:
    lines = []
    for term in terms:
        aliases = ", ".join(term.aliases) if term.aliases else "无"
        lines.append(f"- {term.term}：{term.definition}（别名：{aliases}）")
    return "\n".join(lines)


def _hash_excerpt(selection: str) -> str:
    return hashlib.sha256(selection.encode("utf-8")).hexdigest()


def _build_prompt_summary(request: PolishRequest, terms: list, sources: list[PolishSource]) -> str:
    # 只存摘要：mode / 是否带 instruction / 术语数 / 来源数；不存完整 prompt 与选区原文。
    has_instruction = "yes" if (request.instruction or "").strip() else "no"
    return (
        f"mode={request.mode}; instruction={has_instruction}; "
        f"terms={len(terms)}; sources={len(sources)}"
    )
