"""PostgreSQL + pgvector 连接管理（Sprint-8 / task-008 T1 基建）。

T1 验证「后端能连上 PG + pgvector 扩展可用」。
T2 起在 ``init_db`` 中按文件名顺序幂等执行 ``backend/migrations/*.sql``。
连接池 / ORM 在 T3 接入 SQLAlchemy engine 时统一；本模块用 psycopg 同步直连。

DATABASE_URL 默认指向 docker/compose.yml 起的 lumen-pg 容器（localhost:15432）。
"""

from __future__ import annotations

import glob
import os

import psycopg

_DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://lumen:lumen@localhost:15432/lumen"
)

_MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "migrations")


def get_connection():
    """返回一个新的 psycopg 同步连接；调用方负责关闭（推荐 `with`）。"""
    return psycopg.connect(_DATABASE_URL)


def _run_migrations(cur) -> None:
    """按文件名顺序、幂等地执行 backend/migrations/*.sql。

    现有迁移均为 ``CREATE ... IF NOT EXISTS`` / ``DROP TRIGGER IF EXISTS`` 风格，
    可安全重复执行。迁移未做版本号追踪（Phase1 Demo 足够）；正式版本管理留 T7 评估。
    """
    paths = sorted(glob.glob(os.path.join(_MIGRATIONS_DIR, "*.sql")))
    for path in paths:
        with open(path, "r", encoding="utf-8-sig") as f:
            cur.execute(f.read())


def init_db() -> None:
    """应用启动时调用：创建 pgvector 扩展 + 跑全部迁移。幂等。"""
    with psycopg.connect(_DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        _run_migrations(cur)
        conn.commit()


def ping() -> str:
    """连通性 + pgvector 自检：返回 PostgreSQL 版本字符串。"""
    with psycopg.connect(_DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute("SELECT version()")
        return cur.fetchone()[0]
