"""CQ-P1-001 fail-fast / readiness（health 端点 + lifespan）单测。

覆盖：
- ``GET /api/health/live`` 恒 200；
- ``GET /api/health/ready`` demo 模式 200 / PG 模式 db.ping() 失败 → 503 + 5031；
- lifespan：PG 模式 init_db 失败 fail-fast（启动 RuntimeError）/ demo 模式容忍仍可启动。

所有用例 mock ``init_db`` / ``is_demo_repository`` / ``db.ping``，不依赖真实 PG。
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app


def _pg_boom(*args, **kwargs):
    raise RuntimeError("pg unavailable")


def test_health_live_ok():
    """live 探针恒 200（demo 模式启动，init_db 失败被容忍）。"""
    with patch("backend.service.auth.is_demo_repository", return_value=True), \
         patch("backend.service.db.init_db", side_effect=_pg_boom):
        client = TestClient(create_app())
        with client:
            resp = client.get("/api/health/live")
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["status"] == "ok"


def test_health_ready_demo_ok():
    """demo 仓储模式 ready 探针恒 200（不探测 PG）。"""
    with patch("backend.service.auth.is_demo_repository", return_value=True), \
         patch("backend.service.db.init_db", side_effect=_pg_boom), \
         patch("backend.api.health.is_demo_repository", return_value=True):
        client = TestClient(create_app())
        with client:
            resp = client.get("/api/health/ready")
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "ready"


def test_health_ready_pg_unavailable_returns_503():
    """PG 模式 db.ping() 失败 → 503 + code 5031（DB_NOT_READY）。

    lifespan 以 demo 模式容忍启动（隔离测 health 端点的 PG 失败路径）；
    health 端点 is_demo_repository=False + db_ping raise → 503。
    """
    with patch("backend.service.auth.is_demo_repository", return_value=True), \
         patch("backend.service.db.init_db", side_effect=_pg_boom), \
         patch("backend.api.health.is_demo_repository", return_value=False), \
         patch("backend.api.health.db_ping", side_effect=RuntimeError("pg down")):
        client = TestClient(create_app())
        with client:
            resp = client.get("/api/health/ready")
    assert resp.status_code == 503
    body = resp.json()
    assert body["code"] == 5031
    assert body["data"] is None


def test_lifespan_pg_mode_fail_fast():
    """PG 模式 init_db 失败 → lifespan re-raise，TestClient 启动 RuntimeError。"""
    with patch("backend.service.auth.is_demo_repository", return_value=False), \
         patch("backend.service.db.init_db", side_effect=_pg_boom):
        client = TestClient(create_app())
        with pytest.raises(RuntimeError):
            with client:
                pass


def test_lifespan_demo_mode_tolerant():
    """demo 模式 init_db 失败 → lifespan 容忍，app 仍可启动并响应 live。"""
    with patch("backend.service.auth.is_demo_repository", return_value=True), \
         patch("backend.service.db.init_db", side_effect=_pg_boom):
        client = TestClient(create_app())
        with client:
            resp = client.get("/api/health/live")
    assert resp.status_code == 200
