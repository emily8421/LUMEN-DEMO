"""REQ-025 quick entry service (Phase2A, minimal).

快速录入索引条目：30s 录标题 / 来源 / 摘要；可保留草稿、转新文档或追加到已有文档。

权限口径（见 docs/07-api-spec.md API-017、docs/06-db-design.md lumen_quick_entries、
docs/09-verification.md TC-P2-QUICK-001）：
- 任何 mode：当前空间成员（非成员 → 4003）。
- draft：默认仅 owner 私有（list 时按 owner 过滤；最小版不暴露 list endpoint）。
- create_document：空间成员；新文档默认 private + owner=录入者；tag_ids 关联到新文档。
- append_document：需对 target_document 可写（不可见 → DocumentNotFoundError → 4004 不泄露；
  不可写 → 4003）；追加内容到目标文档；tag_ids 关联。
- discard：仅 status=draft 且属于当前用户的 entry 可丢弃 → discarded；否则 4004 / 4220。
- tag_ids：须为当前空间 active 标签，否则 4220。

不触发 AI；不绕过文档权限（转文档 / 追加复用 document service，已带权限 + chunk / 内链 sync）。
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import DocumentPermission, QuickEntry
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.service.document import (
    DocumentCreate,
    DocumentUpdate,
    create_document,
    get_visible_document,
    update_document,
)
from backend.service.permission import can_write_document, is_space_member


class QuickEntryValidationError(ApiError):
    """快速录入请求字段非法（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


class QuickEntryAccessError(ApiError):
    """空间 / 资源访问被拒（API 映射 4003）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


class QuickEntryNotFoundError(ApiError):
    """条目不存在或不属于当前用户（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


_QUICK_ENTRY_MODES = ("draft", "create_document", "append_document")


@dataclass(frozen=True)
class QuickEntryView:
    id: int
    status: str
    created_document_id: int | None
    target_document_id: int | None
    title: str
    owner_id: int


@dataclass(frozen=True)
class QuickEntryCaptureRequest:
    title: str
    content_md: str = ""
    source: str | None = None
    target_document_id: int | None = None
    tag_ids: tuple[int, ...] = ()
    mode: str = "draft"


def _ensure_space_member(repository: RepositoryProtocol, user_id: int, space_id: int) -> None:
    if not is_space_member(user_id, space_id, repository.list_memberships()):
        raise QuickEntryAccessError("space access denied")


def _validate_tag_ids(repository: RepositoryProtocol, space_id: int, tag_ids: tuple[int, ...]) -> None:
    active_tag_ids = {tag.id for tag in repository.list_tags(space_id, status="active")}
    for tag_id in tag_ids:
        if tag_id not in active_tag_ids:
            raise QuickEntryValidationError("tag_ids must reference active tags in this space")


def _apply_tags(repository: RepositoryProtocol, document_id: int, tag_ids: tuple[int, ...], user_id: int) -> None:
    for tag_id in tag_ids:
        repository.upsert_document_tag(tag_id, document_id, "quick_entry", user_id)


def _build_entry_block(title: str, content_md: str, source: str | None) -> str:
    """快速录入转文档 / 追加时的内容块：标题 + 可选来源 + 摘要。"""
    parts = [f"# {title.strip()}"]
    if source and source.strip():
        parts.append(f"> 来源：{source.strip()}")
    body = content_md.strip()
    parts.append(body if body else "（无摘要）")
    return "\n\n".join(parts)


def capture_quick_entry(
    repository: RepositoryProtocol,
    user_id: int,
    space_id: int,
    request: QuickEntryCaptureRequest,
) -> QuickEntryView:
    _ensure_space_member(repository, user_id, space_id)
    title = request.title.strip()
    if not title:
        raise QuickEntryValidationError("title must not be empty")
    if request.mode not in _QUICK_ENTRY_MODES:
        raise QuickEntryValidationError("mode must be draft / create_document / append_document")
    if request.mode == "append_document" and request.target_document_id is None:
        raise QuickEntryValidationError("append_document mode requires target_document_id")
    if request.mode != "append_document" and request.target_document_id is not None:
        raise QuickEntryValidationError("target_document_id is only allowed for append_document mode")
    _validate_tag_ids(repository, space_id, request.tag_ids)

    # 先建 draft entry，转换成功后回写状态 + 目标 id；entry 总存在，避免文档已建而条目缺失。
    entry = repository.create_quick_entry(
        space_id=space_id,
        owner_id=user_id,
        title=title,
        content_md=request.content_md,
        source=request.source,
        status="draft",
    )

    if request.mode == "create_document":
        document = create_document(
            repository,
            user_id,
            space_id,
            DocumentCreate(
                title=title,
                content_md=_build_entry_block(title, request.content_md, request.source),
                permission=DocumentPermission.PRIVATE,
            ),
        )
        entry = repository.update_quick_entry(
            entry.id, status="converted", created_document_id=document.id
        )
        _apply_tags(repository, document.id, request.tag_ids, user_id)
    elif request.mode == "append_document":
        if request.target_document_id is None:
            raise QuickEntryValidationError("target_document_id required for append_document mode")
        document = get_visible_document(repository, user_id, space_id, request.target_document_id)
        if not can_write_document(user_id, space_id, document, repository.list_memberships()):
            raise QuickEntryAccessError("target document not writable")
        appended = f"{document.content_md.rstrip()}\n\n---\n\n{_build_entry_block(title, request.content_md, request.source)}"
        update_document(
            repository,
            user_id,
            space_id,
            document.id,
            DocumentUpdate(title=document.title, content_md=appended, permission=document.permission),
        )
        entry = repository.update_quick_entry(
            entry.id, status="converted", target_document_id=document.id
        )
        _apply_tags(repository, document.id, request.tag_ids, user_id)

    return _to_view(entry)


def discard_quick_entry(repository: RepositoryProtocol, user_id: int, space_id: int, entry_id: int) -> QuickEntryView:
    _ensure_space_member(repository, user_id, space_id)
    entry = repository.get_quick_entry(entry_id)
    # draft 私有：非 owner 或跨空间一律按不存在处理（4004，不泄露存在性）。
    if entry is None or entry.space_id != space_id or entry.owner_id != user_id:
        raise QuickEntryNotFoundError("quick entry not found")
    if entry.status != "draft":
        raise QuickEntryValidationError("only draft entries can be discarded")
    updated = repository.update_quick_entry(entry_id, status="discarded")
    assert updated is not None  # entry 存在已由上方 get_quick_entry + 归属校验守卫
    return _to_view(updated)


def _to_view(entry: QuickEntry) -> QuickEntryView:
    return QuickEntryView(
        id=entry.id,
        status=entry.status,
        created_document_id=entry.created_document_id,
        target_document_id=entry.target_document_id,
        title=entry.title,
        owner_id=entry.owner_id,
    )
