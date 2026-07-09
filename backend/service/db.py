"""PostgreSQL + pgvector 连接管理（Sprint-8 / task-008 T1 基建）。

T1 仅验证「后端能连上 PG + pgvector 扩展可用」。
连接池 / ORM 在 T3 接入 SQLAlchemy engine 时统一；本模块用 psycopg 同步直连。

DATABASE_URL 默认指向 docker/compose.yml 起的 lumen-pg 容器（localhost:15432）。
"""

from __future__ import annotations

import os

import psycopg

_DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://lumen:lumen@localhost:15432/lumen"
)


def get_connection():
    """返回一个新的 psycopg 同步连接；调用方负责关闭（推荐 `with`）。"""
    return psycopg.connect(_DATABASE_URL)


def init_db() -> None:
    """应用启动时调用：确保 pgvector 扩展已创建。幂等。"""
    with psycopg.connect(_DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.commit()


def ping() -> str:
    """连通性 + pgvector 自检：返回 PostgreSQL 版本字符串。"""
    with psycopg.connect(_DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute("SELECT version()")
        return cur.fetchone()[0]
