"""Health 端点：进程存活 + 就绪探测（CQ-P1-001）。

- ``GET /api/health/live``：进程存活即 200（不检查依赖）。
- ``GET /api/health/ready``：demo 仓储模式恒 200（无 PG 强依赖）；PG 模式探测
  ``db.ping()``，失败返回 503 + code 5031（DB_NOT_READY），成功 200 并附 PG 版本。
  供容器编排 healthcheck / 运维探活使用。
"""

from __future__ import annotations

import logging

from backend.model.error_codes import ErrorCode
from backend.model.schemas import ApiEnvelope, HealthView
from backend.repository import repository
from backend.service.auth import is_demo_repository
from backend.service.db import ping as db_ping

from fastapi import APIRouter, HTTPException

logger = logging.getLogger("lumen")

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/live", response_model=ApiEnvelope[HealthView])
def live() -> dict[str, object]:
    """进程存活探针：恒 200。"""
    return {"code": 0, "msg": "ok", "data": {"status": "ok"}}


@router.get("/ready", response_model=ApiEnvelope[HealthView])
def ready() -> dict[str, object]:
    """就绪探针：demo 模式恒 200；PG 模式 db.ping() 失败 → 503 + 5031。"""
    if is_demo_repository(repository):
        return {"code": 0, "msg": "ok", "data": {"status": "ready", "db": None}}
    try:
        version = db_ping()
    except Exception as exc:
        logger.warning("health readiness db.ping failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail={"code": int(ErrorCode.DB_NOT_READY), "msg": "database not ready"},
        ) from exc
    return {"code": 0, "msg": "ok", "data": {"status": "ready", "db": version}}
