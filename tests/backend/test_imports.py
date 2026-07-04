import unittest


class ImportServiceTest(unittest.TestCase):
    def test_import_extracted_text_creates_document_and_chunks(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.service.demo_repository import DemoRepository
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
        from backend.service.demo_repository import DemoRepository
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
        from backend.service.demo_repository import DemoRepository
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
        from backend.service.demo_repository import DemoRepository
        from backend.service.imports import ImportTextRequest, ImportValidationError, import_extracted_text

        with self.assertRaises(ImportValidationError) as context:
            import_extracted_text(
                repository=DemoRepository(),
                user_id=3,
                current_space_id=10,
                request=ImportTextRequest(filename="demo.txt", content=b"demo"),
            )

        self.assertEqual(str(context.exception), "space access denied")


if __name__ == "__main__":
    unittest.main()
