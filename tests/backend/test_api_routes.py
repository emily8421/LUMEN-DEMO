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

    def test_search_api_returns_imported_text_hits(self) -> None:
        import asyncio

        from backend.api.auth import LoginRequest, login
        from backend.api.imports import import_file_endpoint
        from backend.api.search import search_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        class FakeUploadFile:
            filename = "searchable.md"

            async def read(self) -> bytes:
                return b"# Searchable\n\nSprint-4A degraded search target."

        import_response = asyncio.run(
            import_file_endpoint(
                file=FakeUploadFile(),
                title="Searchable Import",
                permission="team",
                authorization=authorization,
            )
        )

        search_response = search_endpoint(q="degraded search", authorization=authorization)

        self.assertEqual(search_response["code"], 0)
        self.assertEqual(search_response["data"]["total"], 1)
        self.assertEqual(search_response["data"]["items"][0]["doc_id"], import_response["data"]["parsed_doc_id"])
        self.assertEqual(search_response["data"]["items"][0]["title"], "Searchable Import")
        self.assertIn("degraded search", search_response["data"]["items"][0]["snippet"])

    def test_search_api_rejects_blank_query(self) -> None:
        from fastapi import HTTPException

        from backend.api.auth import LoginRequest, login
        from backend.api.search import search_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        with self.assertRaises(HTTPException) as context:
            search_endpoint(q=" ", authorization=authorization)

        self.assertEqual(context.exception.status_code, 422)
        self.assertEqual(context.exception.detail["code"], 4220)

    def test_query_api_returns_degraded_answer_with_sources(self) -> None:
        import asyncio

        from backend.api.auth import LoginRequest, login
        from backend.api.imports import import_file_endpoint
        from backend.api.rag import QueryRequest, query_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        class FakeUploadFile:
            filename = "rag-source.md"

            async def read(self) -> bytes:
                return "# RAG\n\n独有问答锚点 alpha-280 是 280ms。".encode("utf-8")

        import_response = asyncio.run(
            import_file_endpoint(
                file=FakeUploadFile(),
                title="RAG Source",
                permission="team",
                authorization=authorization,
            )
        )

        query_response = query_endpoint(
            QueryRequest(question="独有问答锚点 alpha-280 是多少？"),
            authorization=authorization,
        )

        self.assertEqual(query_response["code"], 0)
        self.assertIn("降级模式", query_response["data"]["answer"])
        self.assertIn("280ms", query_response["data"]["answer"])
        self.assertEqual(query_response["data"]["sources"][0]["doc_id"], import_response["data"]["parsed_doc_id"])
        self.assertEqual(query_response["data"]["sources"][0]["title"], "RAG Source")

    def test_query_api_returns_not_found_without_sources(self) -> None:
        from backend.api.auth import LoginRequest, login
        from backend.api.rag import QueryRequest, query_endpoint
        from backend.service.rag import NOT_FOUND_ANSWER

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        query_response = query_endpoint(QueryRequest(question="完全不存在的问题"), authorization=authorization)

        self.assertEqual(query_response["data"]["answer"], NOT_FOUND_ANSWER)
        self.assertEqual(query_response["data"]["sources"], [])

    def test_query_api_rejects_blank_question(self) -> None:
        from fastapi import HTTPException

        from backend.api.auth import LoginRequest, login
        from backend.api.rag import QueryRequest, query_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"

        with self.assertRaises(HTTPException) as context:
            query_endpoint(QueryRequest(question=" "), authorization=authorization)

        self.assertEqual(context.exception.status_code, 422)
        self.assertEqual(context.exception.detail["code"], 4220)

    def test_created_document_is_searchable_and_queryable(self) -> None:
        from backend.api.auth import LoginRequest, login
        from backend.api.documents import DocumentWriteRequest, create_document_endpoint
        from backend.api.rag import QueryRequest, query_endpoint
        from backend.api.search import search_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"
        created_response = create_document_endpoint(
            DocumentWriteRequest(
                title="Frontend Indexed Note",
                content_md="场景联动触发延迟是 280ms。\nSprint-4 smoke search target.",
                permission="team",
            ),
            authorization=authorization,
        )

        search_response = search_endpoint(q="smoke search", authorization=authorization)
        query_response = query_endpoint(QueryRequest(question="场景联动触发延迟是多少？"), authorization=authorization)

        self.assertEqual(search_response["data"]["total"], 1)
        self.assertEqual(search_response["data"]["items"][0]["doc_id"], created_response["data"]["id"])
        self.assertIn("280ms", query_response["data"]["answer"])
        self.assertEqual(query_response["data"]["sources"][0]["doc_id"], created_response["data"]["id"])

    def test_terms_api_crud_and_rag_term_source(self) -> None:
        from backend.api.auth import LoginRequest, login
        from backend.api.documents import DocumentWriteRequest, create_document_endpoint
        from backend.api.rag import QueryRequest, query_endpoint
        from backend.api.terms import TermWriteRequest, create_term_endpoint, delete_term_endpoint, list_terms_endpoint, update_term_endpoint

        token = login(LoginRequest(external_id="alice", current_space_id=10))["data"]["token"]
        authorization = f"Bearer {token}"
        create_document_endpoint(
            DocumentWriteRequest(title="Term Source", content_md="场景联动触发延迟是 280ms。", permission="team"),
            authorization=authorization,
        )
        created_response = create_term_endpoint(
            TermWriteRequest(
                term="触发延迟",
                definition="空间定义：从条件满足到指令发出",
                aliases=["开关延迟"],
                status="confirmed",
            ),
            authorization=authorization,
        )
        term_id = created_response["data"]["id"]

        list_response = list_terms_endpoint(authorization=authorization)
        query_response = query_endpoint(QueryRequest(question="触发延迟是多少？"), authorization=authorization)
        updated_response = update_term_endpoint(
            term_id,
            TermWriteRequest(term="触发延迟", definition="更新后的空间定义", aliases=[], status="pending"),
            authorization=authorization,
        )
        delete_response = delete_term_endpoint(term_id, authorization=authorization)

        self.assertEqual(list_response["data"]["items"][0]["id"], term_id)
        self.assertIn("空间定义", query_response["data"]["answer"])
        self.assertIn("term", [source["source_type"] for source in query_response["data"]["sources"]])
        self.assertEqual(updated_response["data"]["status"], "pending")
        self.assertTrue(delete_response["data"]["deleted"])


if __name__ == "__main__":
    unittest.main()
