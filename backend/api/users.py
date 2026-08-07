"""FastAPI router for shared user search（REQ-047，API-050，task-040）。"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.space_members import SpaceMemberError, search_users

try:
    from fastapi import APIRouter, Depends, HTTPException
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    HTTPException = Exception


def _http_error(exc: SpaceMemberError) -> HTTPException:
    status = {4004: 404, 4003: 403, 4030: 403, 4090: 409, 4220: 422}.get(exc.code, 400)
    return HTTPException(status_code=status, detail={"code": exc.code, "msg": exc.msg})


if APIRouter is not None:
    router = APIRouter(prefix="/api/users", tags=["users"])

    @router.get("/search")
    def search_users_endpoint(
        q: str = "",
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            rows = search_users(repository, ctx.user, q)
        except SpaceMemberError as exc:
            raise _http_error(exc) from exc
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
