"""FastAPI router for Phase1 space operations."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.service.auth import TokenError, create_demo_token, extract_bearer_token, parse_demo_token
from backend.service.demo_repository import repository
from backend.service.space import SpaceAccessError, list_user_spaces, switch_space

try:
    from fastapi import APIRouter, Header, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    Header = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/spaces", tags=["spaces"])

    class SwitchSpaceRequest(BaseModel):
        space_id: int

    @router.get("")
    def list_spaces(authorization: str = Header(default="")) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        spaces = list_user_spaces(
            user_id=payload.user_id,
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
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            current_space_id = switch_space(
                user_id=payload.user_id,
                target_space_id=request.space_id,
                memberships=repository.list_memberships(),
            )
        except SpaceAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "space access denied"}) from exc

        token = create_demo_token(
            user_id=payload.user_id,
            current_space_id=current_space_id,
            signing_key=TOKEN_SIGNING_KEY,
        )
        return {
            "code": 0,
            "msg": "ok",
            "data": {"token": token, "current_space_id": current_space_id},
        }

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc
else:
    router = None
