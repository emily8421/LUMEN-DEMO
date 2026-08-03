import unittest

import importlib.util

from backend.model.entities import Document, DocumentPermission, SpaceMember, SpaceRole
from backend.service.document import (
    DocumentCreate,
    DocumentAccessError,
    DocumentMove,
    DocumentNotFoundError,
    DocumentUpdate,
    DocumentValidationError,
    create_document,
    get_visible_document,
    list_versions,
    list_visible_documents,
    move_document_to_folder,
    restore_version,
    update_document,
)
from backend.repository.demo_repository import DemoRepository


class DocumentServiceTest(unittest.TestCase):
    def test_list_visible_documents_filters_by_space_and_permission(self) -> None:
        documents = [
            Document(id=1, space_id=10, title="team", content_md="", owner_id=1, permission=DocumentPermission.TEAM),
            Document(id=2, space_id=10, title="private owner", content_md="", owner_id=1, permission=DocumentPermission.PRIVATE),
            Document(id=3, space_id=10, title="private other", content_md="", owner_id=2, permission=DocumentPermission.PRIVATE),
            Document(id=4, space_id=20, title="other space", content_md="", owner_id=1, permission=DocumentPermission.TEAM),
        ]
        memberships = [SpaceMember(user_id=1, space_id=10, role=SpaceRole.MEMBER)]

        visible = list_visible_documents(1, 10, documents, memberships)

        self.assertEqual([document.id for document in visible], [1, 2])

    def test_create_update_versions_and_restore(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(title="Runbook", content_md="v1", permission=DocumentPermission.TEAM),
        )

        for version_no in range(2, 5):
            document = update_document(
                repository,
                user_id=1,
                current_space_id=10,
                document_id=document.id,
                request=DocumentUpdate(
                    title="Runbook",
                    content_md=f"v{version_no}",
                    permission=DocumentPermission.TEAM,
                ),
            )

        versions = list_versions(repository, user_id=1, current_space_id=10, document_id=document.id)
        restored = restore_version(repository, user_id=1, current_space_id=10, document_id=document.id, version_no=2)

        self.assertEqual([version.version_no for version in versions], [1, 2, 3, 4])
        self.assertEqual(document.current_version, 4)
        self.assertEqual(restored.current_version, 2)
        self.assertEqual(restored.content_md, "v2")

    def test_create_update_and_restore_sync_search_chunks(self) -> None:
        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(title="Indexed", content_md="front search first", permission=DocumentPermission.TEAM),
        )

        self.assertEqual([chunk.text for chunk in repository.list_document_chunks(document.id)], ["front search first"])

        updated = update_document(
            repository,
            user_id=1,
            current_space_id=10,
            document_id=document.id,
            request=DocumentUpdate(title="Indexed", content_md="rag answer second", permission=DocumentPermission.TEAM),
        )
        self.assertEqual([chunk.text for chunk in repository.list_document_chunks(updated.id)], ["rag answer second"])

        restored = restore_version(repository, user_id=1, current_space_id=10, document_id=document.id, version_no=1)

        self.assertEqual(restored.id, document.id)
        self.assertEqual([chunk.text for chunk in repository.list_document_chunks(restored.id)], ["front search first"])

    def test_move_document_to_folder_and_root_does_not_create_version(self) -> None:
        from backend.service.folder import FolderCreateRequest, create_folder

        repository = DemoRepository()
        document = create_document(
            repository,
            user_id=1,
            current_space_id=10,
            request=DocumentCreate(title="Move me", content_md="body", permission=DocumentPermission.TEAM),
        )
        folder = create_folder(repository, 1, 10, FolderCreateRequest(name="Target"))

        moved = move_document_to_folder(
            repository,
            user_id=1,
            current_space_id=10,
            document_id=document.id,
            request=DocumentMove(folder_id=folder.id),
        )
        rooted = move_document_to_folder(
            repository,
            user_id=1,
            current_space_id=10,
            document_id=document.id,
            request=DocumentMove(folder_id=None),
        )

        self.assertEqual(moved.folder_id, folder.id)
        self.assertIsNone(rooted.folder_id)
        self.assertEqual([version.version_no for version in repository.list_document_versions(document.id)], [1])

    def test_move_document_cross_space_folder_rejected(self) -> None:
        from backend.service.folder import FolderCreateRequest, create_folder

        repository = DemoRepository()
        folder_in_other_space = create_folder(repository, 1, 20, FolderCreateRequest(name="Other space"))

        with self.assertRaises(DocumentValidationError):
            move_document_to_folder(
                repository,
                user_id=1,
                current_space_id=10,
                document_id=100,
                request=DocumentMove(folder_id=folder_in_other_space.id),
            )

    def test_private_document_looks_not_found_for_other_member(self) -> None:
        repository = DemoRepository()

        with self.assertRaises(DocumentNotFoundError):
            get_visible_document(repository, user_id=1, current_space_id=20, document_id=200)

    def test_non_member_cannot_create_document(self) -> None:
        repository = DemoRepository()

        with self.assertRaises(DocumentAccessError):
            create_document(
                repository,
                user_id=3,
                current_space_id=10,
                request=DocumentCreate(title="Denied", content_md="", permission=DocumentPermission.TEAM),
            )


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class DocumentApiTest(unittest.TestCase):
    def test_move_document_folder_via_api(self) -> None:
        from backend.api import documents as documents_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token
        from backend.service.folder import FolderCreateRequest, create_folder

        repository = DemoRepository()
        original_repository = documents_api.repository
        documents_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            headers = {"authorization": f"Bearer {token}"}
            folder = create_folder(repository, 1, 10, FolderCreateRequest(name="API Target"))

            moved = documents_api.move_document_folder_endpoint(
                document_id=100,
                request=documents_api.DocumentMoveRequest(folder_id=folder.id),
                **headers,
            )
            self.assertEqual(moved["code"], 0)
            self.assertEqual(moved["data"]["folder_id"], folder.id)

            rooted = documents_api.move_document_folder_endpoint(
                document_id=100,
                request=documents_api.DocumentMoveRequest(folder_id=None),
                **headers,
            )
            self.assertIsNone(rooted["data"]["folder_id"])
        finally:
            documents_api.repository = original_repository


if __name__ == "__main__":
    unittest.main()
