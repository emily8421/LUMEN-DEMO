"""REQ-012 tag service (Phase2A, minimal).

扁平标签 CRUD + 文档-标签关联，全部带空间隔离与文档权限过滤。

权限口径（见 docs/07-api-spec.md API-014/027/031/032、docs/06-db-design.md lumen_tags）：
- 标签 CRUD：当前空间成员；同空间 normalized_name 重名 → 4090。
- document_count：只统计当前用户可见文档（跨空间 / 无权限不计入）。
- 文档-标签关联：列需可读文档（仅同空间 active 标签）；打 / 移除需文档可写 + 标签同空间 active。
- 标签下文档：空间成员；按文档可见性过滤。

归一化口径：normalized_name = name.strip().lower()（中文 lower 无害）。
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Document, Tag
from backend.model.error_codes import ApiError, ErrorCode
from backend.service.document import DocumentNotFoundError, get_visible_document
from backend.service.permission import (
    can_view_document,
    can_write_document,
    filter_visible_documents,
    is_space_member,
)


class TagValidationError(ApiError):
    """标签请求字段非法（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


class TagAccessError(ApiError):
    """空间 / 资源访问被拒（API 映射 4003）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


class TagConflictError(ApiError):
    """同空间标签重名（API 映射 4090）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.CONFLICT, message, status_code)


class TagNotFoundError(ApiError):
    """标签不存在或不属于当前空间（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


@dataclass(frozen=True)
class TagView:
    id: int
    name: str
    color: str | None
    description: str | None
    status: str
    document_count: int


@dataclass(frozen=True)
class DocumentTagView:
    tag_id: int
    name: str
    color: str | None
    link_source: str


@dataclass(frozen=True)
class TagCreateRequest:
    name: str
    color: str | None = None
    description: str | None = None


@dataclass(frozen=True)
class TagUpdateRequest:
    name: str | None = None
    color: str | None = None
    description: str | None = None
    status: str | None = None


def _normalize_tag_name(name: str) -> str:
    return name.strip().lower()


def _ensure_space_member(repository, user_id: int, space_id: int) -> None:
    if not is_space_member(user_id, space_id, repository.list_memberships()):
        raise TagAccessError("space access denied")


def _get_space_tag(repository, space_id: int, tag_id: int) -> Tag:
    tag = repository.get_tag(tag_id)
    if tag is None or tag.space_id != space_id:
        raise TagNotFoundError("tag not found")
    return tag


def _visible_document_ids(repository, user_id: int, space_id: int, memberships) -> set[int]:
    return {
        document.id
        for document in repository.list_documents()
        if document.space_id == space_id and can_view_document(user_id, space_id, document, memberships)
    }


def list_tags(
    repository,
    user_id: int,
    space_id: int,
    q: str | None = None,
    status: str | None = "active",
) -> list[TagView]:
    memberships = repository.list_memberships()
    _ensure_space_member(repository, user_id, space_id)
    visible_ids = _visible_document_ids(repository, user_id, space_id, memberships)
    views: list[TagView] = []
    for tag in repository.list_tags(space_id, q, status):
        count = len(set(repository.list_tag_document_ids(tag.id)) & visible_ids)
        views.append(
            TagView(
                id=tag.id,
                name=tag.name,
                color=tag.color,
                description=tag.description,
                status=tag.status,
                document_count=count,
            )
        )
    return views


def get_tag_detail(repository, user_id: int, space_id: int, tag_id: int) -> TagView:
    _ensure_space_member(repository, user_id, space_id)
    tag = _get_space_tag(repository, space_id, tag_id)
    visible_ids = _visible_document_ids(repository, user_id, space_id, repository.list_memberships())
    count = len(set(repository.list_tag_document_ids(tag_id)) & visible_ids)
    return TagView(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        description=tag.description,
        status=tag.status,
        document_count=count,
    )


def create_tag(repository, user_id: int, space_id: int, request: TagCreateRequest) -> Tag:
    _ensure_space_member(repository, user_id, space_id)
    name = request.name.strip()
    if not name:
        raise TagValidationError("tag name must not be empty")
    normalized = _normalize_tag_name(name)
    if any(tag.normalized_name == normalized for tag in repository.list_tags(space_id, status=None)):
        raise TagConflictError("tag name already exists in this space")
    return repository.create_tag(
        space_id=space_id,
        name=name,
        normalized_name=normalized,
        created_by=user_id,
        color=request.color,
        description=request.description,
    )


def update_tag(repository, user_id: int, space_id: int, tag_id: int, request: TagUpdateRequest) -> Tag:
    _ensure_space_member(repository, user_id, space_id)
    tag = _get_space_tag(repository, space_id, tag_id)
    new_name = request.name.strip() if request.name is not None else None
    new_norm = _normalize_tag_name(new_name) if new_name is not None else None
    if new_norm is not None and new_norm != tag.normalized_name:
        clash = any(
            other.normalized_name == new_norm and other.id != tag_id
            for other in repository.list_tags(space_id, status=None)
        )
        if clash:
            raise TagConflictError("tag name already exists in this space")
    if request.status is not None and request.status not in ("active", "archived"):
        raise TagValidationError("status must be active or archived")
    return repository.update_tag(
        tag_id=tag_id,
        name=new_name,
        normalized_name=new_norm,
        color=request.color,
        description=request.description,
        status=request.status,
    )


def archive_tag(repository, user_id: int, space_id: int, tag_id: int) -> Tag:
    return update_tag(repository, user_id, space_id, tag_id, TagUpdateRequest(status="archived"))


def list_document_tags(
    repository,
    user_id: int,
    space_id: int,
    document_id: int,
) -> list[DocumentTagView]:
    # 需可读文档（不可读 → DocumentNotFoundError → 4004，不泄露存在性）
    get_visible_document(repository, user_id, space_id, document_id)
    links = repository.list_document_tag_links(document_id)
    active_tags = {tag.id: tag for tag in repository.list_tags(space_id, status="active")}
    views: list[DocumentTagView] = []
    for link in links:
        tag = active_tags.get(link.tag_id)
        if tag is None:
            continue  # 归档标签不在文档详情显示（07：仅返回同空间 active 标签）
        views.append(
            DocumentTagView(tag_id=tag.id, name=tag.name, color=tag.color, link_source=link.link_source)
        )
    return views


def add_document_tag(repository, user_id: int, space_id: int, document_id: int, tag_id: int):
    document = get_visible_document(repository, user_id, space_id, document_id)
    if not can_write_document(user_id, space_id, document, repository.list_memberships()):
        raise TagAccessError("document not writable")
    tag = repository.get_tag(tag_id)
    if tag is None or tag.space_id != space_id or tag.status != "active":
        raise TagValidationError("tag must be an active tag in this space")
    return repository.upsert_document_tag(tag_id, document_id, "manual", user_id)


def remove_document_tag(repository, user_id: int, space_id: int, document_id: int, tag_id: int) -> bool:
    document = get_visible_document(repository, user_id, space_id, document_id)
    if not can_write_document(user_id, space_id, document, repository.list_memberships()):
        raise TagAccessError("document not writable")
    return repository.remove_document_tag(tag_id, document_id)


def list_documents_by_tag(
    repository,
    user_id: int,
    space_id: int,
    tag_id: int,
    status: str | None = "active",
) -> list[Document]:
    _ensure_space_member(repository, user_id, space_id)
    tag = _get_space_tag(repository, space_id, tag_id)
    if status is not None and tag.status != status:
        return []  # 默认 status=active：归档标签不列入其文档（API-032 status 过滤）
    doc_ids = set(repository.list_tag_document_ids(tag_id))
    documents = [
        document
        for document in repository.list_documents()
        if document.id in doc_ids and document.space_id == space_id
    ]
    return filter_visible_documents(user_id, space_id, documents, repository.list_memberships())
