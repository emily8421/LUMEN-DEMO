"""鉴权依赖项（Sprint-26 / Phase2D 账号体系，task-038）。

把 13 个 router 各自的 _read_token_payload 收敛为 FastAPI Depends(get_current_user)。
PG 模式走 lumen_sessions，demo 模式兼容 HMAC demo token；见 accounts-auth §7。
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import User
from backend.repository import repository
from backend.service.auth import (
    TOKEN_SIGNING_KEY,
    TokenError,
    extract_bearer_token,
    is_demo_repository,
    parse_demo_token,
    resolve_session,
)

try:
    from fastapi import Depends, Header, HTTPException
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    Depends = None
    Header = None
    HTTPException = Exception


@dataclass(frozen=True)
class TokenContext:
    user_id: int
    current_space_id: int
    session_id: int | None
    user: User


def _unauthorized(msg: str = "invalid token") -> HTTPException:
    return HTTPException(status_code=401, detail={"code": 4001, "msg": msg})


def get_current_user(authorization: str = Header(default="")) -> TokenContext:
    """解析 Authorization Bearer token → 活跃 session；demo 模式兼容 HMAC demo token → TokenContext。"""
    if Header is None:
        raise RuntimeError("FastAPI is not installed")
    try:
        token = extract_bearer_token(authorization)
    except TokenError as exc:
        raise _unauthorized() from exc

    session = resolve_session(repository, token)
    if session is not None:
        user = repository.find_user_by_id(session.user_id)
        if user is None:
            raise _unauthorized()
        # fail-closed：session.current_space_id 为 None（DB ON DELETE SET NULL 空间被删 / 用户被全清空间）
        # 非合法工作态——要求重新登录选空间（前端 isAuthTokenError code===4001 → 清 session 重登）
        if session.current_space_id is None:
            raise _unauthorized("session 空间已失效，请重新登录")
        return TokenContext(
            user_id=user.id,
            current_space_id=session.current_space_id,
            session_id=session.id,
            user=user,
        )

    # demo 内存模式兼容旧 HMAC demo token（保持 run-sprint16-demo 快捷登录）
    if is_demo_repository(repository):
        try:
            payload = parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise _unauthorized() from exc
        user = repository.find_user_by_id(payload.user_id)
        if user is None:
            raise _unauthorized()
        return TokenContext(
            user_id=user.id,
            current_space_id=payload.current_space_id,
            session_id=None,
            user=user,
        )

    raise _unauthorized()


def get_current_user_optional(authorization: str = Header(default="")) -> TokenContext | None:
    """可选的当前用户：无 token / token 无效时返回 None。"""
    try:
        return get_current_user(authorization)
    except HTTPException:
        return None


def require_space_member(space_id: int):
    """空间成员校验依赖；无权限时返回 403。"""

    def dependency(ctx: TokenContext = Depends(get_current_user)) -> TokenContext:
        from backend.service.space import ensure_space_access

        # 空间访问被拒（SpaceAccessError，ApiError 4003）冒泡 main.py handler → 403/4003 envelope
        ensure_space_access(ctx.user_id, space_id, repository.list_memberships())
        return ctx

    return dependency
