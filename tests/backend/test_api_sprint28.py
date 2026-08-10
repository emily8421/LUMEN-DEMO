"""Sprint-28 API 集成测试（API-044..050，task-040）：真实 PG（不可达时整体跳过）。

admin / space 成员 / 用户搜索端点契约：管理接口仅 admin（member 4030）、不返回 password_hash、
禁用后登录 4030 且会话失效、最后一个空间 admin 4090、按 email 添加 / 改角色 / 移除。
"""

import importlib.util
import os
import sys
import unittest

import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pg_test_support import assert_test_database_safe_from_engine  # noqa: E402

pytestmark = pytest.mark.integration


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class Sprint28ApiTest(unittest.TestCase):
    """与 test_api_routes 同模式：setUpClass 复位 PG 到 seed，端点函数直调。"""

    @classmethod
    def setUpClass(cls) -> None:
        from backend.service.db import engine as _guard_engine

        assert_test_database_safe_from_engine(_guard_engine)
        try:
            from sqlalchemy import text

            from backend.service.db import engine, init_db

            with engine.connect() as conn:
                schema_present = conn.execute(text("SELECT to_regclass('lumen_users')")).scalar()
            if schema_present is None:
                init_db()
            else:
                with engine.connect() as conn:
                    conn.execute(
                        text(
                            "TRUNCATE TABLE lumen_users, lumen_spaces, lumen_space_members, "
                            "lumen_documents, lumen_document_versions, lumen_chunks, "
                            "lumen_imports, lumen_terms, lumen_sessions RESTART IDENTITY CASCADE"
                        )
                    )
                    conn.commit()
                init_db()  # 016 会为 alice 置 role=admin
            cls._engine = engine
        except Exception as exc:  # pragma: no cover - env-dependent
            raise unittest.SkipTest(f"PostgreSQL not available: {exc}") from exc

    @classmethod
    def tearDownClass(cls) -> None:
        engine = getattr(cls, "_engine", None)
        if engine is not None:
            engine.dispose()

    def _login(self, login_id: str) -> tuple[str, object]:
        from backend.api.auth import LoginRequest, login

        response = login(LoginRequest(login_id=login_id, password="demo-pass-1234"))
        self.assertEqual(response["code"], 0)
        return response["data"]["token"], response["data"]

    def _ctx(self, token: str):
        from backend.service.auth_context import get_current_user

        return get_current_user(authorization=f"Bearer {token}")

    def test_login_returns_global_role(self) -> None:
        _, alice_data = self._login("alice")
        _, kira_data = self._login("kira")
        self.assertEqual(alice_data["role"], "admin")
        self.assertEqual(kira_data["role"], "member")

    def test_admin_list_rejects_member(self) -> None:
        from fastapi import HTTPException

        from backend.api.admin import list_users_endpoint

        kira_token, _ = self._login("kira")
        with self.assertRaises(HTTPException) as ctx:
            list_users_endpoint(ctx=self._ctx(kira_token))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], 4030)

    def test_admin_list_ok_and_no_password_hash(self) -> None:
        from backend.api.admin import list_users_endpoint

        alice_token, _ = self._login("alice")
        response = list_users_endpoint(ctx=self._ctx(alice_token))
        self.assertEqual(response["code"], 0)
        rows = response["data"]
        self.assertEqual([row["email"] for row in rows], ["alice@example.com", "kira@example.com", "brightlite-member@example.com"])
        for row in rows:
            self.assertNotIn("password_hash", row)
            self.assertIn("last_login_at", row)
            self.assertIn("role", row)
            self.assertIn("status", row)

    def test_admin_filter(self) -> None:
        from backend.api.admin import list_users_endpoint

        alice_token, _ = self._login("alice")
        response = list_users_endpoint(role="admin", ctx=self._ctx(alice_token))
        self.assertEqual([row["email"] for row in response["data"]], ["alice@example.com"])

    def test_admin_promote_then_disable_blocks_login(self) -> None:
        from backend.api.admin import UpdateUserRequest, update_user_endpoint
        from backend.api.auth import LoginRequest, login

        alice_token, _ = self._login("alice")
        kira_token, kira_data = self._login("kira")

        promoted = update_user_endpoint(
            kira_data["user_id"],
            UpdateUserRequest(role="admin"),
            ctx=self._ctx(alice_token),
        )
        self.assertEqual(promoted["data"]["role"], "admin")

        disabled = update_user_endpoint(
            kira_data["user_id"],
            UpdateUserRequest(status="disabled"),
            ctx=self._ctx(alice_token),
        )
        self.assertEqual(disabled["data"]["status"], "disabled")

        # 禁用后凭证登录被拒（4030）
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as ctx:
            login(LoginRequest(login_id="kira", password="demo-pass-1234"))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], 4030)

        # 禁用后既有会话失效
        from fastapi import HTTPException as HTTPExceptionFastapi
        from backend.api.spaces import list_spaces

        with self.assertRaises(HTTPExceptionFastapi) as ctx2:
            list_spaces(ctx=self._ctx(kira_token))
        self.assertEqual(ctx2.exception.status_code, 401)

        # 恢复 seed 状态（active + member），避免后续用例受禁用影响
        update_user_endpoint(
            kira_data["user_id"],
            UpdateUserRequest(status="active"),
            ctx=self._ctx(alice_token),
        )
        update_user_endpoint(
            kira_data["user_id"],
            UpdateUserRequest(role="member"),
            ctx=self._ctx(alice_token),
        )

    def test_member_add_duplicate_and_remove(self) -> None:
        from backend.api.space_members import (
            AddMemberRequest,
            add_member_endpoint,
            list_members_endpoint,
            remove_member_endpoint,
        )

        alice_token, _ = self._login("alice")
        ctx = self._ctx(alice_token)

        # brightlite（空间 20 member）加入空间 10
        added = add_member_endpoint(10, AddMemberRequest(email="brightlite-member@example.com"), ctx=ctx)
        self.assertEqual(added["code"], 0)
        self.assertEqual(added["data"]["role"], "member")
        self.assertEqual(added["data"]["user_id"], 3)

        # 重复添加 409
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as dup_ctx:
            add_member_endpoint(10, AddMemberRequest(email="brightlite-member@example.com"), ctx=ctx)
        self.assertEqual(dup_ctx.exception.status_code, 409)
        self.assertEqual(dup_ctx.exception.detail["code"], 4090)

        # 移除后失去空间访问
        self.assertEqual(remove_member_endpoint(10, 3, ctx=ctx)["code"], 0)
        bright_token, _ = self._login("brightlite-member")
        from fastapi import HTTPException as H2

        with self.assertRaises(H2) as access_ctx:
            list_members_endpoint(10, ctx=self._ctx(bright_token))
        self.assertEqual(access_ctx.exception.detail["code"], 4003)

    def test_member_add_requires_space_admin(self) -> None:
        from backend.api.space_members import AddMemberRequest, add_member_endpoint

        from fastapi import HTTPException

        kira_token, _ = self._login("kira")  # 空间 10 member（非 admin）
        with self.assertRaises(HTTPException) as ctx:
            add_member_endpoint(10, AddMemberRequest(email="brightlite-member@example.com"), ctx=self._ctx(kira_token))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], 4030)

    def test_demote_last_space_admin_409(self) -> None:
        from backend.api.space_members import UpdateMemberRoleRequest, update_member_role_endpoint

        from fastapi import HTTPException

        alice_token, _ = self._login("alice")
        # 空间 20 仅 alice 一个 admin：降级自己 -> 4090（C-ROLE-006）
        with self.assertRaises(HTTPException) as ctx:
            update_member_role_endpoint(20, 1, UpdateMemberRoleRequest(role="member"), ctx=self._ctx(alice_token))
        self.assertEqual(ctx.exception.status_code, 409)
        self.assertEqual(ctx.exception.detail["code"], 4090)

    def test_user_search_admin_allowed_member_denied(self) -> None:
        from backend.api.users import search_users_endpoint

        from fastapi import HTTPException

        alice_token, _ = self._login("alice")
        response = search_users_endpoint(q="kira", ctx=self._ctx(alice_token))
        self.assertEqual(response["code"], 0)
        self.assertEqual([row["email"] for row in response["data"]], ["kira@example.com"])
        self.assertNotIn("password_hash", response["data"][0])

        kira_token, _ = self._login("kira")
        with self.assertRaises(HTTPException) as ctx:
            search_users_endpoint(q="kira", ctx=self._ctx(kira_token))
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["code"], 4030)


if __name__ == "__main__":
    unittest.main()
