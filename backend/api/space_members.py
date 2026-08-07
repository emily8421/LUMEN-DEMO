"""FastAPI router for Sprint-28 space 域成员管理（REQ-047，API-046..049，task-040）。"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.space_members import (
    SpaceMemberError,
    add_member_by_email,
    list_space_members,
    remove_member,
    update_member_role,
)

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


def _http_error(exc: SpaceMemberError) -> HTTPException:
    status = {4004: 404, 4003: 403, 4030: 403, 4090: 409, 4220: 422}.get(exc.code, 400)
    return HTTPException(status_code=status, detail={"code": exc.code, "msg": exc.msg})


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
        try:
            rows = list_space_members(repository, ctx.user, space_id)
        except SpaceMemberError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": [_member_payload(row) for row in rows]}

    @router.post("/{space_id}/members")
    def add_member_endpoint(
        space_id: int,
        request: AddMemberRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            detail = add_member_by_email(repository, ctx.user, space_id, request.email, request.role)
        except SpaceMemberError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": _member_payload(detail)}

    @router.patch("/{space_id}/members/{user_id}")
    def update_member_role_endpoint(
        space_id: int,
        user_id: int,
        request: UpdateMemberRoleRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            detail = update_member_role(repository, ctx.user, space_id, user_id, request.role)
        except SpaceMemberError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": _member_payload(detail)}

    @router.delete("/{space_id}/members/{user_id}")
    def remove_member_endpoint(
        space_id: int,
        user_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            remove_member(repository, ctx.user, space_id, user_id)
        except SpaceMemberError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": None}
else:
    router = None
