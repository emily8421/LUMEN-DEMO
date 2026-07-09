"""Degraded Sprint-4B RAG service over in-memory document chunks."""

from __future__ import annotations

import re
from dataclasses import dataclass

from backend.model.entities import Document, DocumentChunk
from backend.service import llm_adapter
from backend.service.permission import filter_visible_documents
from backend.service.term import find_matching_terms


NOT_FOUND_ANSWER = "未在当前空间知识库找到相关内容"
MAX_CANDIDATES = 3
MAX_SNIPPET_CHARS = 180


class RagValidationError(Exception):
    """Raised when a RAG query request is invalid."""


@dataclass(frozen=True)
class RagSource:
    doc_id: int | None
    title: str
    snippet: str
    source_type: str = "document"


@dataclass(frozen=True)
class RagAnswer:
    answer: str
    sources: list[RagSource]


@dataclass(frozen=True)
class _CandidateChunk:
    document: Document
    chunk: DocumentChunk | None
    score: int
    snippet: str
    source_type: str = "document"


def answer_question(repository, user_id: int, current_space_id: int, question: str) -> RagAnswer:
    normalized_question = _normalize_question(question)
    terms = _extract_terms(normalized_question)
    question_term_sources = _find_term_sources(repository, current_space_id, normalized_question)
    candidates = _find_candidate_chunks(repository, user_id, current_space_id, terms)
    if not candidates:
        if question_term_sources:
            return RagAnswer(answer=_build_term_only_answer(question_term_sources), sources=question_term_sources)
        return RagAnswer(answer=NOT_FOUND_ANSWER, sources=[])

    selected_candidates = candidates[:MAX_CANDIDATES]
    sources = [
        RagSource(doc_id=candidate.document.id, title=candidate.document.title, snippet=candidate.snippet)
        for candidate in selected_candidates
    ]
    snippet_term_sources = _find_term_sources(
        repository,
        current_space_id,
        "\n".join([normalized_question, *(candidate.snippet for candidate in selected_candidates)]),
    )
    term_sources = _dedupe_sources([*question_term_sources, *snippet_term_sources])
    answer = _build_answer(sources, term_sources, question, _resolve_chat_fn())
    sources.extend(term_sources)
    return RagAnswer(answer=answer, sources=sources)


def _find_term_sources(repository, current_space_id: int, text: str) -> list[RagSource]:
    return [
        RagSource(
            doc_id=term.source_document_id,
            title=f"术语：{term.term}",
            snippet=f"{term.definition}（状态：{term.status}；别名：{', '.join(term.aliases) or '无'}）",
            source_type="term",
        )
        for term in find_matching_terms(repository, current_space_id, text)
    ]


def _dedupe_sources(sources: list[RagSource]) -> list[RagSource]:
    deduped_sources: list[RagSource] = []
    seen_keys: set[tuple[int | None, str, str]] = set()
    for source in sources:
        key = (source.doc_id, source.title, source.source_type)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped_sources.append(source)
    return deduped_sources


def _normalize_question(question: str) -> str:
    normalized_question = question.strip().lower()
    if not normalized_question:
        raise RagValidationError("question is required")
    return normalized_question


def _find_candidate_chunks(
    repository,
    user_id: int,
    current_space_id: int,
    terms: list[str],
) -> list[_CandidateChunk]:
    visible_documents = filter_visible_documents(
        user_id=user_id,
        current_space_id=current_space_id,
        documents=repository.list_documents(),
        memberships=repository.list_memberships(),
    )
    documents_by_id = {document.id: document for document in visible_documents}
    candidates: list[_CandidateChunk] = []
    matched_document_ids: set[int] = set()
    for chunk in repository.list_all_document_chunks():
        document = documents_by_id.get(chunk.document_id)
        if document is None:
            continue
        score = _score_chunk(chunk.text, terms)
        if score <= 0:
            continue
        matched_document_ids.add(document.id)
        candidates.append(
            _CandidateChunk(
                document=document,
                chunk=chunk,
                score=score,
                snippet=_build_snippet(chunk.text, terms),
            )
        )
    for document in visible_documents:
        if document.id in matched_document_ids:
            continue
        title_score = _score_chunk(document.title, terms)
        if title_score <= 0:
            continue
        candidates.append(
            _CandidateChunk(
                document=document,
                chunk=None,
                score=title_score,
                snippet=f"标题匹配：{document.title}",
                source_type="title",
            )
        )
    return sorted(candidates, key=lambda candidate: (-candidate.score, candidate.document.id, candidate.chunk.ordinal if candidate.chunk else 0))


def _score_chunk(text: str, terms: list[str]) -> int:
    normalized_text = text.lower()
    return sum(normalized_text.count(term) for term in terms if term in normalized_text)


def _extract_terms(question: str) -> list[str]:
    terms: list[str] = []
    for token in re.findall(r"[0-9a-zA-Z\u4e00-\u9fff]+", question):
        normalized_token = _trim_question_words(token)
        if len(normalized_token) >= 2:
            terms.append(normalized_token)
        if _is_cjk(normalized_token) and len(normalized_token) > 6:
            terms.extend(_cjk_windows(normalized_token, 4))
    return _dedupe_terms(terms)


def _trim_question_words(token: str) -> str:
    trimmed = token
    for phrase in ("请问", "请说明", "请介绍", "是什么", "是多少", "有哪些", "为什么", "怎么", "如何", "多少"):
        trimmed = trimmed.replace(phrase, "")
    return trimmed.strip()


def _is_cjk(text: str) -> bool:
    return bool(text) and all("\u4e00" <= character <= "\u9fff" for character in text)


def _cjk_windows(text: str, size: int) -> list[str]:
    if len(text) <= size:
        return [text]
    return [text[index : index + size] for index in range(0, len(text) - size + 1)]


def _dedupe_terms(terms: list[str]) -> list[str]:
    deduped_terms: list[str] = []
    for term in terms:
        if term not in deduped_terms:
            deduped_terms.append(term)
    return deduped_terms


def _build_snippet(text: str, terms: list[str]) -> str:
    normalized_text = text.lower()
    match_index = _first_match_index(normalized_text, terms)
    if match_index < 0:
        return _truncate(text.strip(), MAX_SNIPPET_CHARS)

    half_window = MAX_SNIPPET_CHARS // 2
    start = max(match_index - half_window, 0)
    end = min(start + MAX_SNIPPET_CHARS, len(text))
    start = max(end - MAX_SNIPPET_CHARS, 0)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"…{snippet}"
    if end < len(text):
        snippet = f"{snippet}…"
    return snippet


def _first_match_index(normalized_text: str, terms: list[str]) -> int:
    indexes = [normalized_text.find(term) for term in terms if normalized_text.find(term) >= 0]
    return min(indexes) if indexes else -1


def _build_answer(
    sources: list[RagSource],
    term_sources: list[RagSource],
    question: str,
    chat_fn=None,
) -> str:
    """Build the RAG answer. When ``chat_fn`` is provided, call the LLM with a
    source-grounded prompt; fall back to the degraded answer when the LLM is not
    configured or fails. ``chat_fn`` is injected so tests can exercise the LLM
    path without a real endpoint."""
    degraded = _build_degraded_answer(sources, term_sources)
    if chat_fn is None:
        return degraded
    system_prompt = (
        "你是 LUMEN 知识库问答助手。仅依据下方「给定内容」回答用户问题；"
        "在答案中标注信息来自哪个来源；若给定内容无依据，"
        f"回复「{NOT_FOUND_ANSWER}」，不要编造。"
    )
    user_prompt = f"问题：{question}\n\n{_format_context(sources, term_sources)}"
    try:
        llm_answer = chat_fn(system_prompt, user_prompt)
    except Exception:
        return degraded
    return llm_answer or degraded


def _resolve_chat_fn():
    """Return the LLM chat callable when configured, else None (degraded mode)."""
    return llm_adapter.chat if llm_adapter.load_config().enabled else None


def _format_context(sources: list[RagSource], term_sources: list[RagSource]) -> str:
    lines: list[str] = []
    for index, source in enumerate(sources, start=1):
        lines.append(f"[来源{index}] {source.title}：{source.snippet}")
    for source in term_sources:
        lines.append(f"[术语] {source.title}：{source.snippet}")
    return "\n".join(lines)


def _build_degraded_answer(sources: list[RagSource], term_sources: list[RagSource]) -> str:
    snippets = "；".join(source.snippet for source in sources)
    term_context = "；".join(source.snippet for source in term_sources)
    title_only = sources and all(source.snippet.startswith("标题匹配：") for source in sources)
    if term_context:
        if title_only:
            return f"降级模式：未调用 LLM；按当前空间术语解释：{term_context}；仅命中文档标题，未找到正文候选片段：{snippets}"
        return f"降级模式：未调用 LLM；按当前空间术语解释：{term_context}；以下内容仅来自当前空间知识库候选片段：{snippets}"
    if title_only:
        return f"降级模式：未调用 LLM；仅命中文档标题，未找到正文候选片段：{snippets}"
    return f"降级模式：未调用 LLM；以下内容仅来自当前空间知识库候选片段：{snippets}"


def _build_term_only_answer(term_sources: list[RagSource]) -> str:
    term_context = "；".join(source.snippet for source in term_sources)
    return f"降级模式：未调用 LLM；按当前空间术语解释：{term_context}；未匹配到当前空间文档候选片段"


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return f"{text[: max_chars - 1].rstrip()}…"
