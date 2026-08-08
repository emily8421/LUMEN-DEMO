"""FastAPI router for account & authentication（Sprint-26 / Phase2D，task-038）。

账户注册（REQ-040）/ 凭证登录（REQ-041）/ 登出与会话管理（REQ-042）。
demo 模式保留无密码快捷登录（seed 用户），PG 模式强制真实凭证；见 accounts-auth §7。
"""

from __future__ import annotations

from backend.repository import repository
from backend.service.auth import (
    TOKEN_SIGNING_KEY,
    AuthenticationError,
    authenticate,
    list_active_sessions,
    refresh_session,
    register,
    revoke_session,
    update_session_space,
)
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.auth_reset import confirm_password_reset, request_password_reset
from backend.service.space import SpaceAccessError, ensure_space_access

try:
    from fastapi import APIRouter, Depends, Header, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception
    Depends = None


def _status_for(exc: AuthenticationError) -> int:
    return {4001: 401, 4010: 401, 4030: 403, 4004: 404, 4090: 409, 4220: 422}.get(exc.code, 400)


def _http_error(exc: AuthenticationError) -> HTTPException:
    return HTTPException(status_code=_status_for(exc), detail={"code": exc.code, "msg": exc.msg})


if APIRouter is not None:
    router = APIRouter(prefix="/api/auth", tags=["auth"])

    class RegisterRequest(BaseModel):
        email: str
        name: str
        password: str

    class LoginRequest(BaseModel):
        login_id: str = ""
        password: str = ""
        # demo 快捷登录兼容：login_id 为空时允许 external_id 别名
        external_id: str | None = None
        current_space_id: int | None = None

    @router.post("/register")
    def register_endpoint(request: RegisterRequest) -> dict[str, object]:
        try:
            user = register(repository, request.email, request.name, request.password)
        except AuthenticationError as exc:
            raise _http_error(exc) from exc
        return {
            "code": 0,
            "msg": "ok",
            "data": {"user_id": user.id, "name": user.name, "email": user.email},
        }

    @router.post("/login")
    def login(request: LoginRequest) -> dict[str, object]:
        login_id = request.login_id or request.external_id or ""
        try:
            token, session = authenticate(repository, login_id, request.password)
        except AuthenticationError as exc:
            raise _http_error(exc) from exc

        current_space_id = session.current_space_id
        if request.current_space_id is not None:
            try:
                ensure_space_access(session.user_id, request.current_space_id, repository.list_memberships())
                current_space_id = request.current_space_id
                if session.id is not None:
                    update_session_space(repository, session.id, current_space_id)
            except SpaceAccessError:
                pass  # 无权限空间静默回退当前会话空间

        # Sprint-28（REQ-045）：登录响应附带全局角色，支撑前端管理入口显隐（additive，非破坏性）
        current_user = repository.find_user_by_id(session.user_id)
        role = current_user.role if current_user is not None else "member"
        name = current_user.name if current_user is not None else ""
        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "token": token,
                "user_id": session.user_id,
                "name": name,
                "current_space_id": current_space_id,
                "role": role,
            },
        }

    @router.post("/logout")
    def logout(ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        if ctx.session_id is not None:
            revoke_session(repository, ctx.session_id, ctx.user_id)
        from backend.service.auth import audit_logout

        audit_logout(ctx.user_id)
        return {"code": 0, "msg": "ok", "data": None}

    @router.post("/refresh")
    def refresh(authorization: str = Header(default="")) -> dict[str, object]:
        token = _extract_token(authorization)
        try:
            new_token, new_session = refresh_session(repository, token)
        except AuthenticationError as exc:
            raise _http_error(exc) from exc
        current_user = repository.find_user_by_id(new_session.user_id)
        name = current_user.name if current_user is not None else ""
        return {
            "code": 0,
            "msg": "ok",
            "data": {
                "token": new_token,
                "user_id": new_session.user_id,
                "name": name,
                "current_space_id": new_session.current_space_id,
            },
        }

    @router.get("/sessions")
    def sessions(ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        rows = list_active_sessions(repository, ctx.user_id)
        return {
            "code": 0,
            "msg": "ok",
            "data": [
                {
                    "id": row.id,
                    "created_at": row.created_at,
                    "expires_at": row.expires_at,
                    "last_used_at": row.last_used_at,
                    "client_ua": row.client_ua,
                    "client_ip": row.client_ip,
                    "current": row.id == ctx.session_id,
                }
                for row in rows
            ],
        }

    @router.delete("/sessions/{session_id}")
    def revoke_session_endpoint(session_id: int, ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        if not revoke_session(repository, session_id, ctx.user_id):
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "session not found"})
        return {"code": 0, "msg": "ok", "data": None}

    # Sprint-30 / 维护态批5（REQ-051）：忘记密码 reset token，demo 降级 token 写日志，见 accounts-auth §19
    class PasswordResetRequest(BaseModel):
        email: str

    class PasswordResetConfirm(BaseModel):
        token: str
        new_password: str

    @router.post("/password-reset/request")
    def password_reset_request(request: PasswordResetRequest) -> dict[str, object]:
        # REQ-051：恒响应防枚举（service 层保证账号不存在时也走 dummy bcrypt + 同文案）
        msg = request_password_reset(repository, request.email)
        return {"code": 0, "msg": "ok", "data": {"message": msg}}

    @router.post("/password-reset/confirm")
    def password_reset_confirm(request: PasswordResetConfirm) -> dict[str, object]:
        try:
            confirm_password_reset(repository, request.token, request.new_password)
        except AuthenticationError as exc:
            raise _http_error(exc) from exc
        return {"code": 0, "msg": "ok", "data": None}
else:
    router = None


def _extract_token(authorization: str) -> str:
    from backend.service.auth import TokenError, extract_bearer_token

    try:
        return extract_bearer_token(authorization)
    except TokenError as exc:
        raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc
