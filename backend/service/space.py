"""Space membership and switching helpers."""

from __future__ import annotations

from collections.abc import Iterable

from backend.model.entities import Space, SpaceMember
from backend.service.permission import can_access_space


class SpaceAccessError(ValueError):
    """Raised when a user attempts to enter a space they do not belong to."""


def list_user_spaces(user_id: int, spaces: Iterable[Space], memberships: Iterable[SpaceMember]) -> list[Space]:
    allowed_space_ids = {
        membership.space_id for membership in memberships if membership.user_id == user_id
    }
    return [space for space in spaces if space.id in allowed_space_ids]


def ensure_space_access(user_id: int, space_id: int, memberships: Iterable[SpaceMember]) -> None:
    if not can_access_space(user_id, space_id, memberships):
        raise SpaceAccessError("user is not a member of the requested space")


def switch_space(user_id: int, target_space_id: int, memberships: Iterable[SpaceMember]) -> int:
    membership_list = list(memberships)
    ensure_space_access(user_id, target_space_id, membership_list)
    return target_space_id
