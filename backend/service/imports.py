"""Degraded Sprint-3 import service for pre-extracted text files."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from backend.model.entities import DocumentPermission, ImportJob
from backend.service.chunking import clean_text, split_text_into_chunks
from backend.service.document import DocumentCreate, create_document
from backend.service.permission import can_view_document
from backend.service.space import SpaceAccessError, ensure_space_access


SUPPORTED_TEXT_EXTENSIONS = {".md", ".markdown", ".txt"}


class ImportValidationError(Exception):
    """Raised when an uploaded file cannot be processed by the degraded importer."""


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


@dataclass(frozen=True)
class BatchImportItemResult:
    filename: str
    relative_path: str
    title: str
    status: str
    import_id: int | None = None
    parsed_doc_id: int | None = None
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


def import_extracted_text(repository, user_id: int, current_space_id: int, request: ImportTextRequest) -> ImportResult:
    try:
        ensure_space_access(user_id, current_space_id, repository.list_memberships())
    except SpaceAccessError as exc:
        raise ImportValidationError("space access denied") from exc

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


def import_batch(repository, user_id: int, current_space_id: int, request: BatchImportRequest) -> BatchImportResult:
    try:
        memberships = repository.list_memberships()
        ensure_space_access(user_id, current_space_id, memberships)
    except SpaceAccessError as exc:
        raise ImportValidationError("space access denied") from exc

    if not request.files:
        raise ImportValidationError("at least one file is required")
    if request.conflict_policy != "skip":
        raise ImportValidationError("unsupported conflict policy")

    items: list[BatchImportItemResult] = []
    for file_request in request.files:
        source_filename = _resolve_batch_source_filename(file_request.filename, file_request.relative_path)
        relative_path = _safe_relative_path(source_filename)
        title = _resolve_title(source_filename, None)

        try:
            _validate_filename(source_filename)
            if _document_title_exists(repository, user_id, current_space_id, title, memberships):
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
            items.append(
                BatchImportItemResult(
                    filename=file_request.filename,
                    relative_path=relative_path,
                    title=title,
                    status="done",
                    import_id=result.import_job.id,
                    parsed_doc_id=result.parsed_doc_id,
                    chunk_count=result.chunk_count,
                )
            )
        except ImportValidationError as exc:
            items.append(_failed_item(file_request.filename, relative_path, title, str(exc)))
        except Exception as exc:
            items.append(_failed_item(file_request.filename, relative_path, title, str(exc)))

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


def _safe_relative_path(path: str) -> str:
    normalized_path = path.replace("\\", "/").strip()
    parts = [part.strip() for part in normalized_path.split("/")]
    safe_parts = [part for part in parts if part and part not in {".", ".."}]
    return "/".join(safe_parts)


def _document_title_exists(repository, user_id: int, current_space_id: int, title: str, memberships) -> bool:
    return any(
        document.title == title and can_view_document(user_id, current_space_id, document, memberships)
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
