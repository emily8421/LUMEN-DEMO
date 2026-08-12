"""FastAPI router for Phase1 space operations."""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.space import list_user_spaces, switch_space

from fastapi import APIRouter, Depends
from pydantic import BaseModel


router = APIRouter(prefix="/api/spaces", tags=["spaces"])

class SwitchSpaceRequest(BaseModel):
    space_id: int

@router.get("")
def list_spaces(ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
    spaces = list_user_spaces(
        user_id=ctx.user_id,
        spaces=repository.list_spaces(),
        memberships=repository.list_memberships(),
    )
    return {
        "code": 0,
        "msg": "ok",
        "data": [
            {"id": space.id, "code": space.code, "name": space.name}
            for space in spaces
        ],
    }

@router.post("/switch")
def switch_space_endpoint(
    request: SwitchSpaceRequest,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    # 空间访问被拒（SpaceAccessError）冒泡 main.py ApiError handler → 403/4003 envelope
    current_space_id = switch_space(
        user_id=ctx.user_id,
        target_space_id=request.space_id,
        memberships=repository.list_memberships(),
    )

    # 收敛后 token 由 session 承载（不透明 token，不携带 claims）：切换空间只更新 session.current_space_id
    if ctx.session_id is not None:
        from backend.service.auth import update_session_space

        update_session_space(repository, ctx.session_id, current_space_id)
    return {
        "code": 0,
        "msg": "ok",
        "data": {"current_space_id": current_space_id},
    }
