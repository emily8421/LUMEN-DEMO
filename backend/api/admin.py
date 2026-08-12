"""FastAPI router for Sprint-28 admin 域用户管理（REQ-045/046，API-044/045，task-040）。"""

from __future__ import annotations

from backend.model.schemas import (
    AdminUserSpacesView,
    AdminUserView,
    ApiEnvelope,
)
from backend.repository import repository
from backend.service.admin import (
    AdminError,
    list_user_spaces_for_admin as admin_list_user_spaces,
    list_users as admin_list_users,
    set_user_status,
    update_user_role,
)
from backend.service.auth_context import TokenContext, get_current_user

from fastapi import APIRouter, Depends
from pydantic import BaseModel


def _user_payload(row) -> dict[str, object]:
    return {
        "id": row.id,
        "name": row.name,
        "email": row.email,
        "role": row.role,
        "status": row.status,
        "last_login_at": row.last_login_at,
    }


router = APIRouter(prefix="/api/admin/users", tags=["admin"])

class UpdateUserRequest(BaseModel):
    role: str | None = None
    status: str | None = None

@router.get("", response_model=ApiEnvelope[list[AdminUserView]])
def list_users_endpoint(
    q: str = "",
    role: str = "",
    status: str = "",
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    # 管理域错误（AdminError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
    rows = admin_list_users(repository, ctx.user, q=q, role=role, status=status)
    return {"code": 0, "msg": "ok", "data": [_user_payload(row) for row in rows]}

@router.patch("/{user_id}", response_model=ApiEnvelope[AdminUserView])
def update_user_endpoint(
    user_id: int,
    request: UpdateUserRequest,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    # 管理域错误（AdminError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
    row = None
    if request.role is not None:
        row = update_user_role(repository, ctx.user, user_id, request.role)
    if request.status is not None:
        row = set_user_status(repository, ctx.user, user_id, request.status)
    if row is None:
        raise AdminError(4220, "role or status required")
    return {"code": 0, "msg": "ok", "data": _user_payload(row)}

@router.get("/{user_id}/spaces", response_model=ApiEnvelope[AdminUserSpacesView])
def list_user_spaces_endpoint(
    user_id: int,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    """查询用户已加入空间 + 可授予空间（API-054，REQ-050，维护态批5）。仅全局 admin。"""
    # 管理域错误（AdminError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
    data = admin_list_user_spaces(repository, ctx.user, user_id)
    return {"code": 0, "msg": "ok", "data": data}
