import unittest

from backend.model.entities import DocumentPermission
from backend.repository.demo_repository import DemoRepository
from backend.service.document import DocumentNotFoundError
from backend.service.quick_entry import (
    QuickEntryAccessError,
    QuickEntryCaptureRequest,
    QuickEntryNotFoundError,
    QuickEntryValidationError,
    capture_quick_entry,
    discard_quick_entry,
)


class QuickEntryServiceTest(unittest.TestCase):
    """REQ-025 快速录入：draft / create_document / append_document / discard、

    tag_ids 关联、权限（空间成员、append 可见即可写、EXTERNAL 仅 owner 可写）、
    非法字段 4220、跨空间 / 无权限 4003 / 4004（DemoRepository）。对应 TC-P2-QUICK-001。
    """

    # --- TC-P2-QUICK-001 主场景 ---

    def test_capture_draft_creates_private_entry(self) -> None:
        repository = DemoRepository()
        view = capture_quick_entry(
            repository,
            1,
            10,
            QuickEntryCaptureRequest(title="碎片想法", content_md="一句话", source="电话"),
        )
        self.assertEqual(view.status, "draft")
        self.assertEqual(view.owner_id, 1)
        self.assertIsNone(view.created_document_id)
        self.assertIsNone(view.target_document_id)
        drafts = repository.list_quick_entries(10, 1, "draft")
        self.assertEqual({d.id for d in drafts}, {view.id})

    def test_capture_create_document_builds_private_doc(self) -> None:
        repository = DemoRepository()
        view = capture_quick_entry(
            repository,
            1,
            10,
            QuickEntryCaptureRequest(title="会议纪要", content_md="讨论了X", source="周会", mode="create_document"),
        )
        self.assertEqual(view.status, "converted")
        self.assertIsNotNone(view.created_document_id)
        self.assertIsNone(view.target_document_id)
        document = repository.get_document(view.created_document_id)
        self.assertIsNotNone(document)
        self.assertEqual(document.permission, DocumentPermission.PRIVATE)
        self.assertEqual(document.owner_id, 1)
        self.assertIn("讨论了X", document.content_md)
        self.assertIn("来源：周会", document.content_md)

    def test_capture_append_document_appends_block(self) -> None:
        repository = DemoRepository()
        original = repository.get_document(100).content_md
        view = capture_quick_entry(
            repository,
            1,
            10,
            QuickEntryCaptureRequest(
                title="补充", content_md="追加要点", source="邮件", mode="append_document", target_document_id=100
            ),
        )
        self.assertEqual(view.status, "converted")
        self.assertEqual(view.target_document_id, 100)
        self.assertIsNone(view.created_document_id)
        document = repository.get_document(100)
        self.assertTrue(document.content_md.startswith(original))
        self.assertIn("---", document.content_md)
        self.assertIn("追加要点", document.content_md)

    def test_capture_create_document_with_tag_links(self) -> None:
        from backend.service.tag import TagCreateRequest, create_tag, list_document_tags

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="重要"))
        view = capture_quick_entry(
            repository,
            1,
            10,
            QuickEntryCaptureRequest(title="带标签", content_md="c", mode="create_document", tag_ids=(tag.id,)),
        )
        links = list_document_tags(repository, 1, 10, view.created_document_id)
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].tag_id, tag.id)
        self.assertEqual(links[0].link_source, "quick_entry")

    def test_capture_append_document_with_tag_links(self) -> None:
        from backend.service.tag import TagCreateRequest, create_tag, list_document_tags

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="跟进"))
        capture_quick_entry(
            repository,
            1,
            10,
            QuickEntryCaptureRequest(
                title="追加并打标", content_md="c", mode="append_document", target_document_id=100, tag_ids=(tag.id,)
            ),
        )
        links = list_document_tags(repository, 1, 10, 100)
        self.assertTrue(any(link.tag_id == tag.id and link.link_source == "quick_entry" for link in links))

    def test_discard_draft_marks_discarded(self) -> None:
        repository = DemoRepository()
        view = capture_quick_entry(repository, 1, 10, QuickEntryCaptureRequest(title="待丢弃"))
        discarded = discard_quick_entry(repository, 1, 10, view.id)
        self.assertEqual(discarded.status, "discarded")
        self.assertEqual(repository.get_quick_entry(view.id).status, "discarded")

    # --- 字段非法 → 4220 ---

    def test_capture_empty_title_rejected(self) -> None:
        repository = DemoRepository()
        with self.assertRaises(QuickEntryValidationError):
            capture_quick_entry(repository, 1, 10, QuickEntryCaptureRequest(title="   "))

    def test_capture_invalid_mode_rejected(self) -> None:
        repository = DemoRepository()
        with self.assertRaises(QuickEntryValidationError):
            capture_quick_entry(repository, 1, 10, QuickEntryCaptureRequest(title="T", mode="publish"))

    def test_append_without_target_rejected(self) -> None:
        repository = DemoRepository()
        with self.assertRaises(QuickEntryValidationError):
            capture_quick_entry(repository, 1, 10, QuickEntryCaptureRequest(title="T", mode="append_document"))

    def test_create_with_target_rejected(self) -> None:
        repository = DemoRepository()
        with self.assertRaises(QuickEntryValidationError):
            capture_quick_entry(
                repository,
                1,
                10,
                QuickEntryCaptureRequest(title="T", mode="create_document", target_document_id=100),
            )

    def test_capture_invalid_tag_ids_rejected(self) -> None:
        repository = DemoRepository()
        with self.assertRaises(QuickEntryValidationError):
            capture_quick_entry(
                repository, 1, 10, QuickEntryCaptureRequest(title="T", mode="create_document", tag_ids=(999,))
            )

    def test_capture_archived_tag_rejected(self) -> None:
        from backend.service.tag import TagCreateRequest, archive_tag, create_tag

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="旧"))
        archive_tag(repository, 1, 10, tag.id)
        with self.assertRaises(QuickEntryValidationError):
            capture_quick_entry(
                repository, 1, 10, QuickEntryCaptureRequest(title="T", mode="create_document", tag_ids=(tag.id,))
            )

    # --- 权限 → 4003 / 4004 ---

    def test_non_member_denied(self) -> None:
        repository = DemoRepository()
        # user3 仅是 space20 成员，不是 space10 成员
        with self.assertRaises(QuickEntryAccessError):
            capture_quick_entry(repository, 3, 10, QuickEntryCaptureRequest(title="T"))

    def test_append_external_not_writable_denied(self) -> None:
        repository = DemoRepository()
        external = repository.create_document(
            space_id=10, title="Ext", content_md="e", owner_id=1, permission=DocumentPermission.EXTERNAL
        )
        # user2 是 space10 成员 → 可见 EXTERNAL，但 EXTERNAL 仅 owner 可写 → 4003
        with self.assertRaises(QuickEntryAccessError):
            capture_quick_entry(
                repository,
                2,
                10,
                QuickEntryCaptureRequest(title="T", mode="append_document", target_document_id=external.id),
            )

    def test_append_invisible_target_not_found(self) -> None:
        repository = DemoRepository()
        secret = repository.create_document(
            space_id=10, title="Secret", content_md="s", owner_id=2, permission=DocumentPermission.PRIVATE
        )
        # user1 是 space10 成员，但 PRIVATE owner2 → user1 不可见 → 4004（不泄露）
        with self.assertRaises(DocumentNotFoundError):
            capture_quick_entry(
                repository,
                1,
                10,
                QuickEntryCaptureRequest(title="T", mode="append_document", target_document_id=secret.id),
            )

    def test_discard_non_draft_rejected(self) -> None:
        repository = DemoRepository()
        view = capture_quick_entry(
            repository, 1, 10, QuickEntryCaptureRequest(title="T", mode="create_document")
        )
        # converted 状态不可丢弃 → 4220
        with self.assertRaises(QuickEntryValidationError):
            discard_quick_entry(repository, 1, 10, view.id)

    def test_discard_non_owner_not_found(self) -> None:
        repository = DemoRepository()
        view = capture_quick_entry(repository, 1, 10, QuickEntryCaptureRequest(title="T"))
        # user2 是 space10 成员但非 owner → 4004（不泄露存在性）
        with self.assertRaises(QuickEntryNotFoundError):
            discard_quick_entry(repository, 2, 10, view.id)


if __name__ == "__main__":
    unittest.main()
