"""Core data models for Phase1 space, permission, and document logic."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class DocumentPermission(StrEnum):
    """Document visibility levels defined by docs/06-db-design.md."""

    PRIVATE = "private"
    TEAM = "team"
    EXTERNAL = "external"


class SpaceRole(StrEnum):
    """Space membership roles defined by docs/06-db-design.md."""

    ADMIN = "admin"
    MEMBER = "member"


class TermStatus(StrEnum):
    """Term lifecycle status defined by docs/design/term-management.md."""

    CONFIRMED = "confirmed"
    PENDING = "pending"


@dataclass(frozen=True)
class User:
    id: int
    external_id: str
    name: str
    created_at: str = ""


@dataclass(frozen=True)
class Space:
    id: int
    code: str
    name: str
    created_at: str = ""


@dataclass(frozen=True)
class SpaceMember:
    user_id: int
    space_id: int
    role: SpaceRole


@dataclass(frozen=True)
class Document:
    id: int
    space_id: int
    title: str
    content_md: str
    owner_id: int
    permission: DocumentPermission
    type: str = "markdown"
    current_version: int = 1
    created_at: str = ""
    updated_at: str = ""


@dataclass(frozen=True)
class DocumentVersion:
    id: int
    document_id: int
    version_no: int
    content_md: str
    editor_id: int
    created_at: str


@dataclass(frozen=True)
class ImportJob:
    id: int
    space_id: int
    source_filename: str
    status: str
    created_by: int
    parsed_doc_id: int | None = None
    chunk_count: int = 0
    error: str | None = None
    mime: str | None = None
    created_at: str = ""


@dataclass(frozen=True)
class DocumentChunk:
    id: int
    document_id: int
    ordinal: int
    text: str
    embedding: list[float] | None = None
    ts_vector: str | None = None


@dataclass(frozen=True)
class DocLink:
    """REQ-026 内部链接 / 反向链接索引行（lumen_doc_links）。"""

    id: int
    space_id: int
    source_document_id: int
    target_document_id: int | None
    target_title: str
    link_text: str
    link_type: str  # 'wikilink' | 'manual'
    status: str  # 'resolved' | 'unresolved' | 'no_access'（no_access 查询时折算）
    created_at: str = ""
    updated_at: str = ""


@dataclass(frozen=True)
class DocLinkDraft:
    """sync_document_wikilinks 传给 repository 的 wikilink 草稿（未落 id）。"""

    target_document_id: int | None
    target_title: str
    link_text: str
    status: str  # 'resolved' | 'unresolved'


@dataclass(frozen=True)
class Term:
    id: int
    space_id: int | None
    term: str
    definition: str
    aliases: list[str]
    owner_id: int
    status: TermStatus
    source_document_id: int | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass(frozen=True)
class Tag:
    """REQ-012 扁平标签（lumen_tags）。空间隔离；normalized_name 用于重名校验。"""

    id: int
    space_id: int
    name: str
    normalized_name: str
    color: str | None = None
    description: str | None = None
    status: str = "active"  # 'active' | 'archived'
    created_by: int = 0
    created_at: str = ""
    updated_at: str = ""


@dataclass(frozen=True)
class TagLink:
    """REQ-012 文档-标签关联（lumen_tag_links）。最小版 link_source 固定 manual。"""

    tag_id: int
    document_id: int
    link_source: str = "manual"  # 'manual' | 'quick_entry' | 'import' | 'ai_suggested'
    created_by: int = 0
    created_at: str = ""


@dataclass(frozen=True)
class QuickEntry:
    """REQ-025 快速录入索引条目（lumen_quick_entries）。

    轻量条目：标题 / 来源 / 摘要；无原文也能沉淀。draft 默认仅 owner 可见；
    转文档后继承目标文档权限。status：'draft'（保留草稿）/ 'converted'
    （已转新文档 created_document_id 或追加到 target_document_id）/ 'discarded'（已丢弃）。
    """

    id: int
    space_id: int
    owner_id: int
    title: str
    content_md: str = ""
    source: str | None = None
    target_document_id: int | None = None
    created_document_id: int | None = None
    status: str = "draft"
    created_at: str = ""
    updated_at: str = ""
