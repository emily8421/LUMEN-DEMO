import unittest

from backend.model.entities import DocumentChunk, DocumentPermission
from backend.repository.demo_repository import DemoRepository
from backend.service.document import DocumentCreate, create_document
from backend.service.search import SearchValidationError, search_documents


class SearchServiceTest(unittest.TestCase):
    def test_search_matches_visible_import_chunks(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Sprint Search Note",
                content_md="Nova search keyword appears here.",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["Nova search keyword appears here."])

        result_page = search_documents(repository, user_id=1, current_space_id=10, query="keyword")

        self.assertEqual(result_page.total, 1)
        self.assertEqual(result_page.items[0].doc_id, document.id)
        self.assertEqual(result_page.items[0].title, "Sprint Search Note")
        self.assertIn("keyword", result_page.items[0].snippet)

    def test_search_filters_private_documents_for_other_member(self) -> None:
        repository = DemoRepository()
        private_document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Private Search Note",
                content_md="owner-only-secret",
                permission=DocumentPermission.PRIVATE,
            ),
        )
        repository.replace_document_chunks(private_document.id, ["owner-only-secret"])

        owner_results = search_documents(repository, user_id=1, current_space_id=10, query="secret")
        other_member_results = search_documents(repository, user_id=2, current_space_id=10, query="secret")

        self.assertEqual(owner_results.total, 1)
        self.assertEqual(other_member_results.total, 0)

    def test_search_matches_visible_document_title(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Title Only Keyword",
                content_md="正文没有目标词。",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["正文没有目标词。"])

        result_page = search_documents(repository, user_id=1, current_space_id=10, query="title only")

        self.assertEqual(result_page.total, 1)
        self.assertEqual(result_page.items[0].doc_id, document.id)
        self.assertEqual(result_page.items[0].snippet, "标题匹配：Title Only Keyword")

    def test_search_title_match_keeps_private_document_filtered(self) -> None:
        repository = DemoRepository()
        create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Private Title Keyword",
                content_md="公开正文。",
                permission=DocumentPermission.PRIVATE,
            ),
        )

        owner_results = search_documents(repository, user_id=1, current_space_id=10, query="private title")
        other_member_results = search_documents(repository, user_id=2, current_space_id=10, query="private title")

        self.assertEqual(owner_results.total, 1)
        self.assertEqual(other_member_results.total, 0)

    def test_search_filters_current_space(self) -> None:
        repository = DemoRepository()
        nova_document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Nova Only",
                content_md="shared phrase nova",
                permission=DocumentPermission.TEAM,
            ),
        )
        brightlite_document = create_document(
            repository,
            user_id=3,
            current_space_id=20,
            request=DocumentCreate(
                title="BrightLite Only",
                content_md="shared phrase brightlite",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(nova_document.id, ["shared phrase nova"])
        repository.replace_document_chunks(brightlite_document.id, ["shared phrase brightlite"])

        result_page = search_documents(repository, user_id=1, current_space_id=10, query="shared phrase")

        self.assertEqual(result_page.total, 1)
        self.assertEqual(result_page.items[0].doc_id, nova_document.id)

    def test_search_includes_vector_recall_without_keyword_overlap(self) -> None:
        class VectorRecallRepository(DemoRepository):
            def recall_chunks(
                self,
                document_ids: list[int],
                query: str,
                limit: int,
                threshold: float = 0.6,
            ) -> list[DocumentChunk]:
                del query, threshold
                return [
                    chunk
                    for chunk in self.list_all_document_chunks()
                    if chunk.document_id in document_ids
                ][:limit]

        repository = VectorRecallRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(
                title="Semantic Search Note",
                content_md="交付延期通常来自排期风险和资源冲突。",
                permission=DocumentPermission.TEAM,
            ),
        )
        repository.replace_document_chunks(document.id, ["交付延期通常来自排期风险和资源冲突。"])

        result_page = search_documents(repository, user_id=1, current_space_id=10, query="项目进度原因")

        self.assertEqual(result_page.total, 1)
        self.assertEqual(result_page.items[0].doc_id, document.id)
        self.assertIn("交付延期", result_page.items[0].snippet)

    def test_search_rejects_blank_query(self) -> None:
        with self.assertRaises(SearchValidationError) as context:
            search_documents(DemoRepository(), user_id=1, current_space_id=10, query="  ")

        self.assertEqual(str(context.exception), "query is required")


if __name__ == "__main__":
    unittest.main()
