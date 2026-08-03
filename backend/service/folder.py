"""REQ-039 folder service (Phase2B 第三 slice 候选, minimal).

嵌套文件夹 CRUD + 移动（防环 / 跨空间）+ 改名（重名 4090）+ 删非空 4090 + 排序，
全部带空间隔离与文档可见性过滤（document_count 只统计当前用户可见文档）。

权限口径（docs/07-api-spec.md API-034..037、docs/06-db-design.md lumen_folders、
docs/design/folder-tree.md FT-C-001..013）：
- folder CRUD / 移动 / 排序：当前空间成员；folder 不独立设权限（FT-C-003）。
- 同 parent 重名 → 4090（UNIQUE(space,parent,name)；根层 parent=null 由 service 兜底，
  因 PG UNIQUE 对 NULL 不去重）。
- 移动防环 / 跨空间 → 4220；删非空（有子 folder 或文档）→ 4090（FT-C-010）。
- document_count：只统计当前用户可见文档（folder 内仍按 permission 过滤，不泄露越权）。
- 文档首版不加 order，folder 内按 title 排序（FT-C-009）。

越界（本轮不做）：导入保留结构（API-029 preserve_structure，Flow-D-012）、
前端文件管理器、folder 独立权限、文档 order、folder 软删除（FT-C-013）。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from backend.model.entities import Folder
from backend.service.permission import filter_visible_documents, is_space_member


class FolderValidationError(Exception):
    """folder 请求字段非法 / 防环 / 跨空间（API 映射 4220）。"""


class FolderAccessError(Exception):
    """空间访问被拒（API 映射 4003）。"""


class FolderConflictError(Exception):
    """同 parent 重名 / 删非空（API 映射 4090）。"""


class FolderNotFoundError(Exception):
    """folder 不存在或不属于当前空间（API 映射 4004）。"""


# sentinel：区分「不修改该字段」与「显式置 None」（move 到根 parent=None）
class _Unset:
    pass


UNSET: Any = _Unset()


@dataclass(frozen=True)
class FolderView:
    id: int
    name: str
    parent_id: int | None
    order: int
    document_count: int  # 当前用户可见文档数
    child_folder_count: int
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class FolderCreateRequest:
    name: str
    parent_id: int | None = None  # None = 空间根


@dataclass(frozen=True)
class FolderUpdateRequest:
    # name: str | UNSET；parent_id: int | None | UNSET（None = 移到根）
    name: Any = UNSET
    parent_id: Any = UNSET


def _ensure_space_member(repository, user_id: int, space_id: int) -> None:
    if not is_space_member(user_id, space_id, repository.list_memberships()):
        raise FolderAccessError("space access denied")


def _get_space_folder(repository, space_id: int, folder_id: int) -> Folder:
    folder = repository.get_folder(folder_id)
    if folder is None or folder.space_id != space_id:
        raise FolderNotFoundError("folder not found")
    return folder


def _ensure_no_name_clash(
    repository,
    space_id: int,
    parent_id: int | None,
    name: str,
    exclude_id: int | None = None,
) -> None:
    existing = repository.find_folder_by_name(space_id, parent_id, name)
    if existing is not None and existing.id != exclude_id:
        raise FolderConflictError("folder name already exists under this parent")


def _visible_document_count(repository, user_id: int, space_id: int, folder_id: int) -> int:
    doc_ids = set(repository.list_folder_document_ids(space_id, folder_id))
    if not doc_ids:
        return 0
    memberships = repository.list_memberships()
    candidates = [d for d in repository.list_documents() if d.id in doc_ids]
    visible = filter_visible_documents(user_id, space_id, candidates, memberships)
    return len(visible)


def list_folders(
    repository,
    user_id: int,
    space_id: int,
    parent_id: int | None = None,
) -> list[FolderView]:
    """懒加载：返回 ``parent_id`` 直接子层 folder（None=根层），带可见 document_count 与 child_folder_count。"""
    _ensure_space_member(repository, user_id, space_id)
    all_folders = repository.list_folders(space_id)
    views: list[FolderView] = []
    for folder in all_folders:
        if folder.parent_id != parent_id:
            continue  # None == None 匹配根层
        views.append(
            FolderView(
                id=folder.id,
                name=folder.name,
                parent_id=folder.parent_id,
                order=folder.order,
                document_count=_visible_document_count(repository, user_id, space_id, folder.id),
                child_folder_count=sum(1 for f in all_folders if f.parent_id == folder.id),
                created_at=folder.created_at,
                updated_at=folder.updated_at,
            )
        )
    views.sort(key=lambda v: (v.order, v.name))
    return views


def create_folder(repository, user_id: int, space_id: int, request: FolderCreateRequest) -> Folder:
    _ensure_space_member(repository, user_id, space_id)
    name = request.name.strip()
    if not name:
        raise FolderValidationError("folder name must not be empty")
    parent_id = request.parent_id
    if parent_id is not None:
        parent = repository.get_folder(parent_id)
        if parent is None or parent.space_id != space_id:
            raise FolderValidationError("parent folder not found in this space")
    _ensure_no_name_clash(repository, space_id, parent_id, name)
    return repository.create_folder(space_id=space_id, parent_id=parent_id, name=name, created_by=user_id)


def update_folder(
    repository,
    user_id: int,
    space_id: int,
    folder_id: int,
    request: FolderUpdateRequest,
) -> Folder:
    _ensure_space_member(repository, user_id, space_id)
    folder = _get_space_folder(repository, space_id, folder_id)

    # 先 move：rename 的重名检查才能落到目标 parent 下
    if request.parent_id is not UNSET:
        target_parent = request.parent_id  # int | None（None = 移到根）
        if target_parent is not None:
            target = repository.get_folder(target_parent)
            if target is None or target.space_id != space_id:
                raise FolderValidationError("target parent not found in this space")
            if target_parent == folder.id or repository.is_descendant_folder(space_id, folder.id, target_parent):
                raise FolderValidationError("cannot move folder into itself or its descendant")
        if target_parent != folder.parent_id:
            folder = repository.move_folder(folder_id, target_parent)

    # rename（在最终 parent 下查重名）
    if request.name is not UNSET:
        name = request.name.strip() if request.name is not None else ""
        if not name:
            raise FolderValidationError("folder name must not be empty")
        if name != folder.name:
            _ensure_no_name_clash(repository, space_id, folder.parent_id, name, exclude_id=folder_id)
            folder = repository.rename_folder(folder_id, name)

    return folder


def delete_folder(repository, user_id: int, space_id: int, folder_id: int) -> None:
    _ensure_space_member(repository, user_id, space_id)
    folder = _get_space_folder(repository, space_id, folder_id)
    if not repository.is_folder_empty(space_id, folder.id):
        raise FolderConflictError("folder is not empty; move or delete its contents first")
    repository.delete_folder(folder.id)


def reorder_folders(
    repository,
    user_id: int,
    space_id: int,
    parent_id: int | None,
    ordered_ids: list[int],
) -> None:
    """重排 ``parent_id`` 下全部直接子 folder；``ordered_ids`` 必须恰好等于该层全部子 folder。"""
    _ensure_space_member(repository, user_id, space_id)
    child_ids = {f.id for f in repository.list_folders(space_id) if f.parent_id == parent_id}
    if set(ordered_ids) != child_ids:
        raise FolderValidationError("ordered ids must match all child folders under this parent exactly")
    repository.reorder_folders(space_id, list(ordered_ids))
