import importlib.util
import unittest


class TagServiceTest(unittest.TestCase):
    """REQ-012 标签：CRUD、重名 4090、document_count 权限过滤、空间隔离、幂等、归档（DemoRepository）。"""

    def test_create_tag_and_list_with_document_count(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, create_tag, list_tags

        repository = DemoRepository()
        create_tag(repository, 1, 10, TagCreateRequest(name="重要"))
        create_tag(repository, 1, 10, TagCreateRequest(name="会议"))

        views = list_tags(repository, 1, 10)
        self.assertEqual({v.name for v in views}, {"重要", "会议"})
        self.assertTrue(all(v.document_count == 0 for v in views))
        self.assertTrue(all(v.status == "active" for v in views))

    def test_create_tag_duplicate_normalized_conflict(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagConflictError, TagCreateRequest, create_tag

        repository = DemoRepository()
        create_tag(repository, 1, 10, TagCreateRequest(name="Tag"))

        # 前后空格 + 大小写归一化后重名 → 4090
        with self.assertRaises(TagConflictError):
            create_tag(repository, 1, 10, TagCreateRequest(name="  tag  "))
        with self.assertRaises(TagConflictError):
            create_tag(repository, 1, 10, TagCreateRequest(name="TAG"))

    def test_create_tag_empty_name_validation(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, TagValidationError, create_tag

        repository = DemoRepository()
        with self.assertRaises(TagValidationError):
            create_tag(repository, 1, 10, TagCreateRequest(name="   "))

    def test_create_tag_non_member_denied(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagAccessError, TagCreateRequest, create_tag

        repository = DemoRepository()
        # user3 仅是 space20 成员，不是 space10 成员
        with self.assertRaises(TagAccessError):
            create_tag(repository, 3, 10, TagCreateRequest(name="X"))

    def test_document_count_excludes_invisible_documents(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, add_document_tag, create_tag, list_tags

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))
        visible = repository.create_document(
            space_id=10, title="Visible", content_md="v", owner_id=1, permission=DocumentPermission.TEAM
        )
        secret = repository.create_document(
            space_id=10, title="Secret", content_md="s", owner_id=2, permission=DocumentPermission.PRIVATE
        )

        add_document_tag(repository, 1, 10, visible.id, tag.id)  # user1 可写
        repository.upsert_document_tag(tag.id, secret.id, "manual", 2)  # 绕过 service，模拟他人打的

        views = list_tags(repository, 1, 10)
        match = next(v for v in views if v.id == tag.id)
        self.assertEqual(match.document_count, 1)  # 只计 Visible，Secret 不计入

    def test_update_tag_rename_conflict(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import (
            TagConflictError,
            TagCreateRequest,
            TagUpdateRequest,
            create_tag,
            update_tag,
        )

        repository = DemoRepository()
        create_tag(repository, 1, 10, TagCreateRequest(name="A"))
        tag_b = create_tag(repository, 1, 10, TagCreateRequest(name="B"))

        with self.assertRaises(TagConflictError):
            update_tag(repository, 1, 10, tag_b.id, TagUpdateRequest(name="a"))  # 归一化后撞 A

    def test_archive_tag_keeps_links(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, add_document_tag, archive_tag, create_tag, list_document_tags

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))
        add_document_tag(repository, 1, 10, 100, tag.id)  # doc100 team owner1

        archive_tag(repository, 1, 10, tag.id)

        # 归档后文档详情不再显示（仅 active）
        self.assertEqual(list_document_tags(repository, 1, 10, 100), [])
        # 但 tag_links 历史关联仍在（归档不删 link）
        self.assertEqual(len(repository.list_document_tag_links(100)), 1)

    def test_list_document_tags_only_active_same_space(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, add_document_tag, create_tag, list_document_tags

        repository = DemoRepository()
        active = create_tag(repository, 1, 10, TagCreateRequest(name="Active"))
        add_document_tag(repository, 1, 10, 100, active.id)

        views = list_document_tags(repository, 1, 10, 100)
        self.assertEqual(len(views), 1)
        self.assertEqual(views[0].tag_id, active.id)
        self.assertEqual(views[0].link_source, "manual")

    def test_add_document_tag_requires_writable(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagAccessError, TagCreateRequest, add_document_tag, create_tag

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))
        # external 文档 owner 不是 user1 → user1 可见但不可写
        repository.create_document(
            space_id=10, title="Ext", content_md="e", owner_id=2, permission=DocumentPermission.EXTERNAL
        )

        with self.assertRaises(TagAccessError):
            add_document_tag(repository, 1, 10, repository.documents[-1].id, tag.id)

    def test_add_document_tag_idempotent(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, add_document_tag, create_tag

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))

        link1 = add_document_tag(repository, 1, 10, 100, tag.id)
        link2 = add_document_tag(repository, 1, 10, 100, tag.id)

        self.assertEqual(link1.tag_id, link2.tag_id)
        self.assertEqual(len(repository.list_document_tag_links(100)), 1)  # 幂等：只一条

    def test_add_document_tag_rejects_archived_tag(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import (
            TagCreateRequest,
            TagValidationError,
            add_document_tag,
            archive_tag,
            create_tag,
        )

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))
        archive_tag(repository, 1, 10, tag.id)

        with self.assertRaises(TagValidationError):
            add_document_tag(repository, 1, 10, 100, tag.id)

    def test_remove_document_tag(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, add_document_tag, create_tag, remove_document_tag

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))
        add_document_tag(repository, 1, 10, 100, tag.id)

        removed = remove_document_tag(repository, 1, 10, 100, tag.id)
        self.assertTrue(removed)
        self.assertEqual(repository.list_document_tag_links(100), [])
        # 标签本身仍在（移除关联不删标签）
        self.assertIsNotNone(repository.get_tag(tag.id))

    def test_list_documents_by_tag_visibility_filter(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, create_tag, list_documents_by_tag

        repository = DemoRepository()
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="T"))
        visible = repository.create_document(
            space_id=10, title="Vis", content_md="v", owner_id=1, permission=DocumentPermission.TEAM
        )
        secret = repository.create_document(
            space_id=10, title="Secret", content_md="s", owner_id=2, permission=DocumentPermission.PRIVATE
        )
        repository.upsert_document_tag(tag.id, visible.id, "manual", 1)
        repository.upsert_document_tag(tag.id, secret.id, "manual", 2)

        docs = list_documents_by_tag(repository, 1, 10, tag.id)
        self.assertEqual({d.id for d in docs}, {visible.id})  # Secret 被可见性过滤

    def test_cross_space_isolation(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, create_tag, list_tags

        repository = DemoRepository()
        create_tag(repository, 1, 10, TagCreateRequest(name="Space10Tag"))
        create_tag(repository, 1, 20, TagCreateRequest(name="Space20Tag"))

        names10 = {v.name for v in list_tags(repository, 1, 10)}
        names20 = {v.name for v in list_tags(repository, 1, 20)}
        self.assertEqual(names10, {"Space10Tag"})
        self.assertEqual(names20, {"Space20Tag"})


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class TagApiTest(unittest.TestCase):
    """REQ-012 API-014/027/031/032：通过 endpoint 函数（替换 repository 单例 + demo token）。"""

    def test_tags_crud_and_document_tag_via_api(self) -> None:
        from backend.api import tags as tags_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        repository = DemoRepository()
        original_repository = tags_api.repository
        tags_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            headers = {"authorization": f"Bearer {token}"}

            created = tags_api.create_tag_endpoint(
                request=tags_api.TagCreateBody(name="重要", color="#f00"),
                **headers,
            )
            self.assertEqual(created["code"], 0)
            tag_id = created["data"]["id"]
            self.assertEqual(created["data"]["status"], "active")

            listed = tags_api.list_tags_endpoint(**headers)
            self.assertEqual(listed["code"], 0)
            self.assertEqual(listed["data"]["total"], 1)
            self.assertEqual(listed["data"]["items"][0]["name"], "重要")

            # 给 doc100 打标（team owner1，user1 可写）
            linked = tags_api.add_document_tag_endpoint(
                document_id=100,
                request=tags_api.DocumentTagCreateBody(tag_id=tag_id),
                **headers,
            )
            self.assertEqual(linked["data"]["link_source"], "manual")

            doc_tags = tags_api.list_document_tags_endpoint(document_id=100, **headers)
            self.assertEqual(doc_tags["data"]["total"], 1)
            self.assertEqual(doc_tags["data"]["items"][0]["tag_id"], tag_id)

            # document_count 反映
            listed2 = tags_api.list_tags_endpoint(**headers)
            self.assertEqual(listed2["data"]["items"][0]["document_count"], 1)

            # 标签下文档
            tag_docs = tags_api.list_documents_by_tag_endpoint(tag_id=tag_id, **headers)
            self.assertEqual(tag_docs["data"]["total"], 1)
            self.assertEqual(tag_docs["data"]["items"][0]["id"], 100)
        finally:
            tags_api.repository = original_repository


if __name__ == "__main__":
    unittest.main()
