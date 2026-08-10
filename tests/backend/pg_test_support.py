"""测试数据库安全 guard（P0-1 / NFR-005 / task-041）。

防止 PG 集成测试误清开发库：破坏性操作（TRUNCATE）必须在独立 ``lumen_test``
库执行，并满足三重 fail-closed 条件。任一不满足抛 ``UnsafeTestDatabaseError``，
**不降级为 skip**——fail-closed 是本 guard 的核心语义（评估 §4.2）。

guard 是测试侧纯函数，不进 ``backend/service/``（生产 service 不承载测试专属
破坏性逻辑）；只接收 URL 字符串校验，不连接数据库，也不 import 生产 engine
（避免触发 ``backend/service/db.py`` 模块级 engine 创建）。错误信息不含连接串 /
凭证。

实施口径：``docs/research/2026-08-10-code-governance-rollout-plan.md`` §3 P0-1。
"""

from __future__ import annotations

import os
from urllib.parse import urlsplit

# backend/service/db.py 的 engine 用 postgresql+psycopg://；_DATABASE_URL 用 postgresql://
_PG_SCHEMES = ("postgresql", "postgresql+psycopg")


class UnsafeTestDatabaseError(RuntimeError):
    """测试数据库不满足安全条件时抛出。

    错误信息只列失败条件，**不含连接串 / 凭证**（防日志泄露，评估 §4.2）。
    """


def database_name(database_url: str) -> str | None:
    """从 DATABASE_URL 解析数据库名（path 首段，去前导斜杠）。

    用 ``urlsplit`` 而非 SQLAlchemy，避免 guard 依赖生产 engine 类型；传入 URL 不连库。
    """
    path = urlsplit(database_url).path
    if not path:
        return None
    name = path.lstrip("/").split("/")[0]
    return name or None


def assert_test_database_safe(database_url: str) -> None:
    """校验破坏性测试操作的三重 fail-closed 条件。

    条件（**全部**满足才放行）：
      1. ``LUMEN_ENV`` 精确等于 ``test``；
      2. 数据库名以 ``_test`` 结尾，且 scheme 为 PostgreSQL；
      3. ``ALLOW_DESTRUCTIVE_TEST_DB`` 精确等于 ``1``。

    任一不满足 → 抛 ``UnsafeTestDatabaseError``（**不降级 skip**）。
    错误信息只列失败条件，不含连接串 / 凭证。

    必须在连接 ``try/except`` **外**调用，避免被宽泛 ``except Exception`` 吞成 skip；
    每次 TRUNCATE 前应二次调用（评估 §4.2）。
    """
    failures: list[str] = []

    if os.environ.get("LUMEN_ENV") != "test":
        failures.append("LUMEN_ENV 必须精确等于 'test'")

    scheme = urlsplit(database_url).scheme
    if scheme not in _PG_SCHEMES:
        failures.append(f"DATABASE_URL scheme 必须是 PostgreSQL（当前: {scheme or '空'}）")

    db_name = database_name(database_url)
    if not db_name or not db_name.endswith("_test"):
        failures.append("数据库名必须以 '_test' 结尾（避免误清开发库）")

    if os.environ.get("ALLOW_DESTRUCTIVE_TEST_DB") != "1":
        failures.append("ALLOW_DESTRUCTIVE_TEST_DB 必须精确等于 '1'")

    if failures:
        raise UnsafeTestDatabaseError(
            "拒绝在测试数据库执行破坏性操作——以下条件未满足：\n  - "
            + "\n  - ".join(failures)
            + "\n（配置：LUMEN_ENV=test + 独立 *_test 库 + ALLOW_DESTRUCTIVE_TEST_DB=1）"
        )


def assert_test_database_safe_from_engine(engine) -> None:
    """从 SQLAlchemy ``engine.url`` 解析后校验（供已建 engine 的测试用）。

    优先用 ``engine.url``（测试实际使用的 URL），而非 ``DATABASE_URL`` env——
    ``backend/service/db.py`` 在模块加载时即固化 engine，后续改 env 不生效。
    """
    assert_test_database_safe(str(engine.url))
