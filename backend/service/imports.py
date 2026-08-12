"""Degraded Sprint-3 import service for pre-extracted text files."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from backend.model.entities import DocumentPermission, ImportJob
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.service.chunking import clean_text, split_text_into_chunks
from backend.service.document import DocumentCreate, create_document, sync_document_wikilinks
from backend.service.permission import can_view_document
from backend.service.space import ensure_space_access


SUPPORTED_TEXT_EXTENSIONS = {".md", ".markdown", ".txt"}


class ImportValidationError(ApiError):
    """上传文件无法被降级导入器处理（API 映射 4220）。

    空间访问被拒（4003）不再经本异常承载：直接冒泡 space 域 ``SpaceAccessError``
    （B-5 迁移后为 ApiError），消除 msg 判断二义（07 契约 API-011/029 含 4003）。
    """

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


@dataclass(frozen=True)
class ImportTextRequest:
    filename: str
    content: bytes
    title: str | None = None
    permission: DocumentPermission = DocumentPermission.TEAM


@dataclass(frozen=True)
class ImportResult:
    import_job: ImportJob
    parsed_doc_id: int
    chunk_count: int


@dataclass(frozen=True)
class BatchImportFileRequest:
    filename: str
    content: bytes
    relative_path: str | None = None


@dataclass(frozen=True)
class BatchImportRequest:
    files: list[BatchImportFileRequest]
    permission: DocumentPermission = DocumentPermission.TEAM
    conflict_policy: str = "skip"
    preserve_structure: bool = True


@dataclass(frozen=True)
class BatchImportItemResult:
    filename: str
    relative_path: str
    title: str
    status: str
    import_id: int | None = None
    parsed_doc_id: int | None = None
    folder_id: int | None = None
    chunk_count: int = 0
    error: str | None = None


@dataclass(frozen=True)
class BatchImportResult:
    batch_id: str
    total: int
    success_count: int
    failed_count: int
    skipped_count: int
    items: list[BatchImportItemResult]


def import_extracted_text(repository: RepositoryProtocol, user_id: int, current_space_id: int, request: ImportTextRequest) -> ImportResult:
    # space access 直接冒泡 SpaceAccessError（4003，07 契约 API-011）；不再转 ImportValidationError 造成 msg 判断二义。
    ensure_space_access(user_id, current_space_id, repository.list_memberships())

    _validate_filename(request.filename)
    source_text = _decode_text(request.content)
    cleaned_text = clean_text(source_text)
    if not cleaned_text:
        raise ImportValidationError("uploaded text is empty")

    import_job = repository.create_import_job(current_space_id, request.filename, user_id)
    title = _resolve_title(request.filename, request.title)

    try:
        document = create_document(
            repository=repository,
            user_id=user_id,
            current_space_id=current_space_id,
            request=DocumentCreate(
                title=title,
                content_md=cleaned_text,
                permission=request.permission,
            ),
        )
        chunks = repository.replace_document_chunks(document.id, split_text_into_chunks(cleaned_text))
        completed_job = repository.complete_import_job(import_job.id, document.id, len(chunks))
    except Exception as exc:
        repository.fail_import_job(import_job.id, str(exc))
        raise

    return ImportResult(
        import_job=completed_job,
        parsed_doc_id=document.id,
        chunk_count=len(chunks),
    )


def import_batch(repository: RepositoryProtocol, user_id: int, current_space_id: int, request: BatchImportRequest) -> BatchImportResult:
    # space access 直接冒泡 SpaceAccessError（4003，07 契约 API-029）；不再转 ImportValidationError 造成 msg 判断二义。
    memberships = repository.list_memberships()
    ensure_space_access(user_id, current_space_id, memberships)

    if not request.files:
        raise ImportValidationError("at least one file is required")
    if request.conflict_policy != "skip":
        raise ImportValidationError("unsupported conflict policy")

    items: list[BatchImportItemResult] = []
    for file_request in request.files:
        source_filename = _resolve_batch_source_filename(file_request.filename, file_request.relative_path)
        relative_path = _safe_relative_path(source_filename)
        folder_id: int | None = None
        title = _resolve_batch_title(relative_path, preserve_structure=request.preserve_structure)

        try:
            _validate_filename(source_filename)
            _ensure_importable_content(file_request.content)
            if request.preserve_structure:
                folder_id = _ensure_folder_path(
                    repository,
                    user_id=user_id,
                    current_space_id=current_space_id,
                    relative_path=relative_path,
                )
            if _document_title_exists(
                repository,
                user_id,
                current_space_id,
                title,
                memberships,
                folder_id=folder_id if request.preserve_structure else None,
                scoped_to_folder=request.preserve_structure,
            ):
                items.append(_skipped_item(file_request.filename, relative_path, title, "document title already exists"))
                continue

            result = import_extracted_text(
                repository=repository,
                user_id=user_id,
                current_space_id=current_space_id,
                request=ImportTextRequest(
                    filename=source_filename,
                    content=file_request.content,
                    title=title,
                    permission=request.permission,
                ),
            )
            if request.preserve_structure:
                repository.set_document_folder(result.parsed_doc_id, folder_id)
            items.append(
                BatchImportItemResult(
                    filename=file_request.filename,
                    relative_path=relative_path,
                    title=title,
                    status="done",
                    import_id=result.import_job.id,
                    parsed_doc_id=result.parsed_doc_id,
                    folder_id=folder_id,
                    chunk_count=result.chunk_count,
                )
            )
        except ImportValidationError as exc:
            items.append(_failed_item(file_request.filename, relative_path, title, str(exc)))
        except Exception as exc:
            items.append(_failed_item(file_request.filename, relative_path, title, str(exc)))

    # REQ-018 模式 A: 批末回扫整个 space 的 wikilink，补建「先导入引用后导入 / 跨批上传」
    # 残留的未解析链接。sync_document_wikilinks 幂等 replace（仅刷该源文档 wikilink 行，
    # 保留 manual 链接），重复调用安全；list_documents 非按 space 限定，故按 current_space_id 过滤。
    for existing in repository.list_documents():
        if existing.space_id == current_space_id:
            sync_document_wikilinks(repository, existing)

    return _batch_result(items)


def _validate_filename(filename: str) -> None:
    if not filename.strip():
        raise ImportValidationError("filename is required")
    extension = _file_extension(filename)
    if extension not in SUPPORTED_TEXT_EXTENSIONS:
        raise ImportValidationError("only pre-extracted .txt or .md files are supported in Sprint-3 degraded mode")


def _decode_text(content: bytes) -> str:
    if not content:
        raise ImportValidationError("uploaded text is empty")
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ImportValidationError("uploaded text must be UTF-8 encoded") from exc


def _resolve_title(filename: str, title: str | None) -> str:
    normalized_title = title.strip() if title else ""
    if normalized_title:
        return normalized_title
    safe_path = _safe_relative_path(filename)
    extension = _file_extension(safe_path)
    return safe_path[: -len(extension)] if extension else safe_path


def _file_extension(filename: str) -> str:
    base_name = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    if "." not in base_name:
        return ""
    return "." + base_name.rsplit(".", maxsplit=1)[-1].lower()


def _resolve_batch_source_filename(filename: str, relative_path: str | None) -> str:
    safe_relative_path = _safe_relative_path(relative_path or "")
    if safe_relative_path:
        return safe_relative_path
    return _safe_relative_path(filename)


def _resolve_batch_title(relative_path: str, preserve_structure: bool) -> str:
    if not preserve_structure:
        return _resolve_title(relative_path, None)
    filename = _split_relative_file_path(relative_path)[1]
    return _resolve_title(filename, None)


def _safe_relative_path(path: str) -> str:
    normalized_path = path.replace("\\", "/").strip()
    parts = [part.strip() for part in normalized_path.split("/")]
    safe_parts = [part for part in parts if part and part not in {".", ".."}]
    return "/".join(safe_parts)


def _split_relative_file_path(relative_path: str) -> tuple[list[str], str]:
    parts = [part for part in _safe_relative_path(relative_path).split("/") if part]
    if not parts:
        return [], ""
    return parts[:-1], parts[-1]


def _ensure_importable_content(content: bytes) -> None:
    cleaned_text = clean_text(_decode_text(content))
    if not cleaned_text:
        raise ImportValidationError("uploaded text is empty")


def _ensure_folder_path(repository: RepositoryProtocol, user_id: int, current_space_id: int, relative_path: str) -> int | None:
    directory_parts = _split_relative_file_path(relative_path)[0]
    parent_id: int | None = None
    for name in directory_parts:
        existing = repository.find_folder_by_name(current_space_id, parent_id, name)
        if existing is not None:
            parent_id = existing.id
            continue
        created = repository.create_folder(current_space_id, parent_id, name, created_by=user_id)
        parent_id = created.id
    return parent_id


def _document_title_exists(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    title: str,
    memberships,
    folder_id: int | None = None,
    scoped_to_folder: bool = False,
) -> bool:
    return any(
        document.title == title
        and (not scoped_to_folder or document.folder_id == folder_id)
        and can_view_document(user_id, current_space_id, document, memberships)
        for document in repository.list_documents()
    )


def _batch_result(items: list[BatchImportItemResult]) -> BatchImportResult:
    first_import_id = next((item.import_id for item in items if item.import_id is not None), None)
    batch_id = str(first_import_id) if first_import_id is not None else uuid4().hex
    return BatchImportResult(
        batch_id=batch_id,
        total=len(items),
        success_count=sum(1 for item in items if item.status == "done"),
        failed_count=sum(1 for item in items if item.status == "failed"),
        skipped_count=sum(1 for item in items if item.status == "skipped"),
        items=items,
    )


def _failed_item(filename: str, relative_path: str, title: str, error: str) -> BatchImportItemResult:
    return BatchImportItemResult(
        filename=filename,
        relative_path=relative_path,
        title=title,
        status="failed",
        error=error,
    )


def _skipped_item(filename: str, relative_path: str, title: str, error: str) -> BatchImportItemResult:
    return BatchImportItemResult(
        filename=filename,
        relative_path=relative_path,
        title=title,
        status="skipped",
        error=error,
    )
