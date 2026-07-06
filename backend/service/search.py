"""Degraded Sprint-4A search service over in-memory document chunks."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Document, DocumentChunk

from backend.service.permission import filter_visible_documents


DEFAULT_PAGE_SIZE = 20
MAX_SNIPPET_CHARS = 160


class SearchValidationError(Exception):
    """Raised when a search request is invalid."""


@dataclass(frozen=True)
class SearchResult:
    doc_id: int
    title: str
    snippet: str
    chunk_id: int
    ordinal: int


@dataclass(frozen=True)
class SearchPage:
    items: list[SearchResult]
    total: int
    page: int


def search_documents(
    repository,
    user_id: int,
    current_space_id: int,
    query: str,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> SearchPage:
    normalized_query = _normalize_query(query)
    if page < 1:
        raise SearchValidationError("page must be greater than or equal to 1")
    if page_size < 1:
        raise SearchValidationError("page_size must be greater than or equal to 1")

    visible_documents = filter_visible_documents(
        user_id=user_id,
        current_space_id=current_space_id,
        documents=repository.list_documents(),
        memberships=repository.list_memberships(),
    )
    documents_by_id = {document.id: document for document in visible_documents}
    chunks = repository.list_all_document_chunks()
    matches: list[SearchResult] = []
    matched_document_ids: set[int] = set()
    for chunk in chunks:
        document = documents_by_id.get(chunk.document_id)
        if document is None or not _chunk_matches(chunk, normalized_query):
            continue
        matched_document_ids.add(document.id)
        matches.append(
            SearchResult(
                doc_id=document.id,
                title=document.title,
                snippet=_build_snippet(chunk.text, normalized_query),
                chunk_id=chunk.id,
                ordinal=chunk.ordinal,
            )
        )
    for document in visible_documents:
        if document.id in matched_document_ids or not _title_matches(document, normalized_query):
            continue
        matches.append(
            SearchResult(
                doc_id=document.id,
                title=document.title,
                snippet=f"标题匹配：{document.title}",
                chunk_id=0,
                ordinal=0,
            )
        )

    offset = (page - 1) * page_size
    return SearchPage(items=matches[offset : offset + page_size], total=len(matches), page=page)


def _normalize_query(query: str) -> str:
    normalized_query = query.strip().lower()
    if not normalized_query:
        raise SearchValidationError("query is required")
    return normalized_query


def _chunk_matches(chunk: DocumentChunk, normalized_query: str) -> bool:
    return normalized_query in chunk.text.lower()


def _title_matches(document: Document, normalized_query: str) -> bool:
    return normalized_query in document.title.lower()


def _build_snippet(text: str, normalized_query: str) -> str:
    normalized_text = text.lower()
    match_index = normalized_text.find(normalized_query)
    if match_index < 0:
        return _truncate(text.strip(), MAX_SNIPPET_CHARS)

    half_window = max((MAX_SNIPPET_CHARS - len(normalized_query)) // 2, 0)
    start = max(match_index - half_window, 0)
    end = min(start + MAX_SNIPPET_CHARS, len(text))
    start = max(end - MAX_SNIPPET_CHARS, 0)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"…{snippet}"
    if end < len(text):
        snippet = f"{snippet}…"
    return snippet


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return f"{text[: max_chars - 1].rstrip()}…"
