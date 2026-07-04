"""Degraded Sprint-3 import service for pre-extracted text files."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import DocumentPermission, ImportJob
from backend.service.chunking import clean_text, split_text_into_chunks
from backend.service.document import DocumentCreate, create_document
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
    base_name = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    extension = _file_extension(base_name)
    return base_name[: -len(extension)] if extension else base_name


def _file_extension(filename: str) -> str:
    base_name = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    if "." not in base_name:
        return ""
    return "." + base_name.rsplit(".", maxsplit=1)[-1].lower()
