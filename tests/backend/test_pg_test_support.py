"""guard 纯单测（P0-1 / task-041 / 评估 §4.4 ①）。

不连接真实数据库；用显式 URL / env 映射覆盖三条件组合。
"""

from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from pg_test_support import (  # noqa: E402
    UnsafeTestDatabaseError,
    assert_test_database_safe,
    database_name,
)

_SAFE_URL = "postgresql://lumen:lumen@localhost:15432/lumen_test"
_ALL_SAFE_ENV = {"LUMEN_ENV": "test", "ALLOW_DESTRUCTIVE_TEST_DB": "1"}


class TestDatabaseName(unittest.TestCase):
    def test_parses_standard_pg_url(self):
        self.assertEqual(database_name("postgresql://u:p@host:5432/lumen_test"), "lumen_test")

    def test_returns_none_for_empty_path(self):
        self.assertIsNone(database_name("postgresql://u:p@host:5432"))

    def test_ignores_query(self):
        self.assertEqual(database_name("postgresql://u:p@host:5432/prod?sslmode=require"), "prod")


class TestAssertTestDatabaseSafe(unittest.TestCase):
    """三条件全部满足才放行；缺任一即拒；非 PG URL 拒（评估 §4.4 ①）。"""

    def test_all_conditions_met_passes(self):
        with mock.patch.dict(os.environ, _ALL_SAFE_ENV, clear=False):
            assert_test_database_safe(_SAFE_URL)  # 不抛即通过

    def test_missing_lumen_env_rejected(self):
        env = {**_ALL_SAFE_ENV, "LUMEN_ENV": "dev"}
        with mock.patch.dict(os.environ, env, clear=False):
            with self.assertRaises(UnsafeTestDatabaseError):
                assert_test_database_safe(_SAFE_URL)

    def test_dev_database_name_rejected(self):
        # 开发库 lumen（无 _test 后缀）必须拒——核心安全语义
        dev_url = "postgresql://lumen:lumen@localhost:15432/lumen"
        with mock.patch.dict(os.environ, _ALL_SAFE_ENV, clear=False):
            with self.assertRaises(UnsafeTestDatabaseError) as ctx:
                assert_test_database_safe(dev_url)
        self.assertIn("'_test'", str(ctx.exception))

    def test_missing_allow_flag_rejected(self):
        env = {**_ALL_SAFE_ENV, "ALLOW_DESTRUCTIVE_TEST_DB": "0"}
        with mock.patch.dict(os.environ, env, clear=False):
            with self.assertRaises(UnsafeTestDatabaseError):
                assert_test_database_safe(_SAFE_URL)

    def test_non_pg_scheme_rejected(self):
        sqlite_url = "sqlite:///./lumen_test.db"
        with mock.patch.dict(os.environ, _ALL_SAFE_ENV, clear=False):
            with self.assertRaises(UnsafeTestDatabaseError):
                assert_test_database_safe(sqlite_url)

    def test_psycopg_scheme_accepted(self):
        # backend/service/db.py engine 用 postgresql+psycopg:// scheme
        url = "postgresql+psycopg://lumen:lumen@localhost:15432/lumen_test"
        with mock.patch.dict(os.environ, _ALL_SAFE_ENV, clear=False):
            assert_test_database_safe(url)

    def test_error_message_has_no_credentials(self):
        # 失败信息不得含连接串 / 凭证（评估 §4.2）
        url = "postgresql://secret-user:secret-pass@host:15432/lumen"
        env = {"LUMEN_ENV": "dev", "ALLOW_DESTRUCTIVE_TEST_DB": "0"}
        with mock.patch.dict(os.environ, env, clear=False):
            with self.assertRaises(UnsafeTestDatabaseError) as ctx:
                assert_test_database_safe(url)
        msg = str(ctx.exception)
        self.assertNotIn("secret-user", msg)
        self.assertNotIn("secret-pass", msg)


if __name__ == "__main__":
    unittest.main()
