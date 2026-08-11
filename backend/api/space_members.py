"""FastAPI router for Sprint-28 space 域成员管理（REQ-047，API-046..049，task-040）。"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.space_members import (
    add_member_by_email,
    list_space_members,
    remove_member,
    update_member_role,
)

try:
    from fastapi import APIRouter, Depends
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    Depends = None


def _member_payload(detail) -> dict[str, object]:
    return {
        "user_id": detail.user_id,
        "name": detail.name,
        "email": detail.email,
        "role": detail.role.value,
        "joined_at": detail.joined_at,
    }


if APIRouter is not None:
    router = APIRouter(prefix="/api/spaces", tags=["space-members"])

    class AddMemberRequest(BaseModel):
        email: str
        role: str = "member"

    class UpdateMemberRoleRequest(BaseModel):
        role: str

    @router.get("/{space_id}/members")
    def list_members_endpoint(
        space_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        # 成员管理域错误（SpaceMemberError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
        rows = list_space_members(repository, ctx.user, space_id)
        return {"code": 0, "msg": "ok", "data": [_member_payload(row) for row in rows]}

    @router.post("/{space_id}/members")
    def add_member_endpoint(
        space_id: int,
        request: AddMemberRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        # 成员管理域错误（SpaceMemberError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
        detail = add_member_by_email(repository, ctx.user, space_id, request.email, request.role)
        return {"code": 0, "msg": "ok", "data": _member_payload(detail)}

    @router.patch("/{space_id}/members/{user_id}")
    def update_member_role_endpoint(
        space_id: int,
        user_id: int,
        request: UpdateMemberRoleRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        # 成员管理域错误（SpaceMemberError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
        detail = update_member_role(repository, ctx.user, space_id, user_id, request.role)
        return {"code": 0, "msg": "ok", "data": _member_payload(detail)}

    @router.delete("/{space_id}/members/{user_id}")
    def remove_member_endpoint(
        space_id: int,
        user_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        # 成员管理域错误（SpaceMemberError）冒泡 main.py ApiError handler → 对应 HTTP 码 envelope
        remove_member(repository, ctx.user, space_id, user_id)
        return {"code": 0, "msg": "ok", "data": None}
else:
    router = None
