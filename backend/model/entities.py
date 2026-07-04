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


@dataclass(frozen=True)
class Space:
    id: int
    code: str
    name: str


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
    document_type: str = "markdown"
    current_version: int = 1


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
    created_at: str = ""


@dataclass(frozen=True)
class DocumentChunk:
    id: int
    document_id: int
    ordinal: int
    text: str


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
