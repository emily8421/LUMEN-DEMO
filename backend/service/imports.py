"""Degraded Sprint-3 import service for pre-extracted text files."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import DocumentPermission, ImportJob
from backend.service.document import DocumentCreate, create_document
from backend.service.space import SpaceAccessError, ensure_space_access


SUPPORTED_TEXT_EXTENSIONS = {".md", ".markdown", ".txt"}
MAX_CHUNK_CHARS = 900
CHUNK_OVERLAP_CHARS = 120


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


def clean_text(source_text: str) -> str:
    lines = [line.rstrip() for line in source_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


def split_text_into_chunks(text: str, max_chars: int = MAX_CHUNK_CHARS, overlap_chars: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    if max_chars <= 0:
        raise ValueError("max_chars must be positive")
    if overlap_chars < 0 or overlap_chars >= max_chars:
        raise ValueError("overlap_chars must be smaller than max_chars")

    paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
    if not paragraphs:
        paragraphs = [text.strip()]

    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        candidate = paragraph if not current else f"{current}\n\n{paragraph}"
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.extend(_split_long_text(current, max_chars, overlap_chars))
        current = paragraph

    if current:
        chunks.extend(_split_long_text(current, max_chars, overlap_chars))

    return chunks


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


def _split_long_text(text: str, max_chars: int, overlap_chars: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    step = max_chars - overlap_chars
    while start < len(text):
        chunk = text[start : start + max_chars].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks
