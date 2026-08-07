import unittest

from backend.model.entities import DocumentPermission, TermStatus
from backend.repository.demo_repository import DemoRepository
from backend.service.document import DocumentCreate, create_document
from backend.service.rag import NOT_FOUND_ANSWER, RagValidationError, answer_question
from backend.service.term import TermWrite, create_term


class RagServiceTest(unittest.TestCase):
    def test_answer_question_returns_degraded_answer_with_sources(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Latency Note",
                content_md="场景联动触发延迟是 280ms。",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["场景联动触发延迟是 280ms。"])

        answer = answer_question(repository, user_id=1, current_space_id=10, question="场景联动触发延迟是多少？")

        self.assertIn("降级模式", answer.answer)
        self.assertIn("280ms", answer.answer)
        document_sources = [source for source in answer.sources if source.source_type == "document"]
        self.assertEqual(len(document_sources), 1)
        self.assertEqual(document_sources[0].doc_id, document.id)
        self.assertEqual(document_sources[0].title, "Latency Note")

    def test_answer_question_returns_not_found_without_candidates(self) -> None:
        answer = answer_question(DemoRepository(), user_id=1, current_space_id=10, question="不存在的问题")

        self.assertEqual(answer.answer, NOT_FOUND_ANSWER)
        self.assertEqual(answer.sources, [])

    def test_answer_question_filters_private_documents_for_other_member(self) -> None:
        repository = DemoRepository()
        private_document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Private RAG Note",
                content_md="内部预算金额是 42。",
                permission=DocumentPermission.PRIVATE,
            ),
        )
        repository.replace_document_chunks(private_document.id, ["内部预算金额是 42。"])

        owner_answer = answer_question(repository, user_id=1, current_space_id=10, question="内部预算金额是多少？")
        other_member_answer = answer_question(repository, user_id=2, current_space_id=10, question="内部预算金额是多少？")

        self.assertEqual(len(owner_answer.sources), 1)
        self.assertEqual(other_member_answer.answer, NOT_FOUND_ANSWER)
        self.assertEqual(other_member_answer.sources, [])

    def test_answer_question_can_reference_visible_title_match(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Title Only RAG Keyword",
                content_md="正文没有目标词。",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["正文没有目标词。"])

        answer = answer_question(repository, user_id=1, current_space_id=10, question="Title Only RAG 是什么")

        self.assertIn("仅命中文档标题", answer.answer)
        self.assertEqual(answer.sources[0].doc_id, document.id)
        self.assertEqual(answer.sources[0].snippet, "标题匹配：Title Only RAG Keyword")

    def test_answer_question_title_match_keeps_private_document_filtered(self) -> None:
        repository = DemoRepository()
        create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Private RAG Title Keyword",
                content_md="公开正文。",
                permission=DocumentPermission.PRIVATE,
            ),
        )

        owner_answer = answer_question(repository, user_id=1, current_space_id=10, question="Private RAG Title 是什么")
        other_member_answer = answer_question(repository, user_id=2, current_space_id=10, question="Private RAG Title 是什么")

        self.assertEqual(len(owner_answer.sources), 1)
        self.assertEqual(other_member_answer.answer, NOT_FOUND_ANSWER)
        self.assertEqual(other_member_answer.sources, [])

    def test_answer_question_rejects_blank_question(self) -> None:
        with self.assertRaises(RagValidationError) as context:
            answer_question(DemoRepository(), user_id=1, current_space_id=10, question="  ")

        self.assertEqual(str(context.exception), "question is required")

    def test_answer_question_injects_space_term_source(self) -> None:
        repository = DemoRepository()
        create_term(
            repository,
            user_id=1,
            current_space_id=10,
            request=TermWrite(term="触发延迟", definition="空间定义：从条件满足到指令发出", aliases=[], status=TermStatus.CONFIRMED),
        )
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Latency Note",
                content_md="场景联动触发延迟是 280ms。",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["场景联动触发延迟是 280ms。"])

        answer = answer_question(repository, user_id=1, current_space_id=10, question="触发延迟是多少？")

        self.assertIn("按当前空间术语解释", answer.answer)
        self.assertIn("空间定义", answer.answer)
        self.assertIn("term", [source.source_type for source in answer.sources])

    def test_answer_question_returns_term_source_without_document_candidate(self) -> None:
        repository = DemoRepository()
        create_term(
            repository,
            user_id=1,
            current_space_id=10,
            request=TermWrite(term="验收术语", definition="空间术语定义", aliases=["术语验收"], status=TermStatus.CONFIRMED),
        )

        answer = answer_question(repository, user_id=1, current_space_id=10, question="术语验收 是什么")

        self.assertIn("按当前空间术语解释", answer.answer)
        self.assertIn("空间术语定义", answer.answer)
        self.assertEqual([source.source_type for source in answer.sources], ["term"])

    def test_build_answer_uses_llm_when_chat_fn_provided(self) -> None:
        from backend.service.rag import RagSource, _build_answer

        sources = [RagSource(doc_id=1, title="延迟笔记", snippet="场景联动触发延迟是 280ms。")]
        answer = _build_answer(
            sources, [], "触发延迟是多少？", lambda system, user: "根据来源，触发延迟为 280ms。"
        )
        self.assertEqual(answer, "根据来源，触发延迟为 280ms。")

    def test_build_answer_falls_back_to_degraded_on_llm_error(self) -> None:
        from backend.service.rag import RagSource, _build_answer

        sources = [RagSource(doc_id=1, title="延迟笔记", snippet="场景联动触发延迟是 280ms。")]

        def raising(system, user):
            raise RuntimeError("LLM down")

        answer = _build_answer(sources, [], "触发延迟是多少？", raising)
        self.assertIn("降级模式", answer)
        self.assertIn("280ms", answer)

    # ---- 批3：AI 抽屉多轮（history） + 「基于知识库」开关（use_knowledge_base） ----

    def test_answer_question_without_knowledge_base_degrades_when_llm_missing(self) -> None:
        import os
        from unittest import mock

        with mock.patch.dict(os.environ, {"LLM_PROVIDER": "mock", "LLM_API_KEY": ""}):
            answer = answer_question(
                DemoRepository(), user_id=1, current_space_id=10, question="随便聊聊", use_knowledge_base=False
            )

        self.assertIn("降级模式", answer.answer)
        self.assertIn("通用对话不可用", answer.answer)
        self.assertEqual(answer.sources, [])

    def test_answer_without_knowledge_base_uses_chat_when_llm_configured(self) -> None:
        from backend.service.rag import _answer_without_knowledge_base
        from unittest import mock

        calls: list[tuple[str, str]] = []

        def fake_chat(system, user):
            calls.append((system, user))
            return "通用回答：你好"

        with mock.patch("backend.service.rag._resolve_chat_fn", return_value=fake_chat):
            answer = _answer_without_knowledge_base("你好", [{"role": "user", "content": "早上好"}, {"role": "assistant", "content": "你好"}] )

        self.assertEqual(answer.answer, "通用回答：你好")
        self.assertEqual(answer.sources, [])
        self.assertEqual(len(calls), 1)
        # 纯对话模式的 history 拼进 user prompt（对话上下文），不检索知识库。
        self.assertIn("对话历史", calls[0][1])
        self.assertIn("用户：早上好", calls[0][1])
        self.assertIn("助手：你好", calls[0][1])
        self.assertIn("当前问题：你好", calls[0][1])

    def test_answer_without_knowledge_base_degrades_on_chat_error(self) -> None:
        from backend.service.rag import _answer_without_knowledge_base
        from unittest import mock

        def raising(system, user):
            raise RuntimeError("LLM down")

        with mock.patch("backend.service.rag._resolve_chat_fn", return_value=raising):
            answer = _answer_without_knowledge_base("你好", None)

        self.assertIn("降级模式", answer.answer)
        self.assertEqual(answer.sources, [])

    def test_build_answer_embeds_history_into_system_prompt(self) -> None:
        from backend.service.rag import RagSource, _build_answer

        sources = [RagSource(doc_id=1, title="延迟笔记", snippet="场景联动触发延迟是 280ms。")]
        captured_system: list[str] = []

        def capture(system, user):
            captured_system.append(system)
            return "回答"

        answer = _build_answer(
            sources,
            [],
            "那再问一次？",
            capture,
            history=[{"role": "user", "content": "触发延迟是多少？"}, {"role": "assistant", "content": "280ms。"}],
        )
        self.assertEqual(answer, "回答")
        self.assertIn("对话历史", captured_system[0])
        self.assertIn("用户：触发延迟是多少？", captured_system[0])
        self.assertIn("助手：280ms。", captured_system[0])

    def test_answer_question_with_history_keeps_rag_retrieval(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Latency Note",
                content_md="场景联动触发延迟是 280ms。",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["场景联动触发延迟是 280ms。"])

        answer = answer_question(
            repository,
            user_id=1,
            current_space_id=10,
            question="触发延迟是多少？",
            history=[{"role": "user", "content": "之前的问题"}, {"role": "assistant", "content": "之前回答过"}],
        )

        self.assertIn("降级模式", answer.answer)
        document_sources = [source for source in answer.sources if source.source_type == "document"]
        self.assertEqual(len(document_sources), 1)

    def test_answer_question_not_found_with_history_still_not_found(self) -> None:
        answer = answer_question(
            DemoRepository(),
            user_id=1,
            current_space_id=10,
            question="不存在的问题",
            history=[{"role": "user", "content": "之前的问题"}],
        )

        self.assertEqual(answer.answer, NOT_FOUND_ANSWER)
        self.assertEqual(answer.sources, [])

    def test_answer_without_knowledge_base_passes_llm_provider(self) -> None:
        from unittest import mock

        from backend.service.rag import _answer_without_knowledge_base

        def fake_chat(system, user):
            return "ok"

        with mock.patch("backend.service.rag._resolve_chat_fn", return_value=fake_chat) as resolver:
            answer = _answer_without_knowledge_base("你好", None, "deepseek")

        self.assertEqual(answer.answer, "ok")
        resolver.assert_called_once_with("deepseek")


if __name__ == "__main__":
    unittest.main()
