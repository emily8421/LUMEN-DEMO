import importlib.util
import unittest


class TermCategoryServiceTest(unittest.TestCase):
    """REQ-036 术语领域树：CRUD、重名 4090、防环 4220、跨空间 4220、删非空 4090、
    排序、空间隔离、权限 4003、term_count（DemoRepository）。"""

    def test_create_root_and_nested_category(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            create_term_category,
            list_term_categories,
        )

        repository = DemoRepository()
        root = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="研发与开发流程"))
        child = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="测试验证", parent_id=root.id))

        self.assertIsNone(root.parent_id)
        self.assertEqual(child.parent_id, root.id)

        root_views = list_term_categories(repository, 1, 10, None)
        self.assertEqual({v.name for v in root_views}, {"研发与开发流程"})
        self.assertEqual(root_views[0].child_category_count, 1)

        child_views = list_term_categories(repository, 1, 10, root.id)
        self.assertEqual([v.id for v in child_views], [child.id])

    def test_create_category_duplicate_conflict(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryConflictError,
            TermCategoryCreateRequest,
            create_term_category,
        )

        repository = DemoRepository()
        create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A"))
        # 同 parent（根）重名 → 4090
        with self.assertRaises(TermCategoryConflictError):
            create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A"))

    def test_create_category_same_name_different_parent_ok(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            create_term_category,
        )

        repository = DemoRepository()
        parent = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="P"))
        create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="同名"))
        # 不同 parent 下同名不冲突
        child = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="同名", parent_id=parent.id))
        self.assertIsNotNone(child.id)

    def test_create_category_empty_name_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            TermCategoryValidationError,
            create_term_category,
        )

        repository = DemoRepository()
        with self.assertRaises(TermCategoryValidationError):
            create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="   "))

    def test_create_category_non_member_denied(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryAccessError,
            TermCategoryCreateRequest,
            create_term_category,
        )

        repository = DemoRepository()
        # user3 仅是 space20 成员，不是 space10 成员
        with self.assertRaises(TermCategoryAccessError):
            create_term_category(repository, 3, 10, TermCategoryCreateRequest(name="X"))

    def test_create_category_parent_other_space_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            TermCategoryValidationError,
            create_term_category,
        )

        repository = DemoRepository()
        s10 = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="S10"))
        # 在 space20 建领域，但 parent 是 space10 的 → 4220
        with self.assertRaises(TermCategoryValidationError):
            create_term_category(repository, 1, 20, TermCategoryCreateRequest(name="S20", parent_id=s10.id))

    def test_rename_category_and_conflict(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryConflictError,
            TermCategoryCreateRequest,
            TermCategoryUpdateRequest,
            create_term_category,
            update_term_category,
        )

        repository = DemoRepository()
        create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A"))
        b = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="B"))

        renamed = update_term_category(repository, 1, 10, b.id, TermCategoryUpdateRequest(name="B改名"))
        self.assertEqual(renamed.name, "B改名")

        # 改成与 A 同名（同 parent 根）→ 4090
        with self.assertRaises(TermCategoryConflictError):
            update_term_category(repository, 1, 10, b.id, TermCategoryUpdateRequest(name="A"))

    def test_move_category_to_root_and_nested(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            TermCategoryUpdateRequest,
            create_term_category,
            update_term_category,
        )

        repository = DemoRepository()
        a = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A"))
        b = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="B", parent_id=a.id))

        # B 移到根
        moved = update_term_category(repository, 1, 10, b.id, TermCategoryUpdateRequest(parent_id=None))
        self.assertIsNone(moved.parent_id)

        # 再把 B 移回 A 下
        back = update_term_category(repository, 1, 10, b.id, TermCategoryUpdateRequest(parent_id=a.id))
        self.assertEqual(back.parent_id, a.id)

    def test_move_category_into_descendant_or_self_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            TermCategoryUpdateRequest,
            TermCategoryValidationError,
            create_term_category,
            update_term_category,
        )

        repository = DemoRepository()
        r = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="R"))
        a = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A", parent_id=r.id))
        b = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="B", parent_id=a.id))

        # R 移到 B（B 是 R 的后代）→ 防环 4220
        with self.assertRaises(TermCategoryValidationError):
            update_term_category(repository, 1, 10, r.id, TermCategoryUpdateRequest(parent_id=b.id))
        # R 移到自身 → 4220
        with self.assertRaises(TermCategoryValidationError):
            update_term_category(repository, 1, 10, r.id, TermCategoryUpdateRequest(parent_id=r.id))

    def test_move_category_cross_space_target_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            TermCategoryUpdateRequest,
            TermCategoryValidationError,
            create_term_category,
            update_term_category,
        )

        repository = DemoRepository()
        s10 = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="S10"))
        s20 = create_term_category(repository, 1, 20, TermCategoryCreateRequest(name="S20"))
        # space10 的领域移到 space20 的 parent 下 → 跨空间 4220
        with self.assertRaises(TermCategoryValidationError):
            update_term_category(repository, 1, 10, s10.id, TermCategoryUpdateRequest(parent_id=s20.id))

    def test_delete_empty_category_ok(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            create_term_category,
            delete_term_category,
        )

        repository = DemoRepository()
        category = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="F"))
        delete_term_category(repository, 1, 10, category.id)
        self.assertIsNone(repository.get_term_category(category.id))

    def test_delete_category_with_child_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryConflictError,
            TermCategoryCreateRequest,
            create_term_category,
            delete_term_category,
        )

        repository = DemoRepository()
        parent = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="P"))
        create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="C", parent_id=parent.id))
        with self.assertRaises(TermCategoryConflictError):
            delete_term_category(repository, 1, 10, parent.id)

    def test_delete_category_with_term_rejected(self) -> None:
        from backend.model.entities import TermStatus
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term import TermWrite, create_term
        from backend.service.term_category import (
            TermCategoryConflictError,
            TermCategoryCreateRequest,
            create_term_category,
            delete_term_category,
        )

        repository = DemoRepository()
        category = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="研发与开发流程"))
        create_term(
            repository,
            user_id=1,
            current_space_id=10,
            request=TermWrite(
                term="需求分析",
                definition="对用户需求进行归纳。",
                aliases=[],
                status=TermStatus.CONFIRMED,
                category_id=category.id,
            ),
        )
        # 领域下有术语 → 删非空 4090
        with self.assertRaises(TermCategoryConflictError):
            delete_term_category(repository, 1, 10, category.id)

    def test_reorder_categories(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            create_term_category,
            list_term_categories,
            reorder_term_categories,
        )

        repository = DemoRepository()
        a = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A"))
        b = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="B"))
        c = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="C"))

        reorder_term_categories(repository, 1, 10, None, [c.id, a.id, b.id])
        views = list_term_categories(repository, 1, 10, None)
        self.assertEqual([v.id for v in views], [c.id, a.id, b.id])
        self.assertEqual([v.order_idx for v in views], [1, 2, 3])

    def test_reorder_partial_rejected(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            TermCategoryValidationError,
            create_term_category,
            reorder_term_categories,
        )

        repository = DemoRepository()
        a = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="A"))
        create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="B"))
        # ordered_ids 必须恰好等于该层全部子领域；漏 B → 4220
        with self.assertRaises(TermCategoryValidationError):
            reorder_term_categories(repository, 1, 10, None, [a.id])

    def test_cross_space_isolation(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.term_category import (
            TermCategoryCreateRequest,
            create_term_category,
            list_term_categories,
        )

        repository = DemoRepository()
        create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="Space10C"))
        create_term_category(repository, 1, 20, TermCategoryCreateRequest(name="Space20C"))

        names10 = {v.name for v in list_term_categories(repository, 1, 10, None)}
        names20 = {v.name for v in list_term_categories(repository, 1, 20, None)}
        self.assertEqual(names10, {"Space10C"})
        self.assertEqual(names20, {"Space20C"})


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class TermCategoryApiTest(unittest.TestCase):
    """REQ-036 领域树 API：通过 endpoint 函数（替换 repository 单例 + demo token）。"""

    def test_term_categories_crud_move_reorder_via_api(self) -> None:
        from backend.api import term_categories as tc_api
        from backend.repository.demo_repository import DemoRepository

        repository = DemoRepository()
        original_repository = tc_api.repository
        tc_api.repository = repository
        try:
            ctx = _demo_ctx()

            created = tc_api.create_term_category_endpoint(
                request=tc_api.TermCategoryCreateBody(name="研发与开发流程"),
                ctx=ctx,
            )
            self.assertEqual(created["code"], 0)
            category_id = created["data"]["id"]
            self.assertIsNone(created["data"]["parent_id"])

            child = tc_api.create_term_category_endpoint(
                request=tc_api.TermCategoryCreateBody(name="测试验证", parent_id=category_id),
                ctx=ctx,
            )
            self.assertEqual(child["data"]["parent_id"], category_id)

            listed = tc_api.list_term_categories_endpoint(ctx=ctx)
            self.assertEqual(listed["data"]["total"], 1)
            self.assertEqual(listed["data"]["items"][0]["child_category_count"], 1)

            child_listed = tc_api.list_term_categories_endpoint(parent_id=category_id, ctx=ctx)
            self.assertEqual(child_listed["data"]["total"], 1)

            renamed = tc_api.update_term_category_endpoint(
                category_id=category_id,
                request=tc_api.TermCategoryUpdateBody(name="研发与开发流程改名"),
                ctx=ctx,
            )
            self.assertEqual(renamed["data"]["name"], "研发与开发流程改名")

            moved = tc_api.update_term_category_endpoint(
                category_id=child["data"]["id"],
                request=tc_api.TermCategoryUpdateBody(parent_id=None),
                ctx=ctx,
            )
            self.assertIsNone(moved["data"]["parent_id"])

            root_list = tc_api.list_term_categories_endpoint(ctx=ctx)
            ids = [item["id"] for item in root_list["data"]["items"]]
            reordered = tc_api.reorder_term_categories_endpoint(
                request=tc_api.TermCategoryReorderBody(parent_id=None, ordered_ids=list(reversed(ids))),
                ctx=ctx,
            )
            self.assertEqual(reordered["code"], 0)

            deleted = tc_api.delete_term_category_endpoint(category_id=child["data"]["id"], ctx=ctx)
            self.assertTrue(deleted["data"]["deleted"])
        finally:
            tc_api.repository = original_repository


if __name__ == "__main__":
    unittest.main()


def _demo_ctx(user_id: int = 1, current_space_id: int = 10):
    from backend.model.entities import User
    from backend.service.auth_context import TokenContext

    return TokenContext(
        user_id=user_id,
        current_space_id=current_space_id,
        session_id=None,
        user=User(id=user_id, external_id="demo", name="Demo"),
    )
