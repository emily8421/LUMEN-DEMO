"""Space membership and switching helpers."""

from __future__ import annotations

from collections.abc import Iterable

from backend.model.entities import Space, SpaceMember
from backend.model.error_codes import ApiError, ErrorCode
from backend.service.permission import can_access_space


class SpaceAccessError(ApiError):
    """空间访问被拒（API 映射 4003，07 契约 API-011/029）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


def list_user_spaces(user_id: int, spaces: Iterable[Space], memberships: Iterable[SpaceMember]) -> list[Space]:
    allowed_space_ids = {
        membership.space_id for membership in memberships if membership.user_id == user_id
    }
    return [space for space in spaces if space.id in allowed_space_ids]


def ensure_space_access(user_id: int, space_id: int, memberships: Iterable[SpaceMember]) -> None:
    if not can_access_space(user_id, space_id, memberships):
        raise SpaceAccessError("space access denied")


def switch_space(user_id: int, target_space_id: int, memberships: Iterable[SpaceMember]) -> int:
    membership_list = list(memberships)
    ensure_space_access(user_id, target_space_id, membership_list)
    return target_space_id
