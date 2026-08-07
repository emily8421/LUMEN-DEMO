"""SQLAlchemy ORM models for the 8 Phase1 lumen_* tables.

Mirrors docs/06-db-design.md and backend/model/entities.py (frozen DTOs).
PgRepository (backend/service/pg_repository.py) queries these models and
converts rows to the frozen dataclass entities the service/api layers expect.

Tables are created by backend/migrations/001-004 (run by db.init_db); the ORM
is read/write only and does NOT create/drop schema (no Base.metadata.create_all).
"""

from __future__ import annotations

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserORM(Base):
    __tablename__ = "lumen_users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # migration 014（Sprint-26 / Phase2D 账号体系）：password_hash demo seed = NULL
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='active')
    # migration 016（Sprint-28 / REQ-045）：全局角色 admin / member，默认 member（DB server_default 兜底）
    role: Mapped[str] = mapped_column(String(20), default='member')
    last_login_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class SessionORM(Base):
    '''lumen_sessions（migration 014）：不透明 token session，token 只存 SHA-256 hash。'''

    __tablename__ = 'lumen_sessions'

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('lumen_users.id', ondelete='CASCADE'))
    current_space_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey('lumen_spaces.id', ondelete='SET NULL'), nullable=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    client_ua: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)


class SpaceORM(Base):
    __tablename__ = "lumen_spaces"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class SpaceMemberORM(Base):
    __tablename__ = "lumen_space_members"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id", ondelete="CASCADE"), primary_key=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String)
    # migration 016（Sprint-28 / REQ-047）：成员加入时间，支撑 API-046 joined_at 契约
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class DocumentORM(Base):
    __tablename__ = "lumen_documents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String)
    content_md: Mapped[str] = mapped_column(Text, default="")
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    permission: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String, default="markdown")
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    folder_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("lumen_folders.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class FolderORM(Base):
    """REQ-039 文档目录树（migration 011）。邻接表 parent_id 自引用（空=空间根）。"""

    __tablename__ = "lumen_folders"
    __table_args__ = (
        UniqueConstraint("space_id", "parent_id", "name", name="lumen_folders_unique_name"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    parent_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("lumen_folders.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class DocumentVersionORM(Base):
    __tablename__ = "lumen_document_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="CASCADE"))
    version_no: Mapped[int] = mapped_column(Integer)
    content_md: Mapped[str] = mapped_column(Text)
    editor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class ImportJobORM(Base):
    __tablename__ = "lumen_imports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    source_filename: Mapped[str] = mapped_column(String)
    mime: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="processing")
    parsed_doc_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("lumen_documents.id"), nullable=True)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class DocumentChunkORM(Base):
    __tablename__ = "lumen_chunks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="CASCADE"))
    ordinal: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    # embedding is filled by T4 (bge-small-zh); T3 leaves it NULL. ts_vector is
    # maintained by a DB trigger (migration 003) and intentionally not mapped —
    # the ORM neither reads nor writes it.
    embedding: Mapped[list[float] | None] = mapped_column(Vector(512), nullable=True)


class TermORM(Base):
    __tablename__ = "lumen_terms"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"), nullable=True)
    term: Mapped[str] = mapped_column(String)
    definition: Mapped[str] = mapped_column(Text)
    aliases: Mapped[list] = mapped_column(JSONB, default=list)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    status: Mapped[str] = mapped_column(String, default="pending")
    source_document_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("lumen_documents.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class DocLinkORM(Base):
    """REQ-026 内部链接索引（migration 007）。"""

    __tablename__ = "lumen_doc_links"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    source_document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="CASCADE"))
    target_document_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="SET NULL"), nullable=True)
    target_title: Mapped[str] = mapped_column(Text)
    link_text: Mapped[str] = mapped_column(Text)
    link_type: Mapped[str] = mapped_column(String, default="wikilink")
    status: Mapped[str] = mapped_column(String, default="unresolved")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class TagORM(Base):
    """REQ-012 扁平标签（migration 008）。"""

    __tablename__ = "lumen_tags"
    __table_args__ = (
        UniqueConstraint("space_id", "normalized_name", name="lumen_tags_unique_name"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(Text)
    normalized_name: Mapped[str] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class TagLinkORM(Base):
    """REQ-012 文档-标签关联（migration 008）。复合主键 (tag_id, document_id)。"""

    __tablename__ = "lumen_tag_links"

    tag_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_tags.id", ondelete="CASCADE"), primary_key=True)
    document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="CASCADE"), primary_key=True)
    link_source: Mapped[str] = mapped_column(String, default="manual")
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class QuickEntryORM(Base):
    """REQ-025 快速录入索引条目（migration 009）。"""

    __tablename__ = "lumen_quick_entries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    title: Mapped[str] = mapped_column(Text)
    content_md: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_document_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("lumen_documents.id", ondelete="SET NULL"), nullable=True
    )
    created_document_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("lumen_documents.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String, default="draft")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class AiDraftORM(Base):
    """REQ-014 AI 润色 / 写作引用草稿（migration 010）。cited_chunk_ids 用 JSONB。"""

    __tablename__ = "lumen_ai_drafts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    mode: Mapped[str] = mapped_column(String)
    input_excerpt_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_summary: Mapped[str] = mapped_column(Text, default="")
    output_md: Mapped[str] = mapped_column(Text, default="")
    cited_chunk_ids: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[str] = mapped_column(String, default="generated")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class DocExportORM(Base):
    """REQ-027 单文档 PDF 导出任务（migration 013）。"""

    __tablename__ = "lumen_doc_exports"
    __table_args__ = (
        CheckConstraint("format = 'pdf'", name="lumen_doc_exports_format_pdf"),
        CheckConstraint(
            "status IN ('queued', 'running', 'done', 'failed')",
            name="lumen_doc_exports_status_check",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    space_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_spaces.id", ondelete="CASCADE"))
    document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_documents.id", ondelete="CASCADE"))
    requested_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("lumen_users.id"))
    format: Mapped[str] = mapped_column(String, default="pdf")
    status: Mapped[str] = mapped_column(String, default="queued")
    version_no: Mapped[int] = mapped_column(Integer)
    artifact_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
