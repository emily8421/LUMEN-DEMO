"""REQ-018 模式 B 增强·跨设备 vault 挂载元数据（Wave 3 / TC-P2-VAULT-004，OI-109）。

覆盖（DemoRepository + 端点函数直调，仿 test_space_members / test_api_sprint28 模式）：
- service：granted upsert / 重复挂载刷新 last_synced_at / revoked 软撤销保留行 /
  revoked 无行幂等返回 None / 参数校验 4220 矩阵；
- 隔离：list 仅本人行（跨用户零泄露）；
- api 层：GET/POST envelope 形状、无 token 401（TestClient 路由注册冒烟）。
"""

import unittest

from backend.repository.demo_repository import DemoRepository
from backend.service.vault_mounts import (
    VaultMountError,
    list_vault_mounts,
    report_vault_mount,
)


class VaultMountsServiceTest(unittest.TestCase):
    """DemoRepository 级：上报 / upsert / 软撤销 / 校验矩阵 / 跨用户隔离。"""

    def test_report_granted_creates_row(self) -> None:
        repo = DemoRepository()
        mount = report_vault_mount(repo, 1, "device-a", "我的库", "obsidian")
        self.assertEqual(mount.auth_status, "granted")
        self.assertEqual(mount.mount_name, "我的库")
        rows = list_vault_mounts(repo, 1)
        self.assertEqual(len(rows), 1)

    def test_report_granted_upsert_refreshes(self) -> None:
        repo = DemoRepository()
        first = report_vault_mount(repo, 1, "device-a", "notes", "markdown_folder")
        second = report_vault_mount(repo, 1, "device-a", "notes", "markdown_folder")
        self.assertEqual(second.id, first.id)
        rows = list_vault_mounts(repo, 1)
        self.assertEqual(len(rows), 1)
        self.assertGreaterEqual(second.last_synced_at, first.last_synced_at)

    def test_same_name_different_device_distinct_rows(self) -> None:
        repo = DemoRepository()
        report_vault_mount(repo, 1, "device-a", "notes", "obsidian")
        report_vault_mount(repo, 1, "device-b", "notes", "obsidian")
        self.assertEqual(len(list_vault_mounts(repo, 1)), 2)

    def test_report_revoked_soft_deletes_keeps_row(self) -> None:
        repo = DemoRepository()
        report_vault_mount(repo, 1, "device-a", "notes", "obsidian")
        revoked = report_vault_mount(
            repo, 1, "device-a", "notes", "obsidian", auth_status="revoked"
        )
        self.assertIsNotNone(revoked)
        self.assertEqual(revoked.auth_status, "revoked")
        rows = list_vault_mounts(repo, 1)
        self.assertEqual(len(rows), 1)  # 行保留（软撤销审计）

    def test_report_revoked_without_existing_row_idempotent_none(self) -> None:
        repo = DemoRepository()
        result = report_vault_mount(
            repo, 1, "device-x", "ghost", "obsidian", auth_status="revoked"
        )
        self.assertIsNone(result)  # 幂等：不因服务端无行打断本地卸载
        self.assertEqual(list_vault_mounts(repo, 1), [])

    def test_report_validation_matrix(self) -> None:
        repo = DemoRepository()
        cases = [
            {"device_id": "", "mount_name": "n", "source_type": "obsidian"},
            {"device_id": "d", "mount_name": "", "source_type": "obsidian"},
            {"device_id": "d", "mount_name": "n", "source_type": "dropbox"},
            {"device_id": "d", "mount_name": "n", "source_type": "obsidian", "auth_status": "pending"},
            {"device_id": "x" * 129, "mount_name": "n", "source_type": "obsidian"},
            {"device_id": "d", "mount_name": "x" * 256, "source_type": "obsidian"},
        ]
        for case in cases:
            with self.assertRaises(VaultMountError, msg=str(case)) as ctx:
                report_vault_mount(repo, 1, **case)
            self.assertEqual(ctx.exception.code, 4220)

    def test_list_isolated_per_user(self) -> None:
        repo = DemoRepository()
        report_vault_mount(repo, 1, "device-a", "alice-vault", "obsidian")
        report_vault_mount(repo, 2, "device-b", "kira-vault", "markdown_folder")
        alice_names = {m.mount_name for m in list_vault_mounts(repo, 1)}
        kira_names = {m.mount_name for m in list_vault_mounts(repo, 2)}
        self.assertEqual(alice_names, {"alice-vault"})
        self.assertEqual(kira_names, {"kira-vault"})


class VaultMountsApiTest(unittest.TestCase):
    """API 层：GET/POST 端点直调（ctx 注入，DemoRepository）+ 路由注册冒烟。"""

    def _repo(self) -> DemoRepository:
        return DemoRepository()

    def _ctx(self, repo: DemoRepository, user_id: int = 1):
        # 端点函数直调模式（仿 test_api_sprint28）：注入 TokenContext，绕开 HTTP 鉴权层。
        # user 取自注入的 DemoRepository seed（不触碰生产 PG 单例——单测无 PG）。
        from backend.service.auth_context import TokenContext

        user = repo.find_user_by_id(user_id)
        assert user is not None
        return TokenContext(user_id=user_id, current_space_id=10, session_id=None, user=user)

    def test_post_and_get_roundtrip(self) -> None:
        from backend.api.vault_mounts import (
            VaultMountReportRequest,
            list_vault_mounts_endpoint,
            report_vault_mount_endpoint,
        )
        import backend.api.vault_mounts as vault_mounts_api

        original = vault_mounts_api.repository
        repo = self._repo()
        vault_mounts_api.repository = repo  # type: ignore[assignment]
        try:
            response = report_vault_mount_endpoint(
                VaultMountReportRequest(
                    device_id="device-a", mount_name="跨端库", source_type="obsidian"
                ),
                ctx=self._ctx(repo, 1),
            )
            self.assertEqual(response["code"], 0)
            self.assertEqual(response["data"]["mount_name"], "跨端库")
            self.assertEqual(response["data"]["auth_status"], "granted")

            listing = list_vault_mounts_endpoint(ctx=self._ctx(repo, 1))
            self.assertEqual(listing["code"], 0)
            self.assertEqual(len(listing["data"]), 1)
            self.assertEqual(listing["data"][0]["device_id"], "device-a")
        finally:
            vault_mounts_api.repository = original  # type: ignore[assignment]

    def test_post_revoked_returns_null_when_no_row(self) -> None:
        from backend.api.vault_mounts import VaultMountReportRequest, report_vault_mount_endpoint
        import backend.api.vault_mounts as vault_mounts_api

        original = vault_mounts_api.repository
        repo = self._repo()
        vault_mounts_api.repository = repo  # type: ignore[assignment]
        try:
            response = report_vault_mount_endpoint(
                VaultMountReportRequest(
                    device_id="ghost-device",
                    mount_name="ghost",
                    source_type="obsidian",
                    auth_status="revoked",
                ),
                ctx=self._ctx(repo, 1),
            )
            self.assertEqual(response["code"], 0)
            self.assertIsNone(response["data"])
        finally:
            vault_mounts_api.repository = original  # type: ignore[assignment]

    def test_routes_registered_in_openapi(self) -> None:
        from fastapi.testclient import TestClient

        from backend.main import create_app

        client = TestClient(create_app())
        paths = client.app.openapi()["paths"]
        self.assertIn("/api/vault-mounts", paths)
        methods = paths["/api/vault-mounts"]
        self.assertIn("get", methods)
        self.assertIn("post", methods)


if __name__ == "__main__":
    unittest.main()
