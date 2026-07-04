"""Core data models for Sprint-1 space and permission logic."""

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
