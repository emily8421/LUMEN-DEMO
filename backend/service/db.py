"""PostgreSQL + pgvector 连接管理（Sprint-8 / task-008）。

T1 验证「后端能连上 PG + pgvector 扩展可用」。
T2 起在 ``init_db`` 中按文件名顺序幂等执行 ``backend/migrations/*.sql``。
T3 接入 SQLAlchemy engine + 会话工厂（PgRepository 用）。
低层仍保留 psycopg 同步直连（init_db / ping 自检）。

DATABASE_URL 默认指向 docker/compose.yml 起的 lumen-pg 容器（localhost:15432）。
"""

from __future__ import annotations

import glob
import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

_DEFAULT_CONNECT_TIMEOUT_SECONDS = "5"


def _with_default_connect_timeout(url: str) -> str:
    """Ensure PG-unavailable tests fail fast instead of hanging on TCP connect."""
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    if "connect_timeout" in query:
        return url
    query["connect_timeout"] = _DEFAULT_CONNECT_TIMEOUT_SECONDS
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


_DATABASE_URL = _with_default_connect_timeout(
    os.environ.get("DATABASE_URL", "postgresql://lumen:lumen@localhost:15432/lumen")
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


# --- SQLAlchemy engine / sessions（T3：ORM + PgRepository）---

# SQLAlchemy 默认 postgresql:// 走 psycopg2（未安装）；显式 +psycopg 用 psycopg3。
# psycopg.connect 仍用原始 _DATABASE_URL（标准 scheme），互不影响。
_sa_url = _DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_engine(_sa_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=True)


def get_session() -> Session:
    """返回一个新的 SQLAlchemy 同步会话；调用方负责关闭（推荐 `with`）。"""
    return SessionLocal()
