import unittest


class ImportServiceTest(unittest.TestCase):
    def test_import_extracted_text_creates_document_and_chunks(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import ImportTextRequest, import_extracted_text

        repository = DemoRepository()
        content = b"# Imported\n\nFirst paragraph.\n\nSecond paragraph."

        result = import_extracted_text(
            repository=repository,
            user_id=1,
            current_space_id=10,
            request=ImportTextRequest(
                filename="demo.md",
                content=content,
                title="Imported Demo",
                permission=DocumentPermission.TEAM,
            ),
        )

        document = repository.require_document(result.parsed_doc_id)
        chunks = repository.list_document_chunks(result.parsed_doc_id)

        self.assertEqual(result.import_job.status, "done")
        self.assertEqual(result.import_job.parsed_doc_id, document.id)
        self.assertEqual(result.chunk_count, len(chunks))
        self.assertEqual(document.title, "Imported Demo")
        self.assertEqual(document.content_md, "# Imported\n\nFirst paragraph.\n\nSecond paragraph.")
        self.assertEqual(chunks[0].ordinal, 1)
        self.assertIn("First paragraph", chunks[0].text)

    def test_import_rejects_unsupported_file_type(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import ImportTextRequest, ImportValidationError, import_extracted_text

        with self.assertRaises(ImportValidationError) as context:
            import_extracted_text(
                repository=DemoRepository(),
                user_id=1,
                current_space_id=10,
                request=ImportTextRequest(filename="demo.pdf", content=b"text"),
            )

        self.assertIn("only pre-extracted", str(context.exception))

    def test_import_rejects_empty_text(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import ImportTextRequest, ImportValidationError, import_extracted_text

        with self.assertRaises(ImportValidationError) as context:
            import_extracted_text(
                repository=DemoRepository(),
                user_id=1,
                current_space_id=10,
                request=ImportTextRequest(filename="empty.txt", content=b"\n\n"),
            )

        self.assertEqual(str(context.exception), "uploaded text is empty")

    def test_import_rejects_non_member_space(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import ImportTextRequest, ImportValidationError, import_extracted_text

        with self.assertRaises(ImportValidationError) as context:
            import_extracted_text(
                repository=DemoRepository(),
                user_id=3,
                current_space_id=10,
                request=ImportTextRequest(filename="demo.txt", content=b"demo"),
            )

        self.assertEqual(str(context.exception), "space access denied")

    def test_import_batch_uses_relative_path_titles(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import BatchImportFileRequest, BatchImportRequest, import_batch

        repository = DemoRepository()

        result = import_batch(
            repository=repository,
            user_id=1,
            current_space_id=10,
            request=BatchImportRequest(
                files=[
                    BatchImportFileRequest(
                        filename="readme.md",
                        relative_path="docs/team/readme.md",
                        content=b"# Readme\n\nAlpha context.",
                    ),
                    BatchImportFileRequest(
                        filename="notes.txt",
                        relative_path="notes.txt",
                        content=b"Plain text context.",
                    ),
                ],
                permission=DocumentPermission.TEAM,
            ),
        )

        titles = [repository.require_document(item.parsed_doc_id).title for item in result.items if item.parsed_doc_id]

        self.assertEqual(result.total, 2)
        self.assertEqual(result.success_count, 2)
        self.assertEqual(result.failed_count, 0)
        self.assertEqual(result.skipped_count, 0)
        self.assertEqual(titles, ["docs/team/readme", "notes"])
        self.assertEqual(result.items[0].relative_path, "docs/team/readme.md")

    def test_import_batch_documents_are_searchable_and_queryable(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import BatchImportFileRequest, BatchImportRequest, import_batch
        from backend.service.rag import answer_question
        from backend.service.search import search_documents

        repository = DemoRepository()

        result = import_batch(
            repository=repository,
            user_id=1,
            current_space_id=10,
            request=BatchImportRequest(
                files=[
                    BatchImportFileRequest(
                        filename="alpha.md",
                        relative_path="folder/alpha.md",
                        content="批量导入专项关键词是 OrionBatch。".encode("utf-8"),
                    )
                ],
                permission=DocumentPermission.TEAM,
            ),
        )

        search_result = search_documents(repository, user_id=1, current_space_id=10, query="OrionBatch")
        answer = answer_question(repository, user_id=1, current_space_id=10, question="OrionBatch 是什么？")

        self.assertEqual(result.success_count, 1)
        self.assertEqual(search_result.total, 1)
        self.assertEqual(search_result.items[0].doc_id, result.items[0].parsed_doc_id)
        self.assertEqual(answer.sources[0].doc_id, result.items[0].parsed_doc_id)

    def test_import_batch_isolates_file_failures(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import BatchImportFileRequest, BatchImportRequest, import_batch

        repository = DemoRepository()

        result = import_batch(
            repository=repository,
            user_id=1,
            current_space_id=10,
            request=BatchImportRequest(
                files=[
                    BatchImportFileRequest(filename="good.md", content=b"# Good\n\nSearchable text."),
                    BatchImportFileRequest(filename="bad.pdf", content=b"pdf text"),
                    BatchImportFileRequest(filename="empty.txt", content=b"\n\n"),
                ],
                permission=DocumentPermission.TEAM,
            ),
        )

        self.assertEqual(result.success_count, 1)
        self.assertEqual(result.failed_count, 2)
        self.assertEqual(result.skipped_count, 0)
        self.assertEqual(result.items[0].status, "done")
        self.assertEqual(result.items[1].status, "failed")
        self.assertIn("only pre-extracted", result.items[1].error)
        self.assertEqual(result.items[2].status, "failed")
        self.assertEqual(result.items[2].error, "uploaded text is empty")
        self.assertEqual(repository.require_document(result.items[0].parsed_doc_id).title, "good")

    def test_import_batch_skips_duplicate_titles(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.imports import BatchImportFileRequest, BatchImportRequest, import_batch

        repository = DemoRepository()

        first_result = import_batch(
            repository=repository,
            user_id=1,
            current_space_id=10,
            request=BatchImportRequest(
                files=[
                    BatchImportFileRequest(
                        filename="readme.md",
                        relative_path="docs/readme.md",
                        content=b"# Readme\n\nFirst version.",
                    )
                ],
                permission=DocumentPermission.TEAM,
            ),
        )
        second_result = import_batch(
            repository=repository,
            user_id=1,
            current_space_id=10,
            request=BatchImportRequest(
                files=[
                    BatchImportFileRequest(
                        filename="other.md",
                        relative_path="docs/readme.md",
                        content=b"# Readme\n\nSecond version.",
                    )
                ],
                permission=DocumentPermission.TEAM,
            ),
        )

        self.assertEqual(first_result.success_count, 1)
        self.assertEqual(second_result.success_count, 0)
        self.assertEqual(second_result.skipped_count, 1)
        self.assertEqual(second_result.items[0].status, "skipped")
        self.assertEqual(second_result.items[0].title, "docs/readme")
        self.assertIn("already exists", second_result.items[0].error)


if __name__ == "__main__":
    unittest.main()
