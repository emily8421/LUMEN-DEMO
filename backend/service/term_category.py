"""REQ-036 术语领域树 service（migration 017，领域树增强）。

嵌套领域 CRUD + 移动（防环 / 跨空间）+ 改名（重名 4090）+ 删非空 4090 + 排序，
全部带空间隔离与术语可见性（term_count 统计该领域下术语数）。仿 ``folder.py``
（REQ-039 文档目录树），独立模块不共用 folder 表。

权限口径（docs/research/2026-08-07-term-domain-tree-analysis.md §3.4）：
- 领域树 CRUD / 移动 / 排序：当前空间成员；领域树不独立设权限。
- 同 parent 重名 → 4090（UNIQUE(space,parent,name)；根层 parent=null 由 service 兜底）。
- 移动防环 / 跨空间 → 4220；删非空（有子领域或术语）→ 4090。
- term_count：该领域下术语数（按 category_id 直接统计，术语可见性由 term list 过滤）。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from backend.model.entities import TermCategory
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.service.permission import is_space_member


class TermCategoryValidationError(ApiError):
    """领域树请求字段非法 / 防环 / 跨空间（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


class TermCategoryAccessError(ApiError):
    """空间访问被拒（API 映射 4003）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


class TermCategoryConflictError(ApiError):
    """同 parent 重名 / 删非空（API 映射 4090）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.CONFLICT, message, status_code)


class TermCategoryNotFoundError(ApiError):
    """领域节点不存在或不属于当前空间（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


# sentinel：区分「不修改该字段」与「显式置 None」（move 到根 parent=None）
class _Unset:
    pass


UNSET: Any = _Unset()


@dataclass(frozen=True)
class TermCategoryView:
    id: int
    name: str
    parent_id: int | None
    order_idx: int
    term_count: int  # 该领域下术语数
    child_category_count: int
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class TermCategoryCreateRequest:
    name: str
    parent_id: int | None = None  # None = 空间根


@dataclass(frozen=True)
class TermCategoryUpdateRequest:
    # name: str | UNSET；parent_id: int | None | UNSET（None = 移到根）
    name: Any = UNSET
    parent_id: Any = UNSET


def _ensure_space_member(repository: RepositoryProtocol, user_id: int, space_id: int) -> None:
    if not is_space_member(user_id, space_id, repository.list_memberships()):
        raise TermCategoryAccessError("space access denied")


def _get_space_category(repository: RepositoryProtocol, space_id: int, category_id: int) -> TermCategory:
    category = repository.get_term_category(category_id)
    if category is None or category.space_id != space_id:
        raise TermCategoryNotFoundError("category not found")
    return category


def _ensure_no_name_clash(
    repository: RepositoryProtocol,
    space_id: int,
    parent_id: int | None,
    name: str,
    exclude_id: int | None = None,
) -> None:
    existing = repository.find_term_category_by_name(space_id, parent_id, name)
    if existing is not None and existing.id != exclude_id:
        raise TermCategoryConflictError("category name already exists under this parent")


def list_term_categories(
    repository: RepositoryProtocol,
    user_id: int,
    space_id: int,
    parent_id: int | None = None,
) -> list[TermCategoryView]:
    """懒加载：返回 ``parent_id`` 直接子层领域（None=根层），带 term_count 与 child_category_count。"""
    _ensure_space_member(repository, user_id, space_id)
    all_categories = repository.list_term_categories(space_id)
    views: list[TermCategoryView] = []
    for category in all_categories:
        if category.parent_id != parent_id:
            continue  # None == None 匹配根层
        views.append(
            TermCategoryView(
                id=category.id,
                name=category.name,
                parent_id=category.parent_id,
                order_idx=category.order_idx,
                term_count=len(repository.list_term_category_term_ids(space_id, category.id)),
                child_category_count=sum(1 for c in all_categories if c.parent_id == category.id),
                created_at=category.created_at,
                updated_at=category.updated_at,
            )
        )
    views.sort(key=lambda v: (v.order_idx, v.name))
    return views


def create_term_category(
    repository: RepositoryProtocol,
    user_id: int,
    space_id: int,
    request: TermCategoryCreateRequest,
) -> TermCategory:
    _ensure_space_member(repository, user_id, space_id)
    name = request.name.strip()
    if not name:
        raise TermCategoryValidationError("category name must not be empty")
    parent_id = request.parent_id
    if parent_id is not None:
        parent = repository.get_term_category(parent_id)
        if parent is None or parent.space_id != space_id:
            raise TermCategoryValidationError("parent category not found in this space")
    _ensure_no_name_clash(repository, space_id, parent_id, name)
    return repository.create_term_category(space_id=space_id, parent_id=parent_id, name=name, created_by=user_id)


def update_term_category(
    repository: RepositoryProtocol,
    user_id: int,
    space_id: int,
    category_id: int,
    request: TermCategoryUpdateRequest,
) -> TermCategory:
    _ensure_space_member(repository, user_id, space_id)
    category = _get_space_category(repository, space_id, category_id)

    # 先 move：rename 的重名检查才能落到目标 parent 下
    if request.parent_id is not UNSET:
        target_parent = request.parent_id  # int | None（None = 移到根）
        if target_parent is not None:
            target = repository.get_term_category(target_parent)
            if target is None or target.space_id != space_id:
                raise TermCategoryValidationError("target parent not found in this space")
            if target_parent == category.id or repository.is_descendant_term_category(space_id, category.id, target_parent):
                raise TermCategoryValidationError("cannot move category into itself or its descendant")
        if target_parent != category.parent_id:
            category = repository.move_term_category(category_id, target_parent)

    # rename（在最终 parent 下查重名）
    if request.name is not UNSET:
        name = request.name.strip() if request.name is not None else ""
        if not name:
            raise TermCategoryValidationError("category name must not be empty")
        if name != category.name:
            _ensure_no_name_clash(repository, space_id, category.parent_id, name, exclude_id=category_id)
            category = repository.rename_term_category(category_id, name)

    return category


def delete_term_category(repository: RepositoryProtocol, user_id: int, space_id: int, category_id: int) -> None:
    _ensure_space_member(repository, user_id, space_id)
    category = _get_space_category(repository, space_id, category_id)
    if not repository.is_term_category_empty(space_id, category.id):
        raise TermCategoryConflictError("category is not empty; move or delete its terms or child categories first")
    repository.delete_term_category(category.id)


def reorder_term_categories(
    repository: RepositoryProtocol,
    user_id: int,
    space_id: int,
    parent_id: int | None,
    ordered_ids: list[int],
) -> None:
    """重排 ``parent_id`` 下全部直接子领域；``ordered_ids`` 必须恰好等于该层全部子领域。"""
    _ensure_space_member(repository, user_id, space_id)
    child_ids = {c.id for c in repository.list_term_categories(space_id) if c.parent_id == parent_id}
    if set(ordered_ids) != child_ids:
        raise TermCategoryValidationError("ordered ids must match all child categories under this parent exactly")
    repository.reorder_term_categories(space_id, list(ordered_ids))
