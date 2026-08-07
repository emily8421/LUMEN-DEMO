"""Sprint-28 space 域成员管理（REQ-047，task-040）：按 email 添加 / 改角色 / 移除 + 用户搜索。"""

import unittest

from backend.repository.demo_repository import DemoRepository
from backend.service.admin import update_user_role
from backend.service.auth import register
from backend.service.space_members import (
    SpaceMemberError,
    add_member_by_email,
    list_space_members,
    remove_member,
    search_users,
    update_member_role,
)


class SpaceMembersServiceTest(unittest.TestCase):
    """DemoRepository 级：C-ROLE-003/006/007 全路径 + 越权矩阵（demo 仓储不旁路鉴权）。"""

    def setUp(self) -> None:
        self.repo = DemoRepository()
        self.alice = self.repo.find_user_by_external_id("alice")  # 全局 admin + 空间 10/20 admin
        self.kira = self.repo.find_user_by_external_id("kira")  # 空间 10 member（非 admin）
        self.bright = self.repo.find_user_by_external_id("brightlite-member")  # 空间 20 member

    def test_list_members_any_space_member(self) -> None:
        rows = list_space_members(self.repo, self.kira, 10)
        self.assertEqual([row.user_id for row in rows], [1, 2])
        self.assertEqual(rows[0].role.value, "admin")
        self.assertTrue(all(row.joined_at for row in rows))

    def test_list_members_non_member_denied(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            list_space_members(self.repo, self.bright, 10)
        self.assertEqual(ctx.exception.code, 4003)

    def test_list_members_space_not_found(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            list_space_members(self.repo, self.alice, 999999)
        self.assertEqual(ctx.exception.code, 4004)

    def test_add_member_by_email(self) -> None:
        register(self.repo, "newbie@example.com", "Newbie", "password123")
        detail = add_member_by_email(self.repo, self.alice, 20, "newbie@example.com")
        self.assertEqual(detail.role.value, "member")
        memberships = self.repo.list_memberships()
        self.assertTrue(any(m.user_id == detail.user_id and m.space_id == 20 for m in memberships))

    def test_add_member_normalizes_email(self) -> None:
        register(self.repo, "newbie@example.com", "Newbie", "password123")
        detail = add_member_by_email(self.repo, self.alice, 20, "  NewBie@Example.COM ")
        self.assertIsNotNone(detail)

    def test_add_member_requires_space_admin(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            add_member_by_email(self.repo, self.kira, 10, "ghost@example.com")
        self.assertEqual(ctx.exception.code, 4030)

    def test_add_member_user_not_found(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            add_member_by_email(self.repo, self.alice, 10, "ghost@example.com")
        self.assertEqual(ctx.exception.code, 4004)

    def test_add_member_duplicate_409(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            add_member_by_email(self.repo, self.alice, 10, "kira@example.com")
        self.assertEqual(ctx.exception.code, 4090)

    def test_add_member_invalid_role(self) -> None:
        register(self.repo, "newbie@example.com", "Newbie", "password123")
        with self.assertRaises(SpaceMemberError) as ctx:
            add_member_by_email(self.repo, self.alice, 10, "newbie@example.com", role="owner")
        self.assertEqual(ctx.exception.code, 4220)

    def test_update_member_role(self) -> None:
        detail = update_member_role(self.repo, self.alice, 10, self.kira.id, "admin")
        self.assertEqual(detail.role.value, "admin")

    def test_update_member_role_requires_space_admin(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            update_member_role(self.repo, self.kira, 10, self.alice.id, "member")
        self.assertEqual(ctx.exception.code, 4030)

    def test_update_member_role_member_not_found(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            update_member_role(self.repo, self.alice, 10, 999999, "admin")
        self.assertEqual(ctx.exception.code, 4004)

    def test_demote_last_admin_409(self) -> None:
        # 空间 20 仅 alice 一个 admin：降级自己 -> 4090（C-ROLE-006）
        with self.assertRaises(SpaceMemberError) as ctx:
            update_member_role(self.repo, self.alice, 20, self.alice.id, "member")
        self.assertEqual(ctx.exception.code, 4090)

    def test_remove_member(self) -> None:
        self.assertTrue(remove_member(self.repo, self.alice, 10, self.kira.id))
        memberships = self.repo.list_memberships()
        self.assertFalse(any(m.user_id == self.kira.id and m.space_id == 10 for m in memberships))

    def test_remove_member_loses_access(self) -> None:
        remove_member(self.repo, self.alice, 10, self.kira.id)
        with self.assertRaises(SpaceMemberError) as ctx:
            list_space_members(self.repo, self.kira, 10)
        self.assertEqual(ctx.exception.code, 4003)

    def test_remove_last_admin_409(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            remove_member(self.repo, self.alice, 20, self.alice.id)
        self.assertEqual(ctx.exception.code, 4090)

    def test_remove_member_requires_space_admin(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            remove_member(self.repo, self.kira, 10, self.alice.id)
        self.assertEqual(ctx.exception.code, 4030)

    def test_global_admin_manages_any_space(self) -> None:
        # C-ROLE-007：kira 提升为全局 admin 后，可管理其非成员空间 20
        update_user_role(self.repo, self.alice, self.kira.id, "admin")
        kira_admin = self.repo.find_user_by_id(self.kira.id)
        register(self.repo, "x@example.com", "X", "password123")
        detail = add_member_by_email(self.repo, kira_admin, 20, "x@example.com")
        self.assertIsNotNone(detail)

    def test_search_users_member_denied(self) -> None:
        with self.assertRaises(SpaceMemberError) as ctx:
            search_users(self.repo, self.bright, "a")
        self.assertEqual(ctx.exception.code, 4030)

    def test_search_users_global_admin_allowed(self) -> None:
        rows = search_users(self.repo, self.alice, "ali")
        self.assertTrue(any(user.email == "alice@example.com" for user in rows))

    def test_search_users_space_admin_allowed(self) -> None:
        # kira 成为空间 10 admin（非全局 admin）后可用搜索
        update_member_role(self.repo, self.alice, 10, self.kira.id, "admin")
        kira = self.repo.find_user_by_id(self.kira.id)
        rows = search_users(self.repo, kira, "bright")
        self.assertTrue(any(user.email == "brightlite-member@example.com" for user in rows))


if __name__ == "__main__":
    unittest.main()
