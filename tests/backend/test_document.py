import unittest

from backend.model.entities import Document, DocumentPermission, SpaceMember, SpaceRole
from backend.service.document import (
    DocumentCreate,
    DocumentAccessError,
    DocumentNotFoundError,
    DocumentUpdate,
    create_document,
    get_visible_document,
    list_versions,
    list_visible_documents,
    restore_version,
    update_document,
)
from backend.service.demo_repository import DemoRepository


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

if __name__ == "__main__":
    unittest.main()


