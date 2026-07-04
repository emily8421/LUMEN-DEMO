import unittest

from backend.model.entities import Document, DocumentPermission, SpaceMember, SpaceRole
from backend.service.permission import (
    can_view_document,
    filter_visible_documents,
    visible_document_where_clause,
)


class PermissionServiceTest(unittest.TestCase):
    def test_cross_space_document_is_not_visible(self) -> None:
        memberships = [SpaceMember(user_id=1, space_id=10, role=SpaceRole.MEMBER)]
        document = Document(
            id=100,
            space_id=20,
            title="Nova internal plan",
            content_md="nova internal content",
            owner_id=2,
            permission=DocumentPermission.TEAM,
        )

        self.assertFalse(can_view_document(1, 10, document, memberships))

    def test_private_document_only_visible_to_owner(self) -> None:
        memberships = [
            SpaceMember(user_id=1, space_id=10, role=SpaceRole.MEMBER),
            SpaceMember(user_id=2, space_id=10, role=SpaceRole.MEMBER),
        ]
        document = Document(
            id=101,
            space_id=10,
            title="Private note",
            content_md="private",
            owner_id=1,
            permission=DocumentPermission.PRIVATE,
        )

        self.assertTrue(can_view_document(1, 10, document, memberships))
        self.assertFalse(can_view_document(2, 10, document, memberships))

    def test_team_and_external_documents_visible_to_space_members(self) -> None:
        memberships = [SpaceMember(user_id=2, space_id=10, role=SpaceRole.MEMBER)]
        team_document = Document(
            id=102,
            space_id=10,
            title="Team doc",
            content_md="team",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )
        external_document = Document(
            id=103,
            space_id=10,
            title="External read-only doc",
            content_md="external",
            owner_id=1,
            permission=DocumentPermission.EXTERNAL,
        )

        self.assertTrue(can_view_document(2, 10, team_document, memberships))
        self.assertTrue(can_view_document(2, 10, external_document, memberships))

    def test_filter_visible_documents_matches_sprint1_acceptance(self) -> None:
        memberships = [
            SpaceMember(user_id=1, space_id=10, role=SpaceRole.ADMIN),
            SpaceMember(user_id=2, space_id=20, role=SpaceRole.MEMBER),
            SpaceMember(user_id=3, space_id=20, role=SpaceRole.MEMBER),
        ]
        documents = [
            Document(
                id=1,
                space_id=10,
                title="nova-internal architecture",
                content_md="nova",
                owner_id=1,
                permission=DocumentPermission.TEAM,
            ),
            Document(
                id=2,
                space_id=20,
                title="brightlite shared plan",
                content_md="brightlite",
                owner_id=2,
                permission=DocumentPermission.TEAM,
            ),
            Document(
                id=3,
                space_id=20,
                title="brightlite private note",
                content_md="private",
                owner_id=2,
                permission=DocumentPermission.PRIVATE,
            ),
        ]

        visible_to_brightlite_member = filter_visible_documents(
            user_id=3,
            current_space_id=20,
            documents=documents,
            memberships=memberships,
        )

        self.assertEqual([document.id for document in visible_to_brightlite_member], [2])

    def test_visible_document_where_clause_keeps_filter_in_query_layer(self) -> None:
        self.assertEqual(
            visible_document_where_clause(),
            "space_id = :space_id AND (permission <> 'private' OR owner_id = :user_id)",
        )


if __name__ == "__main__":
    unittest.main()

