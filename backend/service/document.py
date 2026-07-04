"""Document CRUD and version service for Sprint-2."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Document, DocumentPermission, DocumentVersion, SpaceMember
from backend.service.permission import can_view_document, filter_visible_documents, is_space_member


class DocumentAccessError(Exception):
    pass


class DocumentNotFoundError(Exception):
    pass


class VersionNotFoundError(Exception):
    pass


@dataclass(frozen=True)
class DocumentCreate:
    title: str
    content_md: str
    permission: DocumentPermission


@dataclass(frozen=True)
class DocumentUpdate:
    title: str
    content_md: str
    permission: DocumentPermission


def list_visible_documents(
    user_id: int,
    current_space_id: int,
    documents: list[Document],
    memberships: list[SpaceMember],
) -> list[Document]:
    return filter_visible_documents(user_id, current_space_id, documents, memberships)


def create_document(
    repository,
    user_id: int,
    current_space_id: int,
    request: DocumentCreate,
) -> Document:
    memberships = repository.list_memberships()
    if not is_space_member(user_id, current_space_id, memberships):
        raise DocumentAccessError("space access denied")

    return repository.create_document(
        space_id=current_space_id,
        title=request.title,
        content_md=request.content_md,
        owner_id=user_id,
        permission=request.permission,
    )


def get_visible_document(repository, user_id: int, current_space_id: int, document_id: int) -> Document:
    document = repository.get_document(document_id)
    if document is None:
        raise DocumentNotFoundError("document not found")

    if not can_view_document(user_id, current_space_id, document, repository.list_memberships()):
        raise DocumentNotFoundError("document not found")

    return document


def update_document(
    repository,
    user_id: int,
    current_space_id: int,
    document_id: int,
    request: DocumentUpdate,
) -> Document:
    get_visible_document(repository, user_id, current_space_id, document_id)
    return repository.update_document(
        document_id=document_id,
        title=request.title,
        content_md=request.content_md,
        permission=request.permission,
        editor_id=user_id,
    )


def delete_document(repository, user_id: int, current_space_id: int, document_id: int) -> None:
    get_visible_document(repository, user_id, current_space_id, document_id)
    repository.delete_document(document_id)


def list_versions(repository, user_id: int, current_space_id: int, document_id: int) -> list[DocumentVersion]:
    get_visible_document(repository, user_id, current_space_id, document_id)
    return repository.list_document_versions(document_id)


def restore_version(
    repository,
    user_id: int,
    current_space_id: int,
    document_id: int,
    version_no: int,
) -> Document:
    get_visible_document(repository, user_id, current_space_id, document_id)
    if repository.get_document_version(document_id, version_no) is None:
        raise VersionNotFoundError("version not found")
    return repository.restore_document_version(document_id, version_no, editor_id=user_id)
