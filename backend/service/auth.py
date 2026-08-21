"""Demo bearer token helpers for Phase1 auth."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt

from backend.config import get_settings
from backend.model.entities import Session, User
from backend.model.error_codes import ApiError
from backend.repository.protocol import UserRepository


class TokenError(ValueError):
    """Raised when a demo bearer token is malformed, expired, or tampered with."""


@dataclass(frozen=True)
class TokenPayload:
    user_id: int
    current_space_id: int
    exp: int


def create_demo_token(user_id: int, current_space_id: int, signing_key: str, ttl_seconds: int = 8 * 60 * 60) -> str:
    payload = {
        "user_id": user_id,
        "current_space_id": current_space_id,
        "exp": int(time.time()) + ttl_seconds,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_part = base64.urlsafe_b64encode(payload_bytes).decode("ascii").rstrip("=")
    signature = _sign(payload_part, signing_key)
    return f"{payload_part}.{signature}"


def parse_demo_token(token: str, signing_key: str, now: int | None = None) -> TokenPayload:
    try:
        payload_part, signature = token.split(".", 1)
    except ValueError as exc:
        raise TokenError("invalid token format") from exc

    expected_signature = _sign(payload_part, signing_key)
    if not hmac.compare_digest(signature, expected_signature):
        raise TokenError("invalid token signature")

    payload = _decode_payload(payload_part)
    exp = _require_int(payload, "exp")
    current_time = int(time.time()) if now is None else now
    if exp < current_time:
        raise TokenError("token expired")

    return TokenPayload(
        user_id=_require_int(payload, "user_id"),
        current_space_id=_require_int(payload, "current_space_id"),
        exp=exp,
    )


def extract_bearer_token(authorization_header: str) -> str:
    scheme, _, token = authorization_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise TokenError("missing bearer token")
    return token


def _sign(payload_part: str, signing_key: str) -> str:
    digest = hmac.new(signing_key.encode("utf-8"), payload_part.encode("ascii"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def _decode_payload(payload_part: str) -> dict[str, Any]:
    padding = "=" * (-len(payload_part) % 4)
    try:
        payload_bytes = base64.urlsafe_b64decode(payload_part + padding)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except (ValueError, json.JSONDecodeError) as exc:
        raise TokenError("invalid token payload") from exc
    if not isinstance(payload, dict):
        raise TokenError("invalid token payload")
    return payload


def _require_int(payload: dict[str, Any], key: str) -> int:
    value = payload.get(key)
    if not isinstance(value, int):
        raise TokenError(f"missing integer token field: {key}")
    return value


# --- Sprint-26 / Phase2D 账号体系（REQ-040/041/042，task-038 / accounts-auth.md）---
# bcrypt 依赖（RG-011 Go 2026-08-07，Python 3.14.3 实测，cost 12 ≈0.21s，恒定时序）
TOKEN_SIGNING_KEY = get_settings().demo_token_key

BCRYPT_ROUNDS = 12
SESSION_TTL_SECONDS = 8 * 60 * 60
MAX_FAILED_LOGINS = 5
LOCK_DURATION_SECONDS = 15 * 60
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 64

_dummy_hash_cache: str | None = None


def _get_dummy_hash() -> str:
    """账号不存在时对 dummy 哈希执行 bcrypt verify，保持恒定时序、防账号枚举。"""
    global _dummy_hash_cache
    if _dummy_hash_cache is None:
        _dummy_hash_cache = bcrypt.hashpw(
            b"lumen-dummy-password-for-constant-time",
            bcrypt.gensalt(rounds=BCRYPT_ROUNDS),
        ).decode("ascii")
    return _dummy_hash_cache


def hash_password(password: str) -> str:
    """bcrypt cost 12；bcrypt 5.x 对 >72 字节输入抛 ValueError，先截断到 72 字节。"""
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError("password too long")
    pwd = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd, bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    pwd = password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(pwd, password_hash.encode("ascii"))
    except ValueError:
        return False


def sha256_hex(value: str) -> str:
    """计算 token 的 SHA-256 摘要；lumen_sessions.token_hash 只存摘要不存明文。"""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


_logger = logging.getLogger("lumen.auth")


def _audit(event: str, user_id: int | None, outcome: str, **extra) -> None:
    """结构化审计日志（C-AUTH-004 最小集：register / login_success / login_failed / login_locked / logout）。"""
    _logger.info(
        json.dumps(
            {"event": event, "user_id": user_id, "outcome": outcome, "ts": _iso(_now_utc()), **extra},
            ensure_ascii=False,
        )
    )


class AuthenticationError(ApiError):
    """鉴权失败统一异常（4010 / 4030 / 4090 / 4220 等）；HTTP 码由 CODE_TO_HTTP 推导。"""

    def __init__(self, code: int, message: str, status_code: int | None = None) -> None:
        super().__init__(code, message, status_code)


def is_demo_repository(repo) -> bool:
    return bool(getattr(repo, "is_demo", False))


def audit_logout(user_id: int) -> None:
    _audit("logout", user_id, "success")


def audit_event(event: str, user_id: int | None, outcome: str, **extra) -> None:
    """结构化审计日志公共入口（C-AUTH-004 最小集 + Sprint-28 C-ROLE-007 成员管理事件）。"""
    _audit(event, user_id, outcome, **extra)


def authenticate(
    repository: UserRepository,
    login_id: str,
    password: str,
    client_ua: str | None = None,
    client_ip: str | None = None,
) -> tuple[str, Session]:
    """凭证登录（REQ-041）：校验通过返回 (token, Session)，失败抛 AuthenticationError。

    - 登录标识：email 优先 + external_id 兼容别名（C-AUTH-002 / §10 安全）
    - demo 内存模式：is_demo=True，seed 用户 password_hash=None 时可无密码快捷登录
    - 非 demo（PG）：password_hash=None 也执行 dummy verify 后拒绝；锁定阈值 C-AUTH-003（5 次 / 15min）
    """
    normalized = (login_id or "").strip().lower()
    # email 主登录标识；external_id 兼容别名（seed 用户 / demo 快捷登录）
    user = repository.find_user_by_email(normalized) or repository.find_user_by_external_id(normalized)
    if user is None:
        verify_password(password, _get_dummy_hash())
        _audit("login_failed", None, "fail", reason="no_user", login_id=normalized)
        raise AuthenticationError(4010, "invalid login credentials")
    if user.status == "disabled":
        _audit("login_failed", user.id, "fail", reason="disabled")
        raise AuthenticationError(4030, "account disabled")
    locked_until = _parse_dt(user.locked_until)
    if locked_until is not None and locked_until > _now_utc():
        _audit("login_locked", user.id, "blocked")
        raise AuthenticationError(4030, "account locked, try again later")

    if user.password_hash is None:
        if not is_demo_repository(repository):
            verify_password(password, _get_dummy_hash())
            _audit("login_failed", user.id, "fail", reason="no_password_set")
            raise AuthenticationError(4010, "invalid login credentials")
    elif not verify_password(password, user.password_hash):
        count = repository.record_login_failure(user.id)
        if count >= MAX_FAILED_LOGINS:
            repository.set_locked_until(
                user.id,
                _iso(_now_utc() + timedelta(seconds=LOCK_DURATION_SECONDS)),
            )
            _audit("login_locked", user.id, "locked", failed_count=count)
        _audit("login_failed", user.id, "fail", reason="bad_password", failed_count=count)
        raise AuthenticationError(4010, "invalid login credentials")

    repository.reset_login_failures(user.id)
    _audit("login_success", user.id, "success")
    space_id = repository.first_space_id_for_user(user.id)
    token = create_session_token()
    session = repository.create_session(
        user_id=user.id,
        current_space_id=space_id,
        token_hash=sha256_hex(token),
        expires_at=_iso(_now_utc() + timedelta(seconds=SESSION_TTL_SECONDS)),
        client_ua=client_ua,
        client_ip=client_ip,
    )
    return token, session


def register(repository: UserRepository, email: str, name: str, password: str) -> User:
    """注册（REQ-040）：建用户 + 默认个人空间（C-AUTH-001，归属 role=admin）。"""
    normalized = (email or "").strip().lower()
    if not normalized or "@" not in normalized or "." not in normalized.split("@")[-1]:
        raise AuthenticationError(4220, "invalid email")
    if not name or not name.strip():
        raise AuthenticationError(4220, "display name is required")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise AuthenticationError(4220, "password must be at least 8 characters")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise AuthenticationError(4220, "password too long")
    if repository.find_user_by_email(normalized) is not None:
        raise AuthenticationError(4090, "email already registered")
    password_hash = hash_password(password)
    user = repository.create_user_with_personal_space(
        email=normalized,
        external_id=_derive_external_id(repository, normalized),
        name=name.strip(),
        password_hash=password_hash,
    )
    _audit("register", user.id, "success", email=normalized)
    return user


def _derive_external_id(repository: UserRepository, email: str) -> str:
    base = email.split("@", 1)[0] or "user"
    candidate = base
    suffix = 1
    while repository.find_user_by_external_id(candidate) is not None:
        suffix += 1
        candidate = f"{base}{suffix}"
    return candidate


def resolve_session(repository: UserRepository, token: str) -> Session | None:
    """按 token 解析活跃 session；不存在 / 已撤销 / 过期返回 None。"""
    session = repository.find_session_by_token_hash(sha256_hex(token))
    if session is None or session.revoked_at is not None:
        return None
    expires = _parse_dt(session.expires_at)
    if expires is None or expires <= _now_utc():
        return None
    return session


def refresh_session(repository: UserRepository, token: str) -> tuple[str, Session]:
    """滑动续期（accounts-auth §3.4）：撤销旧 session，签发新 token + 新 session。"""
    session = resolve_session(repository, token)
    if session is None:
        raise AuthenticationError(4010, "session invalid or expired")
    repository.revoke_session(session.id, session.user_id)
    new_token = create_session_token()
    new_session = repository.create_session(
        user_id=session.user_id,
        current_space_id=session.current_space_id,
        token_hash=sha256_hex(new_token),
        expires_at=_iso(_now_utc() + timedelta(seconds=SESSION_TTL_SECONDS)),
        client_ua=session.client_ua,
        client_ip=session.client_ip,
    )
    return new_token, new_session


def list_active_sessions(repository: UserRepository, user_id: int) -> list[Session]:
    return repository.list_sessions(user_id)


def revoke_session(repository: UserRepository, session_id: int, user_id: int) -> bool:
    return repository.revoke_session(session_id, user_id)


def update_session_space(repository: UserRepository, session_id: int, space_id: int) -> Session:
    return repository.update_session_space(session_id, space_id)
