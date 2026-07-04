import unittest

from backend.model.entities import DocumentPermission
from backend.service.demo_repository import DemoRepository
from backend.service.document import DocumentCreate, create_document
from backend.service.rag import NOT_FOUND_ANSWER, RagValidationError, answer_question


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
        self.assertEqual(len(answer.sources), 1)
        self.assertEqual(answer.sources[0].doc_id, document.id)
        self.assertEqual(answer.sources[0].title, "Latency Note")

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

    def test_answer_question_rejects_blank_question(self) -> None:
        with self.assertRaises(RagValidationError) as context:
            answer_question(DemoRepository(), user_id=1, current_space_id=10, question="  ")

        self.assertEqual(str(context.exception), "question is required")


if __name__ == "__main__":
    unittest.main()
