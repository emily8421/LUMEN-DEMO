"""Sprint-28 space 域成员管理（REQ-047，task-040）：按 email 添加 / 改空间角色 / 移除 + 用户搜索。

鉴权谓词统一 `is_global_admin OR is_space_admin`（C-ROLE-007）；最后一个空间 admin 4090（C-ROLE-006）；
操作写审计事件 member_added / member_role_changed / member_removed。demo 仓储不旁路以上校验。
"""

from __future__ import annotations

from backend.model.entities import SpaceRole, User
from backend.service.auth import audit_event
from backend.service.permission import can_access_space


class SpaceMemberError(ValueError):
    """space 域成员管理统一异常；API 层按 code 映射 HTTP 状态码（4003 / 4030 / 4004 / 4090 / 4220）。"""

    def __init__(self, code: int, msg: str):
        super().__init__(msg)
        self.code = code
        self.msg = msg


VALID_SPACE_ROLES = ("admin", "member")


def _require_space(repository, space_id: int) -> None:
    if repository.find_space(space_id) is None:
        raise SpaceMemberError(4004, "space not found")


def require_space_admin_or_global(user: User, space_id: int, memberships) -> None:
    """C-ROLE-007 统一谓词：全局 admin 或目标空间 admin 可管理成员。"""
    if user.role == "admin":
        return
    is_space_admin = any(
        membership.user_id == user.id
        and membership.space_id == space_id
        and membership.role == SpaceRole.ADMIN
        for membership in memberships
    )
    if not is_space_admin:
        raise SpaceMemberError(4030, "space admin access required")


def require_space_member(user_id: int, space_id: int, memberships) -> None:
    if not can_access_space(user_id, space_id, memberships):
        raise SpaceMemberError(4003, "space access denied")


def list_space_members(repository, actor: User, space_id: int):
    """空间成员列表（API-046）：空间成员可读；非成员 4003；空间不存在 4004。"""
    _require_space(repository, space_id)
    require_space_member(actor.id, space_id, repository.list_memberships())
    return repository.list_space_members(space_id)


def add_member_by_email(repository, actor: User, space_id: int, email: str, role: str = "member"):
    """按 email 添加成员（API-047）：用户不存在 4004 / 已是成员 4090 / 角色非法 4220。"""
    _require_space(repository, space_id)
    memberships = repository.list_memberships()
    require_space_admin_or_global(actor, space_id, memberships)
    if role not in VALID_SPACE_ROLES:
        raise SpaceMemberError(4220, "invalid role")
    normalized = (email or "").strip().lower()
    target = repository.find_user_by_email(normalized)
    if target is None:
        raise SpaceMemberError(4004, "user not found")
    if any(
        membership.user_id == target.id and membership.space_id == space_id
        for membership in memberships
    ):
        raise SpaceMemberError(4090, "user is already a member")
    detail = repository.add_space_member(space_id, target.id, role)
    if detail is None:
        raise SpaceMemberError(4090, "user is already a member")
    audit_event(
        "member_added",
        actor.id,
        "success",
        space_id=space_id,
        target_user_id=target.id,
        role=role,
    )
    return detail


def update_member_role(repository, actor: User, space_id: int, user_id: int, role: str):
    """改空间角色（API-048）：最后一个空间 admin 降级 4090（C-ROLE-006）。"""
    _require_space(repository, space_id)
    memberships = repository.list_memberships()
    require_space_admin_or_global(actor, space_id, memberships)
    if role not in VALID_SPACE_ROLES:
        raise SpaceMemberError(4220, "invalid role")
    current = next(
        (
            membership
            for membership in memberships
            if membership.user_id == user_id and membership.space_id == space_id
        ),
        None,
    )
    if current is None:
        raise SpaceMemberError(4004, "member not found")
    if current.role == SpaceRole.ADMIN and role == "member" and repository.count_space_admins(space_id) <= 1:
        raise SpaceMemberError(4090, "cannot demote the last space admin")
    detail = repository.update_space_member_role(space_id, user_id, role)
    if detail is None:
        raise SpaceMemberError(4004, "member not found")
    audit_event(
        "member_role_changed",
        actor.id,
        "success",
        space_id=space_id,
        target_user_id=user_id,
        role=role,
    )
    return detail


def remove_member(repository, actor: User, space_id: int, user_id: int) -> bool:
    """移除成员（API-049）：文档归属不变；最后一个空间 admin 4090（C-ROLE-006）。"""
    _require_space(repository, space_id)
    memberships = repository.list_memberships()
    require_space_admin_or_global(actor, space_id, memberships)
    current = next(
        (
            membership
            for membership in memberships
            if membership.user_id == user_id and membership.space_id == space_id
        ),
        None,
    )
    if current is None:
        raise SpaceMemberError(4004, "member not found")
    if current.role == SpaceRole.ADMIN and repository.count_space_admins(space_id) <= 1:
        raise SpaceMemberError(4090, "cannot remove the last space admin")
    if not repository.remove_space_member(space_id, user_id):
        raise SpaceMemberError(4004, "member not found")
    audit_event(
        "member_removed",
        actor.id,
        "success",
        space_id=space_id,
        target_user_id=user_id,
    )
    return True


def search_users(repository, actor: User, q: str) -> list[User]:
    """成员添加时用户搜索（API-050）：全局 admin 或任一空间 admin 可用；防普通用户枚举。"""
    memberships = repository.list_memberships()
    if actor.role != "admin":
        is_space_admin = any(
            membership.user_id == actor.id and membership.role == SpaceRole.ADMIN
            for membership in memberships
        )
        if not is_space_admin:
            raise SpaceMemberError(4030, "admin access required")
    return repository.search_users(q or "")
