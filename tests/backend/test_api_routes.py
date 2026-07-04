import importlib.util
import unittest


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class ApiRouteTest(unittest.TestCase):
    def test_login_list_spaces_and_switch_space(self) -> None:
        from backend.api.auth import LoginRequest, login
        from backend.api.spaces import SwitchSpaceRequest, list_spaces, switch_space_endpoint

        login_response = login(LoginRequest(external_id="alice", current_space_id=10))
        token = login_response["data"]["token"]
        authorization = f"Bearer {token}"

        spaces_response = list_spaces(authorization=authorization)
        switch_response = switch_space_endpoint(
            SwitchSpaceRequest(space_id=20),
            authorization=authorization,
        )

        self.assertEqual(login_response["code"], 0)
        self.assertEqual([space["code"] for space in spaces_response["data"]], ["nova-internal", "brightlite-team"])
        self.assertEqual(switch_response["data"]["current_space_id"], 20)
        self.assertIn("token", switch_response["data"])

    def test_document_crud_versions_and_restore(self) -> None:
        from backend.api.auth import LoginRequest, login
        from backend.api.documents import (
            DocumentWriteRequest,
            create_document_endpoint,
            get_document_endpoint,
            list_document_versions,
            list_documents,
            restore_document_version,
            update_document_endpoint,
        )

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        created_response = create_document_endpoint(
            DocumentWriteRequest(title="Sprint-2 Demo", content_md="v1", permission="team"),
            authorization=authorization,
        )
        document_id = created_response["data"]["id"]

        for version_no in range(2, 5):
            update_document_endpoint(
                document_id,
                DocumentWriteRequest(title="Sprint-2 Demo", content_md=f"v{version_no}", permission="team"),
                authorization=authorization,
            )

        list_response = list_documents(authorization=authorization)
        detail_response = get_document_endpoint(document_id, authorization=authorization)
        versions_response = list_document_versions(document_id, authorization=authorization)
        restored_response = restore_document_version(document_id, 2, authorization=authorization)

        self.assertIn(document_id, [document["id"] for document in list_response["data"]])
        self.assertEqual(detail_response["data"]["current_version"], 4)
        self.assertEqual([version["version_no"] for version in versions_response["data"]], [1, 2, 3, 4])
        self.assertEqual(restored_response["data"]["current_version"], 2)
        self.assertEqual(restored_response["data"]["content_md"], "v2")

    def test_document_api_returns_not_found_for_invisible_document(self) -> None:
        from fastapi import HTTPException

        from backend.api.auth import LoginRequest, login
        from backend.api.documents import get_document_endpoint, list_document_versions

        token = login(LoginRequest(external_id="alice", current_space_id=20))["data"]["token"]
        authorization = f"Bearer {token}"

        with self.assertRaises(HTTPException) as detail_context:
            get_document_endpoint(200, authorization=authorization)
        with self.assertRaises(HTTPException) as versions_context:
            list_document_versions(200, authorization=authorization)

        self.assertEqual(detail_context.exception.status_code, 404)
        self.assertEqual(detail_context.exception.detail["msg"], "document not found")
        self.assertEqual(versions_context.exception.status_code, 404)
        self.assertEqual(versions_context.exception.detail["msg"], "document not found")

    def test_document_api_delete_then_read_returns_not_found(self) -> None:
        from fastapi import HTTPException

        from backend.api.auth import LoginRequest, login
        from backend.api.documents import DocumentWriteRequest, create_document_endpoint, delete_document_endpoint, get_document_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"
        created_response = create_document_endpoint(
            DocumentWriteRequest(title="Delete Me", content_md="content", permission="private"),
            authorization=authorization,
        )
        document_id = created_response["data"]["id"]

        delete_response = delete_document_endpoint(document_id, authorization=authorization)
        with self.assertRaises(HTTPException) as context:
            get_document_endpoint(document_id, authorization=authorization)

        self.assertTrue(delete_response["data"]["deleted"])
        self.assertEqual(context.exception.status_code, 404)

    def test_document_api_restore_missing_version_returns_not_found(self) -> None:
        from fastapi import HTTPException

        from backend.api.auth import LoginRequest, login
        from backend.api.documents import DocumentWriteRequest, create_document_endpoint, restore_document_version

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"
        created_response = create_document_endpoint(
            DocumentWriteRequest(title="Missing Version", content_md="v1", permission="team"),
            authorization=authorization,
        )

        with self.assertRaises(HTTPException) as context:
            restore_document_version(created_response["data"]["id"], 99, authorization=authorization)

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["msg"], "version not found")

    def test_import_api_degraded_text_creates_readable_document(self) -> None:
        import asyncio

        from backend.api.auth import LoginRequest, login
        from backend.api.documents import get_document_endpoint
        from backend.api.imports import import_file_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        class FakeUploadFile:
            filename = "imported.md"

            async def read(self) -> bytes:
                return b"# Imported\n\nDegraded Sprint-3 text."

        import_response = asyncio.run(
            import_file_endpoint(
                file=FakeUploadFile(),
                title="Imported From API",
                permission="team",
                authorization=authorization,
            )
        )
        document_id = import_response["data"]["parsed_doc_id"]
        detail_response = get_document_endpoint(document_id, authorization=authorization)

        self.assertEqual(import_response["data"]["status"], "done")
        self.assertEqual(import_response["data"]["mode"], "degraded_text")
        self.assertGreaterEqual(import_response["data"]["chunk_count"], 1)
        self.assertEqual(detail_response["data"]["title"], "Imported From API")
        self.assertIn("Degraded Sprint-3 text", detail_response["data"]["content_md"])

    def test_import_api_rejects_unsupported_file_type(self) -> None:
        import asyncio

        from fastapi import HTTPException

        from backend.api.auth import LoginRequest, login
        from backend.api.imports import import_file_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        class FakeUploadFile:
            filename = "blocked.pdf"

            async def read(self) -> bytes:
                return b"text"

        with self.assertRaises(HTTPException) as context:
            asyncio.run(import_file_endpoint(file=FakeUploadFile(), authorization=authorization))

        self.assertEqual(context.exception.status_code, 422)
        self.assertEqual(context.exception.detail["code"], 4220)


if __name__ == "__main__":
    unittest.main()
