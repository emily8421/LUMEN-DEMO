import unittest

from backend.model.entities import Document, DocumentPermission, SpaceMember, SpaceRole
from backend.service.permission import (
    can_view_document,
    can_write_document,
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

    def test_external_document_writable_only_by_owner(self) -> None:
        memberships = [
            SpaceMember(user_id=1, space_id=10, role=SpaceRole.MEMBER),
            SpaceMember(user_id=2, space_id=10, role=SpaceRole.MEMBER),
        ]
        external_document = Document(
            id=103,
            space_id=10,
            title="External read-only doc",
            content_md="external",
            owner_id=1,
            permission=DocumentPermission.EXTERNAL,
        )

        self.assertTrue(can_write_document(1, 10, external_document, memberships))
        self.assertFalse(can_write_document(2, 10, external_document, memberships))

    def test_team_and_private_documents_remain_writable_when_visible(self) -> None:
        memberships = [
            SpaceMember(user_id=1, space_id=10, role=SpaceRole.MEMBER),
            SpaceMember(user_id=2, space_id=10, role=SpaceRole.MEMBER),
        ]
        team_document = Document(
            id=102,
            space_id=10,
            title="Team doc",
            content_md="team",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )
        private_document = Document(
            id=104,
            space_id=10,
            title="Private note",
            content_md="private",
            owner_id=1,
            permission=DocumentPermission.PRIVATE,
        )

        # Sprint-13 只收紧 external；team/private 维持"可见即可写"（含非 owner）
        self.assertTrue(can_write_document(2, 10, team_document, memberships))
        self.assertTrue(can_write_document(1, 10, private_document, memberships))

    def test_invisible_document_is_not_writable(self) -> None:
        memberships = [SpaceMember(user_id=2, space_id=20, role=SpaceRole.MEMBER)]
        external_document = Document(
            id=103,
            space_id=10,
            title="External doc",
            content_md="external",
            owner_id=1,
            permission=DocumentPermission.EXTERNAL,
        )

        # 跨空间（user 2 在 space 20，文档在 space 10）不可见 → 不可写
        self.assertFalse(can_write_document(2, 20, external_document, memberships))

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


class MultiUserIsolationTest(unittest.TestCase):
    """Sprint-27（task-039）：注册真实多用户，逐路径断言跨用户零泄露（TC-P2-ACC-001）。"""

    def _make_shared_space(self):
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import register

        repository = DemoRepository()
        alice = register(repository, "alice.sp27@example.com", "Alice SP27", "password123")
        bob = register(repository, "bob.sp27@example.com", "Bob SP27", "password123")
        shared = repository.first_space_id_for_user(alice.id)
        repository.memberships.append(SpaceMember(user_id=bob.id, space_id=shared, role=SpaceRole.MEMBER))
        return repository, alice, bob, shared

    def test_registered_users_personal_spaces_isolated(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import register
        from backend.service.space import list_user_spaces

        # 未加入共享空间前：两个注册用户只见各自个人空间（RG-013 延伸）
        repository = DemoRepository()
        alice = register(repository, "alice.iso@example.com", "Alice Iso", "password123")
        bob = register(repository, "bob.iso@example.com", "Bob Iso", "password123")
        alice_space = repository.first_space_id_for_user(alice.id)
        bob_space = repository.first_space_id_for_user(bob.id)
        self.assertNotEqual(alice_space, bob_space)

        alice_spaces = list_user_spaces(alice.id, repository.list_spaces(), repository.list_memberships())
        bob_spaces = list_user_spaces(bob.id, repository.list_spaces(), repository.list_memberships())

        self.assertEqual([space.id for space in alice_spaces], [alice_space])
        self.assertEqual([space.id for space in bob_spaces], [bob_space])

    def test_private_document_hidden_from_member_across_all_paths(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.service.doc_links import list_links
        from backend.service.document import (
            DocumentCreate,
            DocumentMove,
            DocumentNotFoundError,
            create_document,
            get_visible_document,
            list_versions,
            move_document_to_folder,
        )
        from backend.service.export import export_space_zip
        from backend.service.folder import FolderCreateRequest, create_folder, list_folders
        from backend.service.quick_entry import (
            QuickEntryCaptureRequest,
            QuickEntryNotFoundError,
            capture_quick_entry,
            discard_quick_entry,
        )
        from backend.service.rag import _find_candidate_chunks
        from backend.service.search import search_documents
        from backend.service.tag import TagCreateRequest, add_document_tag, create_tag, list_documents_by_tag, list_tags
        from backend.service.timeline import get_timeline

        repository, alice, bob, shared = self._make_shared_space()

        private = create_document(
            repository, alice.id, shared,
            DocumentCreate(title="Alice Secret", content_md="s3cr3t p4ss", permission=DocumentPermission.PRIVATE),
        )
        create_document(
            repository, alice.id, shared,
            DocumentCreate(title="Alice Team", content_md="team note", permission=DocumentPermission.TEAM),
        )
        create_document(
            repository, alice.id, shared,
            DocumentCreate(title="Alice External", content_md="external note", permission=DocumentPermission.EXTERNAL),
        )
        folder = create_folder(repository, alice.id, shared, FolderCreateRequest(name="Alice Folder"))
        move_document_to_folder(repository, alice.id, shared, private.id, DocumentMove(folder_id=folder.id))
        tag = create_tag(repository, alice.id, shared, TagCreateRequest(name="secret-tag", color="#123456"))
        add_document_tag(repository, alice.id, shared, private.id, tag.id)
        entry = capture_quick_entry(
            repository, alice.id, shared,
            QuickEntryCaptureRequest(title="Alice Draft", content_md="draft body", mode="draft"),
        )

        # 1) 文档列表：只返回 team + external
        visible = repository.list_visible_documents(bob.id, shared)
        self.assertEqual({document.title for document in visible}, {"Alice Team", "Alice External"})

        # 2) 搜索：私有文档零命中
        self.assertFalse(
            any(item.title == "Alice Secret" for item in search_documents(repository, bob.id, shared, "s3cr3t").items)
        )
        self.assertTrue(
            any(item.title == "Alice Team" for item in search_documents(repository, bob.id, shared, "team").items)
        )

        # 3) RAG 候选：私有文档零命中
        candidates = _find_candidate_chunks(repository, bob.id, shared, ["s3cr3t"], "s3cr3t?")
        self.assertFalse(any(candidate.document.title == "Alice Secret" for candidate in candidates))

        # 4) 时间线：私有文档零事件
        timeline = get_timeline(repository, bob.id, shared)
        self.assertFalse(any(item.title == "Alice Secret" for item in timeline.items))

        # 5) 目录树计数：私有文档不计入
        folder_views = list_folders(repository, bob.id, shared)
        self.assertEqual(folder_views[0].document_count, 0)

        # 6) 标签：私有文档不计入 / 列表零命中
        tag_views = list_tags(repository, bob.id, shared)
        self.assertEqual(tag_views[0].document_count, 0)
        self.assertEqual(list_documents_by_tag(repository, bob.id, shared, tag.id), [])

        # 7) 导出 ZIP：不含私有文档
        space_export = export_space_zip(repository, bob.id, shared)
        self.assertEqual(space_export.document_count, 2)
        self.assertNotIn("Alice Secret".encode("utf-8"), space_export.archive)

        # 8) 链接：不可见文档查链接 → 4004（Sprint-27 P0 修复）
        with self.assertRaises(DocumentNotFoundError):
            list_links(repository, bob.id, shared, private.id, direction="outbound")

        # 9) 快速录入：他人 draft 不可见 / 不可丢弃
        with self.assertRaises(QuickEntryNotFoundError):
            discard_quick_entry(repository, bob.id, shared, entry.id)

        # 10) 单文档读取 / 版本：按不存在处理
        with self.assertRaises(DocumentNotFoundError):
            get_visible_document(repository, bob.id, shared, private.id)
        with self.assertRaises(DocumentNotFoundError):
            list_versions(repository, bob.id, shared, private.id)

    def test_external_document_read_only_for_member(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.service.document import (
            DocumentAccessError,
            DocumentCreate,
            DocumentMove,
            DocumentUpdate,
            create_document,
            delete_document,
            get_visible_document,
            move_document_to_folder,
            update_document,
        )

        repository, alice, bob, shared = self._make_shared_space()
        external = create_document(
            repository, alice.id, shared,
            DocumentCreate(title="External Read Only", content_md="external", permission=DocumentPermission.EXTERNAL),
        )

        # 成员可读，但不可写（4003）；owner 可写
        self.assertIsNotNone(get_visible_document(repository, bob.id, shared, external.id))
        with self.assertRaises(DocumentAccessError):
            update_document(
                repository, bob.id, shared, external.id,
                DocumentUpdate(title="Hijack", content_md="x", permission=DocumentPermission.EXTERNAL),
            )
        with self.assertRaises(DocumentAccessError):
            move_document_to_folder(repository, bob.id, shared, external.id, DocumentMove(folder_id=None))
        with self.assertRaises(DocumentAccessError):
            delete_document(repository, bob.id, shared, external.id)

    def test_cross_space_documents_invisible(self) -> None:
        from backend.service.document import DocumentNotFoundError, get_visible_document
        from backend.service.space import SpaceAccessError, ensure_space_access

        repository, alice, bob, shared = self._make_shared_space()
        bob_space = repository.first_space_id_for_user(bob.id)

        # alice 非 bob 个人空间成员：空间访问拒绝 + 文档按不存在处理
        with self.assertRaises(SpaceAccessError):
            ensure_space_access(alice.id, bob_space, repository.list_memberships())
        with self.assertRaises(DocumentNotFoundError):
            get_visible_document(repository, alice.id, bob_space, 100)

if __name__ == "__main__":
    unittest.main()
