"""FastAPI router for Phase1 demo authentication."""

from __future__ import annotations

import os

from backend.service.auth import create_demo_token
from backend.service.demo_repository import repository
from backend.service.space import SpaceAccessError, ensure_space_access

TOKEN_SIGNING_KEY = os.environ.get("LUMEN_DEMO_TOKEN_KEY", "local-demo-signing-key")

try:
    from fastapi import APIRouter, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/auth", tags=["auth"])

    class LoginRequest(BaseModel):
        external_id: str
        current_space_id: int | None = None

    @router.post("/login")
    def login(request: LoginRequest) -> dict[str, object]:
        user = repository.find_user_by_external_id(request.external_id)
        if user is None:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid demo account"})

        current_space_id = request.current_space_id or repository.first_space_id_for_user(user.id)
        if current_space_id is None:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "no available space"})

        try:
            ensure_space_access(user.id, current_space_id, repository.list_memberships())
        except SpaceAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "space access denied"}) from exc

        token = create_demo_token(
            user_id=user.id,
            current_space_id=current_space_id,
            signing_key=TOKEN_SIGNING_KEY,
        )
        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "token": token,
                "user_id": user.id,
                "current_space_id": current_space_id,
            },
        }
else:
    router = None
