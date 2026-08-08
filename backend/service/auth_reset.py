"""忘记密码 reset token 服务（Sprint-30 / 维护态批5，REQ-051）。

从 ``backend/service/auth.py`` 拆出（auth.py 已超 service 250 阈值），复用 auth 的
bcrypt / sha256 / session / 审计 helper。契约：docs/design/accounts-auth.md §19。

demo 降级：无 SMTP，reset token 明文写后端 WARNING 日志（结构化 JSON），运维从日志取
token 人工下发；生产须接 SMTP 发邮件（见 §19 降级口径）。

安全口径（对齐 accounts-auth.md §10）：
- /request 恒响应「若该邮箱已注册，重置链接已发送」，账号不存在时对 dummy hash 做 bcrypt
  verify 保恒时时序，不泄露账号是否存在；
- DB 只存 sha256_hex(token)，明文仅进日志；
- token 一次性（reset_used_at），TTL 30min；
- 重置成功吊销该用户全部活跃 session（跨设备安全）。
"""

from __future__ import annotations

import json
import logging
from datetime import timedelta

from backend.service.auth import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    _audit,
    _get_dummy_hash,
    _iso,
    _now_utc,
    _parse_dt,
    AuthenticationError,
    create_session_token,
    hash_password,
    sha256_hex,
    verify_password,
)

RESET_TOKEN_TTL_SECONDS = 30 * 60

_reset_logger = logging.getLogger("lumen.auth.reset")

# /request 恒响应文案（防枚举：账号是否存在都不泄露）
RESET_REQUEST_RESPONSE = "若该邮箱已注册，重置链接已发送（demo 模式请从后端日志取 token）。"


def request_password_reset(repository, email: str) -> str:
    """REQ-051 reset 申请（API-055）：恒响应，不泄露账号是否存在。

    - 找到用户 → 签发 reset token（sha256_hex 入库，明文写 WARNING 日志）；
    - 用户不存在 → verify_password(dummy_hash) 保恒时序；
    - 始终返回同一文案。
    """
    normalized = (email or "").strip().lower()
    user = repository.find_user_by_email(normalized) if normalized else None
    if user is None:
        # 防枚举：对 dummy hash 做一次 bcrypt verify，耗时与真实路径接近
        verify_password(normalized or "no-user", _get_dummy_hash())
        _audit("password_reset_requested", None, "noop", reason="no_user")
        return RESET_REQUEST_RESPONSE

    token = create_session_token()
    token_hash = sha256_hex(token)
    expires_at = _iso(_now_utc() + timedelta(seconds=RESET_TOKEN_TTL_SECONDS))
    repository.set_reset_token(user.id, token_hash, expires_at)
    # demo 降级：明文 token 写 WARNING 日志（生产接 SMTP，此处改为发邮件并移除明文）
    _reset_logger.warning(
        json.dumps(
            {
                "event": "password_reset_token_issued",
                "user_id": user.id,
                "email": normalized,
                "token": token,  # demo-only：明文进日志供运维取用；生产移除，改 SMTP 投递
                "expires_at": expires_at,
                "ts": _iso(_now_utc()),
            },
            ensure_ascii=False,
        )
    )
    _audit("password_reset_requested", user.id, "issued", email=normalized)
    return RESET_REQUEST_RESPONSE


def confirm_password_reset(repository, token: str, new_password: str) -> None:
    """REQ-051 reset 确认（API-056）：成功返回 None，失败抛 AuthenticationError。

    校验：新密码长度 8-64 → token 有效（未使用 / 未过期）→ 改密 + 置 used + 吊销全部 session。
    token 不存在 / 已用 / 过期统一抛 4010（不细分，防信息泄露）。
    """
    if len(new_password) < MIN_PASSWORD_LENGTH:
        raise AuthenticationError(4220, "password must be at least 8 characters")
    if len(new_password) > MAX_PASSWORD_LENGTH:
        raise AuthenticationError(4220, "password too long")

    token_hash = sha256_hex(token or "")
    user = repository.find_user_by_reset_token_hash(token_hash)
    if user is None:
        raise AuthenticationError(4010, "reset token invalid or expired")

    if user.reset_used_at:
        raise AuthenticationError(4010, "reset token invalid or expired")
    expires = _parse_dt(user.reset_expires_at)
    if expires is None or expires <= _now_utc():
        raise AuthenticationError(4010, "reset token invalid or expired")

    repository.update_password(user.id, hash_password(new_password))
    repository.clear_reset_token(user.id, _iso(_now_utc()))
    revoked = repository.revoke_all_sessions(user.id)
    _audit("password_reset_confirmed", user.id, "success", revoked_sessions=revoked)
