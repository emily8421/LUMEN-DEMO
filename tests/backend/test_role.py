"""Sprint-28 全局角色分层（REQ-045，task-040）：role 默认值 / seed 对齐 / 鉴权谓词。"""

import unittest

from backend.repository.demo_repository import DemoRepository
from backend.service.admin import AdminError, require_global_admin
from backend.service.auth import register


class RoleServiceTest(unittest.TestCase):
    """DemoRepository 级：C-ROLE-001/004 seed 与注册默认值 + 全局 admin 谓词。"""

    def test_demo_seed_alice_is_admin(self) -> None:
        repo = DemoRepository()
        alice = repo.find_user_by_external_id("alice")
        self.assertEqual(alice.role, "admin")

    def test_demo_seed_members_are_member(self) -> None:
        repo = DemoRepository()
        self.assertEqual(repo.find_user_by_external_id("kira").role, "member")
        self.assertEqual(repo.find_user_by_external_id("brightlite-member").role, "member")

    def test_register_defaults_to_member(self) -> None:
        repo = DemoRepository()
        user = register(repo, "new@example.com", "New User", "password123")
        self.assertEqual(user.role, "member")

    def test_require_global_admin_accepts_admin(self) -> None:
        repo = DemoRepository()
        require_global_admin(repo.find_user_by_external_id("alice"))

    def test_require_global_admin_rejects_member(self) -> None:
        repo = DemoRepository()
        kira = repo.find_user_by_external_id("kira")
        with self.assertRaises(AdminError) as ctx:
            require_global_admin(kira)
        self.assertEqual(ctx.exception.code, 4030)


if __name__ == "__main__":
    unittest.main()
