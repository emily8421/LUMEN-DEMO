"""FastAPI router for Sprint-28 admin 域用户管理（REQ-045/046，API-044/045，task-040）。"""

from __future__ import annotations

from backend.repository import repository
from backend.service.admin import AdminError, list_users as admin_list_users, set_user_status, update_user_role
from backend.service.auth_context import TokenContext, get_current_user

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


def _http_error(exc: AdminError) -> HTTPException:
    status = {4004: 404, 4030: 403, 4090: 409, 4220: 422}.get(exc.code, 400)
    return HTTPException(status_code=status, detail={"code": exc.code, "msg": exc.msg})


def _user_payload(row) -> dict[str, object]:
    return {
        "id": row.id,
        "name": row.name,
        "email": row.email,
        "role": row.role,
        "status": row.status,
        "last_login_at": row.last_login_at,
    }


if APIRouter is not None:
    router = APIRouter(prefix="/api/admin/users", tags=["admin"])

    class UpdateUserRequest(BaseModel):
        role: str | None = None
        status: str | None = None

    @router.get("")
    def list_users_endpoint(
        q: str = "",
        role: str = "",
        status: str = "",
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            rows = admin_list_users(repository, ctx.user, q=q, role=role, status=status)
        except AdminError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": [_user_payload(row) for row in rows]}

    @router.patch("/{user_id}")
    def update_user_endpoint(
        user_id: int,
        request: UpdateUserRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            row = None
            if request.role is not None:
                row = update_user_role(repository, ctx.user, user_id, request.role)
            if request.status is not None:
                row = set_user_status(repository, ctx.user, user_id, request.status)
            if row is None:
                raise AdminError(4220, "role or status required")
        except AdminError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": _user_payload(row)}
else:
    router = None
