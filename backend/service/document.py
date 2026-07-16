"""Document CRUD and version service for Sprint-2."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Document, DocumentPermission, DocumentVersion, SpaceMember
from backend.service.chunking import clean_text, split_text_into_chunks
from backend.service.permission import can_write_document, can_view_document, filter_visible_documents, is_space_member


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

    document = repository.create_document(
        space_id=current_space_id,
        title=request.title,
        content_md=request.content_md,
        owner_id=user_id,
        permission=request.permission,
    )
    sync_document_chunks(repository, document)
    return document


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
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)
    updated = repository.update_document(
        document_id=document_id,
        title=request.title,
        content_md=request.content_md,
        permission=request.permission,
        editor_id=user_id,
    )
    sync_document_chunks(repository, updated)
    return updated


def delete_document(repository, user_id: int, current_space_id: int, document_id: int) -> None:
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)
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
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)
    if repository.get_document_version(document_id, version_no) is None:
        raise VersionNotFoundError("version not found")
    restored = repository.restore_document_version(document_id, version_no, editor_id=user_id)
    sync_document_chunks(repository, restored)
    return restored


def sync_document_chunks(repository, document: Document) -> None:
    cleaned_text = clean_text(document.content_md)
    chunk_texts = split_text_into_chunks(cleaned_text) if cleaned_text else []
    repository.replace_document_chunks(document.id, chunk_texts)


def _ensure_can_write(repository, user_id: int, current_space_id: int, document: Document) -> None:
    if not can_write_document(user_id, current_space_id, document, repository.list_memberships()):
        raise DocumentAccessError("no write permission on external document")


def ensure_documents_indexed(repository) -> int:
    """Sprint-12②：回填无分块文档的 chunks（+ embedding）。

    ``migrations/005_sprint8_seed_demo.sql`` 直接 INSERT 文档不经服务层，导致 seed
    demo 文档开箱无 chunks / embedding、搜不到。本函数在启动时扫描全部文档，对无
    chunks 的逐篇调 ``sync_document_chunks`` 补齐；幂等（已索引的跳过）。

    返回本次回填的文档数。单文档回填失败不阻塞其他文档或启动（embedding 不可用时
    ``replace_document_chunks`` 已降级——chunks 仍写入、向量 NULL、退回关键词召回）。
    """
    indexed = 0
    for document in repository.list_documents():
        if repository.list_document_chunks(document.id):
            continue
        try:
            sync_document_chunks(repository, document)
            indexed += 1
        except Exception:
            continue
    return indexed
