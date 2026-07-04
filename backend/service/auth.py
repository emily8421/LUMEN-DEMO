"""Demo bearer token helpers for Phase1 auth."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any


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
