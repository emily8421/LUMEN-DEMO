"""Tests for REQ-014 AI polish / citation service + API (Sprint-19, TC-P2-AI-001).

Service tests run against ``DemoRepository`` with an injected ``chat_fn`` mock — no
PostgreSQL / real LLM needed. They cover the RG-008 升 Go conditions: polish draft
generation, citation sources restricted to visible chunks (越权 chunk 不进 prompt /
不返回), hash + summary-only persistence (no key / no full prompt), LLM-unavailable
raises 5030 without fabricating or storing, citation no-sources path skips the LLM.

API tests run against a real PostgreSQL (the module-level singleton repository) and
are skipped when the lumen-pg container is unreachable; they assert the 4001/4003/
4004/4220/5030 error-code mapping plus one mocked happy path.
"""

import hashlib
import importlib.util
import unittest
from unittest.mock import patch

from backend.model.entities import DocumentPermission
from backend.repository.demo_repository import DemoRepository
from backend.service.ai_polish import (
    LlmUnavailableError,
    PolishRequest,
    PolishValidationError,
    polish_selection,
)
from backend.service.document import (
    DocumentAccessError,
    DocumentCreate,
    DocumentNotFoundError,
    create_document,
)


def _make_doc(repository, owner_id: int, permission: DocumentPermission, chunk_texts: list[str]):
    document = create_document(
        repository,
        owner_id,
        10,
        DocumentCreate(title=f"polish-doc-{owner_id}-{permission.value}", content_md=chunk_texts[0], permission=permission),
    )
    repository.replace_document_chunks(document.id, chunk_texts)
    return document


class AiPolishServiceTest(unittest.TestCase):
    def test_polish_generates_draft_and_persists_hash_only(self) -> None:
        repository = DemoRepository()
        target = _make_doc(repository, 1, DocumentPermission.TEAM, ["原文片段"])

        captured: dict[str, str] = {}

        def chat_fn(system_prompt: str, user_prompt: str) -> str:
            captured["system"] = system_prompt
            captured["user"] = user_prompt
            return "润色后的版本"

        view = polish_selection(
            repository,
            1,
            10,
            target.id,
            PolishRequest(mode="polish", selection_md="这段话需要润色"),
            chat_fn=chat_fn,
        )

        self.assertEqual(view.status, "generated")
        self.assertEqual(view.output_md, "润色后的版本")
        self.assertEqual(view.sources, ())
        self.assertIn("润色", captured["system"])
        self.assertIn("这段话需要润色", captured["user"])

        # RG-008 护栏：草稿只存 hash + 摘要，不存完整 prompt / 原文 / key。
        draft = repository.ai_drafts[0]
        self.assertEqual(draft.mode, "polish")
        self.assertEqual(draft.status, "generated")
        self.assertEqual(draft.cited_chunk_ids, ())
        self.assertEqual(draft.input_excerpt_hash, hashlib.sha256("这段话需要润色".encode("utf-8")).hexdigest())
        self.assertTrue(draft.prompt_summary.startswith("mode=polish"))
        self.assertNotIn("这段话需要润色", draft.prompt_summary)

    def test_polish_rejects_blank_selection(self) -> None:
        repository = DemoRepository()
        target = _make_doc(repository, 1, DocumentPermission.TEAM, ["原文"])
        with self.assertRaises(PolishValidationError):
            polish_selection(
                repository, 1, 10, target.id, PolishRequest(mode="polish", selection_md="   "), chat_fn=lambda s, u: "x"
            )

    def test_polish_rejects_invalid_mode(self) -> None:
        repository = DemoRepository()
        target = _make_doc(repository, 1, DocumentPermission.TEAM, ["原文"])
        with self.assertRaises(PolishValidationError):
            polish_selection(
                repository, 1, 10, target.id, PolishRequest(mode="summary", selection_md="片段"), chat_fn=lambda s, u: "x"
            )

    def test_polish_llm_failure_raises_and_stores_nothing(self) -> None:
        repository = DemoRepository()
        target = _make_doc(repository, 1, DocumentPermission.TEAM, ["原文"])

        def raising(system_prompt: str, user_prompt: str) -> str:
            raise RuntimeError("LLM down")

        with self.assertRaises(LlmUnavailableError):
            polish_selection(repository, 1, 10, target.id, PolishRequest(mode="polish", selection_md="片段"), chat_fn=raising)
        # 不编造、不落 generated：失败时一行草稿都不存。
        self.assertEqual(len(repository.ai_drafts), 0)

    def test_polish_unconfigured_llm_raises_and_stores_nothing(self) -> None:
        from backend.service import llm_adapter

        repository = DemoRepository()
        target = _make_doc(repository, 1, DocumentPermission.TEAM, ["原文"])
        disabled = llm_adapter.LlmConfig(provider="mock", base_url="", api_key="", model="")

        with patch.object(llm_adapter, "load_config", return_value=disabled):
            with self.assertRaises(LlmUnavailableError):
                polish_selection(repository, 1, 10, target.id, PolishRequest(mode="polish", selection_md="片段"))
        self.assertEqual(len(repository.ai_drafts), 0)

    def test_polish_not_writable_external_doc_raises_access_error(self) -> None:
        repository = DemoRepository()
        external = _make_doc(repository, 1, DocumentPermission.EXTERNAL, ["外部片段"])  # owner=alice
        # kira(2) 是空间成员：可看 external，但 external 仅 owner 可写 → 4003。
        with self.assertRaises(DocumentAccessError):
            polish_selection(repository, 2, 10, external.id, PolishRequest(mode="polish", selection_md="片段"), chat_fn=lambda s, u: "x")

    def test_polish_invisible_private_doc_raises_not_found(self) -> None:
        repository = DemoRepository()
        private = _make_doc(repository, 1, DocumentPermission.PRIVATE, ["私密片段"])  # owner=alice
        # kira(2) 看不到 alice 的 private → DocumentNotFoundError（不泄露存在性）。
        with self.assertRaises(DocumentNotFoundError):
            polish_selection(repository, 2, 10, private.id, PolishRequest(mode="polish", selection_md="片段"), chat_fn=lambda s, u: "x")

    def test_citation_sources_only_visible_chunks_and_keep_private_out_of_prompt(self) -> None:
        repository = DemoRepository()
        # user1 拥有一篇 team（含「共享锚点 alpha」）和一篇 private（含「私密锚点 alpha」）。
        team_source = _make_doc(repository, 1, DocumentPermission.TEAM, ["共享锚点 alpha 是 100。"])
        _make_doc(repository, 1, DocumentPermission.PRIVATE, ["私密锚点 alpha 是 42。"])
        # user2(kira) 的可写目标文档（citation 检索的是全空间可见 chunk，不是目标文档）。
        target = _make_doc(repository, 2, DocumentPermission.TEAM, ["目标文档无锚点"])

        captured: dict[str, str] = {}

        def chat_fn(system_prompt: str, user_prompt: str) -> str:
            captured["system"] = system_prompt
            captured["user"] = user_prompt
            return "引用撰写结果"

        view = polish_selection(
            repository,
            2,
            10,
            target.id,
            PolishRequest(mode="citation", selection_md="帮我引用 alpha 相关内容", instruction="引用 alpha"),
            chat_fn=chat_fn,
        )

        # sources 全部来自可见 chunk（team_source）；private 文档不进 sources。
        self.assertEqual(len(view.sources), 1)
        self.assertEqual(view.sources[0].document_id, team_source.id)
        team_chunk_id = repository.list_document_chunks(team_source.id)[0].id
        self.assertEqual(view.sources[0].chunk_id, team_chunk_id)

        # 红线：越权 chunk 不进 prompt、不返回。
        self.assertNotIn("私密", captured["user"])
        self.assertIn("共享锚点", captured["user"])

        # cited_chunk_ids 仅可见 chunk，落库一致。
        draft = repository.ai_drafts[0]
        self.assertEqual(draft.mode, "citation")
        self.assertEqual(draft.cited_chunk_ids, (team_chunk_id,))

    def test_citation_no_visible_sources_skips_llm_and_returns_not_found_message(self) -> None:
        repository = DemoRepository()
        target = _make_doc(repository, 1, DocumentPermission.TEAM, ["无关内容 xyz"])  # 无匹配 chunk

        called = {"count": 0}

        def chat_fn(system_prompt: str, user_prompt: str) -> str:
            called["count"] += 1
            return "should not be used"

        view = polish_selection(
            repository,
            1,
            10,
            target.id,
            PolishRequest(mode="citation", selection_md="完全不存在的查询 zzqqxx123"),
            chat_fn=chat_fn,
        )

        self.assertEqual(view.output_md, "未找到可引用来源")
        self.assertEqual(view.sources, ())
        self.assertEqual(view.status, "generated")
        self.assertEqual(called["count"], 0)  # 无来源时不调 LLM（省外发、不编造）


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class AiPolishApiTest(unittest.TestCase):
    """API-028 error-code mapping against real PostgreSQL (skipped if unreachable)."""

    @classmethod
    def setUpClass(cls) -> None:
        try:
            from backend.service.db import init_db

            init_db()  # migrations are CREATE IF NOT EXISTS + ON CONFLICT DO NOTHING → idempotent
        except Exception as exc:  # pragma: no cover - env-dependent
            raise unittest.SkipTest(f"PostgreSQL not available: {exc}") from exc

    def _token(self, external_id: str = "alice", space_id: int = 10) -> str:
        from backend.api.auth import LoginRequest, login

        return f"Bearer {login(LoginRequest(external_id=external_id, current_space_id=space_id))['data']['token']}"

    def _create_doc(self, authorization: str, title: str, permission: str) -> int:
        from backend.api.documents import DocumentWriteRequest, create_document_endpoint

        return create_document_endpoint(
            DocumentWriteRequest(title=title, content_md="正文片段", permission=permission),
            authorization=authorization,
        )["data"]["id"]

    def test_polish_api_happy_path_with_mocked_llm(self) -> None:
        from backend.api.documents import PolishRequestBody, polish_document_endpoint
        from backend.service import llm_adapter

        authorization = self._token()
        document_id = self._create_doc(authorization, "Polish Happy", "team")
        enabled = llm_adapter.LlmConfig(provider="glm", base_url="http://x/v1", api_key="k", model="glm-5.2")

        with patch.object(llm_adapter, "load_config", return_value=enabled), patch.object(
            llm_adapter, "chat", return_value="润色后的文本"
        ):
            response = polish_document_endpoint(
                document_id,
                PolishRequestBody(mode="polish", selection_md="原文片段"),
                authorization=authorization,
            )

        self.assertEqual(response["code"], 0)
        self.assertEqual(response["data"]["output_md"], "润色后的文本")
        self.assertEqual(response["data"]["status"], "generated")
        self.assertEqual(response["data"]["sources"], [])
        self.assertIsInstance(response["data"]["draft_id"], int)

    def test_polish_api_returns_5030_when_llm_unavailable(self) -> None:
        from fastapi import HTTPException

        from backend.api.documents import PolishRequestBody, polish_document_endpoint

        authorization = self._token()
        document_id = self._create_doc(authorization, "Polish 5030", "team")

        with self.assertRaises(HTTPException) as context:
            polish_document_endpoint(
                document_id,
                PolishRequestBody(mode="polish", selection_md="原文片段"),
                authorization=authorization,
            )

        self.assertEqual(context.exception.status_code, 503)
        self.assertEqual(context.exception.detail["code"], 5030)

    def test_polish_api_rejects_invalid_request(self) -> None:
        from fastapi import HTTPException

        from backend.api.documents import PolishRequestBody, polish_document_endpoint

        authorization = self._token()
        document_id = self._create_doc(authorization, "Polish 4220", "team")

        with self.assertRaises(HTTPException) as context:
            polish_document_endpoint(
                document_id,
                PolishRequestBody(mode="polish", selection_md="   "),
                authorization=authorization,
            )

        self.assertEqual(context.exception.status_code, 422)
        self.assertEqual(context.exception.detail["code"], 4220)

    def test_polish_api_rejects_bad_token(self) -> None:
        from fastapi import HTTPException

        from backend.api.documents import PolishRequestBody, polish_document_endpoint

        with self.assertRaises(HTTPException) as context:
            polish_document_endpoint(
                1,
                PolishRequestBody(mode="polish", selection_md="片段"),
                authorization="Bearer not-a-token",
            )

        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail["code"], 4001)

    def test_polish_api_not_found_for_invisible_private_doc(self) -> None:
        from fastapi import HTTPException

        from backend.api.documents import PolishRequestBody, polish_document_endpoint

        alice = self._token("alice", 10)
        document_id = self._create_doc(alice, "Alice Private", "private")
        kira = self._token("kira", 10)  # kira 看不到 alice 的 private → 4004

        with self.assertRaises(HTTPException) as context:
            polish_document_endpoint(document_id, PolishRequestBody(mode="polish", selection_md="片段"), authorization=kira)

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], 4004)

    def test_polish_api_forbidden_on_external_doc_for_non_owner(self) -> None:
        from fastapi import HTTPException

        from backend.api.documents import PolishRequestBody, polish_document_endpoint

        alice = self._token("alice", 10)
        document_id = self._create_doc(alice, "Alice External", "external")
        kira = self._token("kira", 10)  # kira 可看 external 但不可写（owner-only）→ 4003

        with self.assertRaises(HTTPException) as context:
            polish_document_endpoint(document_id, PolishRequestBody(mode="polish", selection_md="片段"), authorization=kira)

        self.assertEqual(context.exception.status_code, 403)
        self.assertEqual(context.exception.detail["code"], 4003)


if __name__ == "__main__":
    unittest.main()
