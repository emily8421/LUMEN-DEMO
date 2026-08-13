"""Document CRUD and version service for Sprint-2."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

from backend.model.entities import DocLinkDraft, Document, DocumentPermission, DocumentVersion
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.repository.uow import unit_of_work
from backend.service.chunking import clean_text, split_text_into_chunks
from backend.service.permission import can_write_document, can_view_document, is_space_member

logger = logging.getLogger(__name__)


class DocumentAccessError(ApiError):
    """文档写权限被拒（API 映射 4003）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


class DocumentNotFoundError(ApiError):
    """文档不存在或不可见（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


class DocumentValidationError(ApiError):
    """文档请求字段非法 / 目标文件夹不符（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


class VersionNotFoundError(ApiError):
    """文档版本不存在（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


@dataclass(frozen=True)
class DocumentCreate:
    title: str
    content_md: str
    permission: DocumentPermission
    # ⑥：新建时指定所属文件夹（可空=根目录）；服务端校验目标文件夹属于当前空间。
    folder_id: int | None = None


@dataclass(frozen=True)
class DocumentUpdate:
    title: str
    content_md: str
    permission: DocumentPermission


@dataclass(frozen=True)
class DocumentMove:
    folder_id: int | None


def create_document(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    request: DocumentCreate,
) -> Document:
    memberships = repository.list_memberships()
    if not is_space_member(user_id, current_space_id, memberships):
        raise DocumentAccessError("space access denied")

    # ⑥：新建带 folder_id 时校验目标文件夹属于当前空间（与 move_document_to_folder 同口径）。
    if request.folder_id is not None:
        folder = repository.get_folder(request.folder_id)
        if folder is None or folder.space_id != current_space_id:
            raise DocumentValidationError("target folder not found in this space")

    # 写路径：主表 + chunks + wikilinks 三写步共享一个事务（CQ-P1-003 Slice B）；
    # 权限校验读在事务外，service→service 嵌套（imports → create_document）时 join 外层事务。
    with unit_of_work(repository):
        document = repository.create_document(
            space_id=current_space_id,
            title=request.title,
            content_md=request.content_md,
            owner_id=user_id,
            permission=request.permission,
            folder_id=request.folder_id,
        )
        sync_document_chunks(repository, document)
        sync_document_wikilinks(repository, document)
    return document


def get_visible_document(repository: RepositoryProtocol, user_id: int, current_space_id: int, document_id: int) -> Document:
    document = repository.get_document(document_id)
    if document is None:
        raise DocumentNotFoundError("document not found")

    if not can_view_document(user_id, current_space_id, document, repository.list_memberships()):
        raise DocumentNotFoundError("document not found")

    return document


def update_document(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    document_id: int,
    request: DocumentUpdate,
) -> Document:
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)
    # 写路径：主表 + chunks + wikilinks 三写步共享一个事务（CQ-P1-003 Slice B）。
    with unit_of_work(repository):
        updated = repository.update_document(
            document_id=document_id,
            title=request.title,
            content_md=request.content_md,
            permission=request.permission,
            editor_id=user_id,
        )
        sync_document_chunks(repository, updated)
        sync_document_wikilinks(repository, updated)
    return updated


def move_document_to_folder(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    document_id: int,
    request: DocumentMove,
) -> Document:
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)

    if request.folder_id is not None:
        folder = repository.get_folder(request.folder_id)
        if folder is None or folder.space_id != current_space_id:
            raise DocumentValidationError("target folder not found in this space")

    if document.folder_id == request.folder_id:
        return document

    repository.set_document_folder(document_id, request.folder_id)
    moved = repository.get_document(document_id)
    if moved is None:
        raise DocumentNotFoundError("document not found")
    return moved


def delete_document(repository: RepositoryProtocol, user_id: int, current_space_id: int, document_id: int) -> None:
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)
    repository.delete_document(document_id)


def list_versions(repository: RepositoryProtocol, user_id: int, current_space_id: int, document_id: int) -> list[DocumentVersion]:
    get_visible_document(repository, user_id, current_space_id, document_id)
    return repository.list_document_versions(document_id)


def restore_version(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    document_id: int,
    version_no: int,
) -> Document:
    document = get_visible_document(repository, user_id, current_space_id, document_id)
    _ensure_can_write(repository, user_id, current_space_id, document)
    if repository.get_document_version(document_id, version_no) is None:
        raise VersionNotFoundError("version not found")
    # 写路径：恢复主表 + chunks + wikilinks 三写步共享一个事务（CQ-P1-003 Slice B）。
    with unit_of_work(repository):
        restored = repository.restore_document_version(document_id, version_no, editor_id=user_id)
        sync_document_chunks(repository, restored)
        sync_document_wikilinks(repository, restored)
    return restored


def sync_document_chunks(repository: RepositoryProtocol, document: Document) -> None:
    cleaned_text = clean_text(document.content_md)
    chunk_texts = split_text_into_chunks(cleaned_text) if cleaned_text else []
    repository.replace_document_chunks(document.id, chunk_texts)


def _ensure_can_write(repository: RepositoryProtocol, user_id: int, current_space_id: int, document: Document) -> None:
    if not can_write_document(user_id, current_space_id, document, repository.list_memberships()):
        raise DocumentAccessError("no write permission on external document")


def ensure_documents_indexed(repository: RepositoryProtocol) -> int:
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
        except Exception as exc:
            logger.warning("sync_document_chunks failed for document %s: %s", document.id, exc)
            continue
    return indexed


_WIKILINK_PATTERN = re.compile(r"\[\[([^\[\]|#]+?)(?:[|#][^\[\]]*)?\]\]")


def extract_wikilinks(content_md: str) -> list[str]:
    """提取 Markdown 正文中的 ``[[target]]`` wikilink 目标文本（保序；剥离 ``|alias`` 与 ``#anchor``）。"""
    return _WIKILINK_PATTERN.findall(content_md)


def sync_document_wikilinks(repository: RepositoryProtocol, document: Document) -> None:
    """解析正文 ``[[target]]``，按标题匹配当前空间文档，幂等重建该文档的 wikilink 索引。

    命中且非自链 → resolved；未命中 → unresolved（target_document_id=None）；
    自链（``[[自己]]``）跳过。manual 链接不受影响（replace 只删 wikilink 类型）。
    """
    seen: set[str] = set()
    drafts: list[DocLinkDraft] = []
    for raw_target in extract_wikilinks(document.content_md):
        target_text = raw_target.strip()
        if not target_text or target_text in seen:
            continue
        seen.add(target_text)
        target_id = repository.find_document_id_by_title(document.space_id, target_text)
        if target_id == document.id:
            continue  # 自链跳过（DB CHECK source != target）
        if target_id is not None:
            drafts.append(
                DocLinkDraft(target_document_id=target_id, target_title=target_text, link_text=target_text, status="resolved")
            )
        else:
            drafts.append(
                DocLinkDraft(target_document_id=None, target_title=target_text, link_text=target_text, status="unresolved")
            )
    repository.replace_document_wikilinks(document.space_id, document.id, drafts)
