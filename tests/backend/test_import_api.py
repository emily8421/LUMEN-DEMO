import importlib.util
import unittest


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class ImportApiTest(unittest.TestCase):
    def test_import_batch_api_returns_itemized_results(self) -> None:
        import asyncio

        from backend.api import documents as documents_api
        from backend.api import imports as imports_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        original_repository = imports_api.repository
        original_documents_repository = documents_api.repository
        repository = DemoRepository()
        imports_api.repository = repository
        documents_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            authorization = f"Bearer {token}"

            class FakeUploadFile:
                def __init__(self, filename: str, content: bytes) -> None:
                    self.filename = filename
                    self.content = content

                async def read(self) -> bytes:
                    return self.content

            response = asyncio.run(
                imports_api.import_batch_endpoint(
                    files=[
                        FakeUploadFile("readme.md", b"# Readme\n\nBatch imported."),
                        FakeUploadFile("blocked.pdf", b"text"),
                    ],
                    relative_paths=["docs/team/readme.md", "blocked.pdf"],
                    conflict_policy="skip",
                    permission="team",
                    authorization=authorization,
                )
            )
            data = response["data"]
            imported_id = data["items"][0]["parsed_doc_id"]
            list_response = documents_api.list_documents(authorization=authorization)
            detail_response = documents_api.get_document_endpoint(imported_id, authorization=authorization)
        finally:
            imports_api.repository = original_repository
            documents_api.repository = original_documents_repository

        listed_import = next(document for document in list_response["data"] if document["id"] == imported_id)

        self.assertEqual(data["total"], 2)
        self.assertEqual(data["success_count"], 1)
        self.assertEqual(data["failed_count"], 1)
        self.assertEqual(data["skipped_count"], 0)
        self.assertEqual(data["items"][0]["title"], "readme")
        self.assertEqual(data["items"][0]["status"], "done")
        self.assertIsNotNone(data["items"][0]["folder_id"])
        self.assertEqual(listed_import["folder_id"], data["items"][0]["folder_id"])
        self.assertEqual(detail_response["data"]["folder_id"], data["items"][0]["folder_id"])
        self.assertEqual(data["items"][1]["status"], "failed")


if __name__ == "__main__":
    unittest.main()
