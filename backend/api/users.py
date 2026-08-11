"""FastAPI router for shared user search（REQ-047，API-050，task-040）。"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.space_members import search_users

try:
    from fastapi import APIRouter, Depends
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    Depends = None


if APIRouter is not None:
    router = APIRouter(prefix="/api/users", tags=["users"])

    @router.get("/search")
    def search_users_endpoint(
        q: str = "",
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        # 成员管理域错误（SpaceMemberError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
        rows = search_users(repository, ctx.user, q)
        return {
            "code": 0,
            "msg": "ok",
            "data": [
                {"id": row.id, "name": row.name, "email": row.email}
                for row in rows
            ],
        }
else:
    router = None
