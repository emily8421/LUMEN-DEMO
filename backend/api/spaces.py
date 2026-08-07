"""FastAPI router for Phase1 space operations."""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.space import SpaceAccessError, list_user_spaces, switch_space

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


if APIRouter is not None:
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
        try:
            current_space_id = switch_space(
                user_id=ctx.user_id,
                target_space_id=request.space_id,
                memberships=repository.list_memberships(),
            )
        except SpaceAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "space access denied"}) from exc

        # 收敛后 token 由 session 承载（不透明 token，不携带 claims）：切换空间只更新 session.current_space_id
        if ctx.session_id is not None:
            from backend.service.auth import update_session_space

            update_session_space(repository, ctx.session_id, current_space_id)
        return {
            "code": 0,
            "msg": "ok",
            "data": {"current_space_id": current_space_id},
        }

else:
    router = None
