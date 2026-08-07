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
    email: str | None = None
    password_hash: str | None = None
    status: str = "active"
    failed_login_count: int = 0
    locked_until: str = ""
    last_login_at: str = ""
    # Sprint-28（REQ-045，migration 016）：全局角色 admin / member，默认 member
    role: str = "member"


@dataclass(frozen=True)
class Session:
    """lumen_sessions（migration 014）：不透明 token session，token 只存 SHA-256 摘要。"""

    id: int
    user_id: int
    current_space_id: int | None
    token_hash: str
    expires_at: str
    created_at: str = ""
    revoked_at: str | None = None
    last_used_at: str | None = None
    client_ua: str | None = None
    client_ip: str | None = None


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
    created_at: str = ""


@dataclass(frozen=True)
class SpaceMemberDetail:
    """Sprint-28 空间成员列表行（API-046）：成员 + 用户展示字段 + 加入时间。"""

    user_id: int
    space_id: int
    name: str
    email: str | None
    role: SpaceRole
    joined_at: str = ""


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
    folder_id: int | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass(frozen=True)
class Folder:
    """REQ-039 文档目录树（lumen_folders，migration 011）。

    嵌套文件夹（邻接表，parent_id 自引用，空=空间根）。folder 不独立设权限
    （FT-C-003），文档可见性仍看 ``lumen_documents.permission``。``order`` 为手动
    排序；文档首版不加 order，folder 内按 ``title`` 排序（FT-C-009）。folder 只
    ``active`` 无 ``archived``（FT-C-010）。
    """

    id: int
    space_id: int
    parent_id: int | None  # null = 空间根
    name: str
    order: int
    created_by: int
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
    # 术语管理增强（migration 017，REQ-036 领域树）：
    # category_id 挂到领域树叶子（可空=未分类）；category 内容分类（14 类候选，
    # 自由输入）；source 术语来源（行业标准 / 公司内部 / 外部文献 / 项目背景）。
    category_id: int | None = None
    category: str | None = None
    source: str | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass(frozen=True)
class TermCategory:
    """术语领域树节点（lumen_term_categories，migration 017，REQ-036 增强）。

    嵌套邻接表（parent_id 自引用，空=空间根），仿 lumen_folders（REQ-039）。领域树
    不独立设权限（复用 folder 口径）；重名 UNIQUE(space_id, parent_id, name)，根层
    由 service 兜底；删非空（有子领域或术语）由 service 拒绝（4090）；无 archived。
    """

    id: int
    space_id: int
    parent_id: int | None  # null = 空间根
    name: str
    order_idx: int
    created_by: int
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


@dataclass(frozen=True)
class AiDraft:
    """REQ-014 AI 润色 / 写作引用草稿（lumen_ai_drafts，migration 010）。

    mode：'polish'（改写选区）/ 'citation'（带来源引用）。数据外发护栏（RG-008）：
    只存 input_excerpt_hash（选区 sha256）+ prompt_summary（摘要，不含完整 prompt），
    不存完整敏感原文 / API key。status：'generated'（已生成草稿）/ 'applied'
    （已写回正文 + 版本）/ 'discarded'（已丢弃）/ 'failed'（生成失败 / 降级未落 generated）。
    cited_chunk_ids：citation 模式召回的可见 chunk id（仅当前用户可见 chunk）。
    """

    id: int
    space_id: int
    document_id: int
    user_id: int
    mode: str
    input_excerpt_hash: str | None = None
    prompt_summary: str = ""
    output_md: str = ""
    cited_chunk_ids: tuple[int, ...] = ()
    status: str = "generated"
    created_at: str = ""


@dataclass(frozen=True)
class DocExport:
    """REQ-027 单文档 PDF 导出任务（lumen_doc_exports，migration 013）。"""

    id: int
    space_id: int
    document_id: int
    requested_by: int
    format: str
    status: str
    version_no: int
    artifact_path: str | None = None
    error_message: str | None = None
    created_at: str = ""
    finished_at: str | None = None
