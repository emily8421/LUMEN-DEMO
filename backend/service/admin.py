"""Sprint-28 admin 域（REQ-045/046，task-040）：用户列表 / 改全局角色 / 禁用启用。

鉴权谓词：仅全局 admin（member 4030）；禁用后登录 4030 + 既有会话失效由仓储层撤销；
接口不返回 password_hash（序列化在 api 层）。审计事件 user_role_changed / user_status_changed。
"""

from __future__ import annotations

from backend.model.entities import User
from backend.service.auth import audit_event


class AdminError(ValueError):
    """admin 域统一异常；API 层按 code 映射 HTTP 状态码（4030 / 4004 / 4090 / 4220）。"""

    def __init__(self, code: int, msg: str):
        super().__init__(msg)
        self.code = code
        self.msg = msg


VALID_GLOBAL_ROLES = ("admin", "member")
VALID_USER_STATUSES = ("active", "disabled")


def require_global_admin(user: User) -> None:
    """全局 admin 校验（REQ-045）；member 一律 4030。"""
    if user.role != "admin":
        raise AdminError(4030, "admin access required")


def list_users(repository, actor: User, q: str = "", role: str = "", status: str = "") -> list[User]:
    """admin 域用户列表（API-044）：q 匹配 name/email，可按 role / status 过滤。"""
    require_global_admin(actor)
    return repository.list_users(q=q, role=role, status=status)


def update_user_role(repository, actor: User, user_id: int, role: str) -> User:
    """改全局角色（API-045）；role 非法 4220，用户不存在 4004。"""
    require_global_admin(actor)
    if role not in VALID_GLOBAL_ROLES:
        raise AdminError(4220, "invalid role")
    user = repository.update_user_role(user_id, role)
    if user is None:
        raise AdminError(4004, "user not found")
    audit_event("user_role_changed", actor.id, "success", target_user_id=user_id, role=role)
    return user


def set_user_status(repository, actor: User, user_id: int, status: str) -> User:
    """禁用 / 启用账号（API-045）；禁用后撤销全部会话（既有会话失效）。"""
    require_global_admin(actor)
    if status not in VALID_USER_STATUSES:
        raise AdminError(4220, "invalid status")
    user = repository.set_user_status(user_id, status)
    if user is None:
        raise AdminError(4004, "user not found")
    if status == "disabled":
        repository.revoke_user_sessions(user_id)
    audit_event("user_status_changed", actor.id, "success", target_user_id=user_id, status=status)
    return user


def list_user_spaces_for_admin(repository, actor: User, user_id: int) -> dict[str, list[dict]]:
    """admin 域查询用户所属空间（API-054，REQ-050，维护态批5）。

    返回 ``{joined, available}``：joined = 该用户已加入空间 + 各空间角色 / 加入时间；
    available = 未加入空间（供"添加到空间"下拉）。避免改 ``GET /api/spaces``（那会
    影响 admin 自身的空间切换下拉），改由本端点一次返回两者。
    """
    require_global_admin(actor)
    target = repository.find_user_by_id(user_id)
    if target is None:
        raise AdminError(4004, "user not found")
    spaces = {s.id: s for s in repository.list_spaces()}
    joined_space_ids: set[int] = set()
    joined: list[dict] = []
    for membership in repository.list_memberships():
        if membership.user_id != user_id or membership.space_id not in spaces:
            continue
        space = spaces[membership.space_id]
        joined_space_ids.add(space.id)
        joined.append(
            {
                "space_id": space.id,
                "space_code": space.code,
                "space_name": space.name,
                "role": membership.role,
                "joined_at": membership.created_at,
            }
        )
    available = [
        {"space_id": space.id, "space_code": space.code, "space_name": space.name}
        for space in spaces.values()
        if space.id not in joined_space_ids
    ]
    return {"joined": joined, "available": available}
