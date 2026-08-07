"""Sprint-28 admin 域用户管理（REQ-046，task-040）：列表 / 过滤 / 改角色 / 禁用启用。"""

import unittest

from backend.repository.demo_repository import DemoRepository
from backend.service.admin import (
    AdminError,
    list_users,
    set_user_status,
    update_user_role,
)
from backend.service.auth import authenticate, register


class AdminUsersServiceTest(unittest.TestCase):
    """DemoRepository 级：管理接口仅 admin（member 4030）+ 禁用后登录 4030 且会话失效。"""

    def setUp(self) -> None:
        self.repo = DemoRepository()
        self.alice = self.repo.find_user_by_external_id("alice")
        self.kira = self.repo.find_user_by_external_id("kira")

    def test_list_users_requires_admin(self) -> None:
        with self.assertRaises(AdminError) as ctx:
            list_users(self.repo, self.kira)
        self.assertEqual(ctx.exception.code, 4030)

    def test_list_users_returns_all(self) -> None:
        rows = list_users(self.repo, self.alice)
        self.assertEqual([row.external_id for row in rows], ["alice", "kira", "brightlite-member"])

    def test_list_users_filters(self) -> None:
        self.assertEqual([r.external_id for r in list_users(self.repo, self.alice, role="admin")], ["alice"])
        self.assertEqual(
            [r.external_id for r in list_users(self.repo, self.alice, status="active")],
            ["alice", "kira", "brightlite-member"],
        )
        self.assertEqual([r.external_id for r in list_users(self.repo, self.alice, q="kira")], ["kira"])
        self.assertEqual([r.external_id for r in list_users(self.repo, self.alice, q="alice@")], ["alice"])

    def test_update_user_role(self) -> None:
        updated = update_user_role(self.repo, self.alice, self.kira.id, "admin")
        self.assertEqual(updated.role, "admin")
        self.assertEqual(self.repo.find_user_by_id(self.kira.id).role, "admin")

    def test_update_user_role_rejects_member_actor(self) -> None:
        with self.assertRaises(AdminError) as ctx:
            update_user_role(self.repo, self.kira, self.alice.id, "member")
        self.assertEqual(ctx.exception.code, 4030)

    def test_update_user_role_rejects_invalid_role(self) -> None:
        with self.assertRaises(AdminError) as ctx:
            update_user_role(self.repo, self.alice, self.kira.id, "superadmin")
        self.assertEqual(ctx.exception.code, 4220)

    def test_update_user_role_missing_user(self) -> None:
        with self.assertRaises(AdminError) as ctx:
            update_user_role(self.repo, self.alice, 999999, "admin")
        self.assertEqual(ctx.exception.code, 4004)

    def test_disable_blocks_login_and_revokes_sessions(self) -> None:
        register(self.repo, "victim@example.com", "Victim", "password123")
        victim = self.repo.find_user_by_email("victim@example.com")
        authenticate(self.repo, "victim@example.com", "password123")
        self.assertEqual(len(self.repo.list_sessions(victim.id)), 1)

        updated = set_user_status(self.repo, self.alice, victim.id, "disabled")
        self.assertEqual(updated.status, "disabled")
        # 禁用后既有会话失效
        self.assertEqual(self.repo.list_sessions(victim.id), [])
        # 禁用后登录被拒（4030）
        with self.assertRaises(Exception) as ctx:
            authenticate(self.repo, "victim@example.com", "password123")
        self.assertEqual(getattr(ctx.exception, "code", None), 4030)

    def test_enable_restores_login(self) -> None:
        register(self.repo, "victim@example.com", "Victim", "password123")
        victim = self.repo.find_user_by_email("victim@example.com")
        set_user_status(self.repo, self.alice, victim.id, "disabled")
        set_user_status(self.repo, self.alice, victim.id, "active")
        token, _ = authenticate(self.repo, "victim@example.com", "password123")
        self.assertIsNotNone(token)

    def test_set_status_rejects_member_actor(self) -> None:
        with self.assertRaises(AdminError) as ctx:
            set_user_status(self.repo, self.kira, self.alice.id, "disabled")
        self.assertEqual(ctx.exception.code, 4030)

    def test_set_status_rejects_invalid_status(self) -> None:
        with self.assertRaises(AdminError) as ctx:
            set_user_status(self.repo, self.alice, self.kira.id, "pending")
        self.assertEqual(ctx.exception.code, 4220)


if __name__ == "__main__":
    unittest.main()
