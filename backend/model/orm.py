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
from sqlalchemy import BigInteger, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserORM(Base):
    __tablename__ = "lumen_users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


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
