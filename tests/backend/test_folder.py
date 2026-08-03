import importlib.util
import unittest


class FolderServiceTest(unittest.TestCase):
    """REQ-039 文件夹树：CRUD、重名 4090、防环 4220、跨空间 4220、删非空 4090、排序、
    空间隔离、权限 4003、document_count 可见性过滤（DemoRepository）。"""

    def test_create_root_and_nested_folder(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, create_folder, list_folders

        repository = DemoRepository()
        root = create_folder(repository, 1, 10, FolderCreateRequest(name="项目A"))
        child = create_folder(repository, 1, 10, FolderCreateRequest(name="子1", parent_id=root.id))

        self.assertIsNone(root.parent_id)
        self.assertEqual(child.parent_id, root.id)

        root_views = list_folders(repository, 1, 10, None)
        self.assertEqual({v.name for v in root_views}, {"项目A"})
        self.assertEqual(root_views[0].child_folder_count, 1)

        child_views = list_folders(repository, 1, 10, root.id)
        self.assertEqual([v.id for v in child_views], [child.id])

    def test_create_folder_duplicate_conflict(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderConflictError, FolderCreateRequest, create_folder

        repository = DemoRepository()
        create_folder(repository, 1, 10, FolderCreateRequest(name="A"))
        # 同 parent（根）重名 → 4090
        with self.assertRaises(FolderConflictError):
            create_folder(repository, 1, 10, FolderCreateRequest(name="A"))

    def test_create_folder_root_duplicate_uses_service_check(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderConflictError, FolderCreateRequest, create_folder

        repository = DemoRepository()
        create_folder(repository, 1, 10, FolderCreateRequest(name="根夹"))
        # 根层 parent=None 重名：PG UNIQUE 对 NULL 不去重，由 service find_folder_by_name 兜底
        with self.assertRaises(FolderConflictError):
            create_folder(repository, 1, 10, FolderCreateRequest(name="根夹"))

    def test_create_folder_same_name_different_parent_ok(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, create_folder, list_folders

        repository = DemoRepository()
        parent = create_folder(repository, 1, 10, FolderCreateRequest(name="P"))
        create_folder(repository, 1, 10, FolderCreateRequest(name="同 名"))
        # 不同 parent 下同名不冲突
        child = create_folder(repository, 1, 10, FolderCreateRequest(name="同 名", parent_id=parent.id))
        self.assertIsNotNone(child.id)

    def test_create_folder_empty_name_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, FolderValidationError, create_folder

        repository = DemoRepository()
        with self.assertRaises(FolderValidationError):
            create_folder(repository, 1, 10, FolderCreateRequest(name="   "))

    def test_create_folder_non_member_denied(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderAccessError, FolderCreateRequest, create_folder

        repository = DemoRepository()
        # user3 仅是 space20 成员，不是 space10 成员
        with self.assertRaises(FolderAccessError):
            create_folder(repository, 3, 10, FolderCreateRequest(name="X"))

    def test_create_folder_parent_other_space_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, FolderValidationError, create_folder

        repository = DemoRepository()
        s10 = create_folder(repository, 1, 10, FolderCreateRequest(name="S10"))
        # 在 space20 建 folder，但 parent 是 space10 的 → 4220
        with self.assertRaises(FolderValidationError):
            create_folder(repository, 1, 20, FolderCreateRequest(name="S20", parent_id=s10.id))

    def test_rename_folder_and_conflict(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderConflictError,
            FolderCreateRequest,
            FolderUpdateRequest,
            UNSET,
            create_folder,
            update_folder,
        )

        repository = DemoRepository()
        a = create_folder(repository, 1, 10, FolderCreateRequest(name="A"))
        b = create_folder(repository, 1, 10, FolderCreateRequest(name="B"))

        renamed = update_folder(repository, 1, 10, b.id, FolderUpdateRequest(name="B改名"))
        self.assertEqual(renamed.name, "B改名")

        # 改成与 A 同名（同 parent 根）→ 4090
        with self.assertRaises(FolderConflictError):
            update_folder(repository, 1, 10, b.id, FolderUpdateRequest(name="A"))

    def test_move_folder_to_root_and_nested(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderCreateRequest,
            FolderUpdateRequest,
            create_folder,
            update_folder,
        )

        repository = DemoRepository()
        a = create_folder(repository, 1, 10, FolderCreateRequest(name="A"))
        b = create_folder(repository, 1, 10, FolderCreateRequest(name="B", parent_id=a.id))

        # B 移到根
        moved = update_folder(repository, 1, 10, b.id, FolderUpdateRequest(parent_id=None))
        self.assertIsNone(moved.parent_id)

        # A 移到根层（已经是根，不变）；再把 B 移回 A 下
        back = update_folder(repository, 1, 10, b.id, FolderUpdateRequest(parent_id=a.id))
        self.assertEqual(back.parent_id, a.id)

    def test_move_folder_into_descendant_or_self_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderCreateRequest,
            FolderUpdateRequest,
            FolderValidationError,
            create_folder,
            update_folder,
        )

        repository = DemoRepository()
        r = create_folder(repository, 1, 10, FolderCreateRequest(name="R"))
        a = create_folder(repository, 1, 10, FolderCreateRequest(name="A", parent_id=r.id))
        b = create_folder(repository, 1, 10, FolderCreateRequest(name="B", parent_id=a.id))

        # R 移到 B（B 是 R 的后代）→ 防环 4220
        with self.assertRaises(FolderValidationError):
            update_folder(repository, 1, 10, r.id, FolderUpdateRequest(parent_id=b.id))
        # R 移到自身 → 4220
        with self.assertRaises(FolderValidationError):
            update_folder(repository, 1, 10, r.id, FolderUpdateRequest(parent_id=r.id))

    def test_move_folder_cross_space_target_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderCreateRequest,
            FolderUpdateRequest,
            FolderValidationError,
            create_folder,
            update_folder,
        )

        repository = DemoRepository()
        s10 = create_folder(repository, 1, 10, FolderCreateRequest(name="S10"))
        s20 = create_folder(repository, 1, 20, FolderCreateRequest(name="S20"))
        # space10 的 folder 移到 space20 的 parent 下 → 跨空间 4220
        with self.assertRaises(FolderValidationError):
            update_folder(repository, 1, 10, s10.id, FolderUpdateRequest(parent_id=s20.id))

    def test_delete_empty_folder_ok(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, create_folder, delete_folder

        repository = DemoRepository()
        folder = create_folder(repository, 1, 10, FolderCreateRequest(name="F"))
        delete_folder(repository, 1, 10, folder.id)
        self.assertIsNone(repository.get_folder(folder.id))

    def test_delete_folder_with_child_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderConflictError,
            FolderCreateRequest,
            create_folder,
            delete_folder,
        )

        repository = DemoRepository()
        parent = create_folder(repository, 1, 10, FolderCreateRequest(name="P"))
        create_folder(repository, 1, 10, FolderCreateRequest(name="C", parent_id=parent.id))
        with self.assertRaises(FolderConflictError):
            delete_folder(repository, 1, 10, parent.id)

    def test_delete_folder_with_document_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderConflictError,
            FolderCreateRequest,
            create_folder,
            delete_folder,
        )

        repository = DemoRepository()
        folder = create_folder(repository, 1, 10, FolderCreateRequest(name="F"))
        repository.set_document_folder(100, folder.id)  # doc100 归属该 folder
        with self.assertRaises(FolderConflictError):
            delete_folder(repository, 1, 10, folder.id)

    def test_reorder_folders(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderCreateRequest,
            create_folder,
            list_folders,
            reorder_folders,
        )

        repository = DemoRepository()
        a = create_folder(repository, 1, 10, FolderCreateRequest(name="A"))
        b = create_folder(repository, 1, 10, FolderCreateRequest(name="B"))
        c = create_folder(repository, 1, 10, FolderCreateRequest(name="C"))

        reorder_folders(repository, 1, 10, None, [c.id, a.id, b.id])
        views = list_folders(repository, 1, 10, None)
        self.assertEqual([v.id for v in views], [c.id, a.id, b.id])
        self.assertEqual([v.order for v in views], [1, 2, 3])

    def test_reorder_partial_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import (
            FolderCreateRequest,
            FolderValidationError,
            create_folder,
            reorder_folders,
        )

        repository = DemoRepository()
        a = create_folder(repository, 1, 10, FolderCreateRequest(name="A"))
        create_folder(repository, 1, 10, FolderCreateRequest(name="B"))
        # ordered_ids 必须恰好等于该层全部子 folder；漏 B → 4220
        with self.assertRaises(FolderValidationError):
            reorder_folders(repository, 1, 10, None, [a.id])

    def test_document_count_filters_invisible(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, create_folder, list_folders

        repository = DemoRepository()
        folder = create_folder(repository, 1, 10, FolderCreateRequest(name="F"))
        repository.set_document_folder(100, folder.id)  # doc100 team owner1 → user1 可见
        secret = repository.create_document(
            space_id=10, title="Secret", content_md="s", owner_id=2, permission=DocumentPermission.PRIVATE
        )
        repository.set_document_folder(secret.id, folder.id)  # private owner2 → user1 不可见

        views = list_folders(repository, 1, 10, None)
        match = next(v for v in views if v.id == folder.id)
        self.assertEqual(match.document_count, 1)  # 只计可见的 doc100

    def test_cross_space_isolation(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.folder import FolderCreateRequest, create_folder, list_folders

        repository = DemoRepository()
        create_folder(repository, 1, 10, FolderCreateRequest(name="Space10F"))
        create_folder(repository, 1, 20, FolderCreateRequest(name="Space20F"))

        names10 = {v.name for v in list_folders(repository, 1, 10, None)}
        names20 = {v.name for v in list_folders(repository, 1, 20, None)}
        self.assertEqual(names10, {"Space10F"})
        self.assertEqual(names20, {"Space20F"})


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class FolderApiTest(unittest.TestCase):
    """REQ-039 API-034..037：通过 endpoint 函数（替换 repository 单例 + demo token）。"""

    def test_folders_crud_move_reorder_via_api(self) -> None:
        from backend.api import folders as folders_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        repository = DemoRepository()
        original_repository = folders_api.repository
        folders_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            headers = {"authorization": f"Bearer {token}"}

            created = folders_api.create_folder_endpoint(
                request=folders_api.FolderCreateBody(name="项目A"),
                **headers,
            )
            self.assertEqual(created["code"], 0)
            folder_id = created["data"]["id"]
            self.assertIsNone(created["data"]["parent_id"])

            child = folders_api.create_folder_endpoint(
                request=folders_api.FolderCreateBody(name="子1", parent_id=folder_id),
                **headers,
            )
            self.assertEqual(child["data"]["parent_id"], folder_id)

            listed = folders_api.list_folders_endpoint(**headers)
            self.assertEqual(listed["data"]["total"], 1)
            self.assertEqual(listed["data"]["items"][0]["child_folder_count"], 1)

            child_listed = folders_api.list_folders_endpoint(parent_id=folder_id, **headers)
            self.assertEqual(child_listed["data"]["total"], 1)

            renamed = folders_api.update_folder_endpoint(
                folder_id=folder_id,
                request=folders_api.FolderUpdateBody(name="项目A改名"),
                **headers,
            )
            self.assertEqual(renamed["data"]["name"], "项目A改名")

            moved = folders_api.update_folder_endpoint(
                folder_id=child["data"]["id"],
                request=folders_api.FolderUpdateBody(parent_id=None),
                **headers,
            )
            self.assertIsNone(moved["data"]["parent_id"])

            root_list = folders_api.list_folders_endpoint(**headers)
            ids = [item["id"] for item in root_list["data"]["items"]]
            reordered = folders_api.reorder_folders_endpoint(
                request=folders_api.FolderReorderBody(parent_id=None, ordered_ids=list(reversed(ids))),
                **headers,
            )
            self.assertEqual(reordered["code"], 0)

            deleted = folders_api.delete_folder_endpoint(folder_id=child["data"]["id"], **headers)
            self.assertTrue(deleted["data"]["deleted"])
        finally:
            folders_api.repository = original_repository


if __name__ == "__main__":
    unittest.main()
