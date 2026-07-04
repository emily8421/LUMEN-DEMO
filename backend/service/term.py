"""Term management service for Sprint-5 degraded demo."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Term, TermStatus
from backend.service.permission import can_view_document
from backend.service.space import SpaceAccessError, ensure_space_access


class TermAccessError(Exception):
    pass


class TermNotFoundError(Exception):
    pass


class TermValidationError(Exception):
    pass


@dataclass(frozen=True)
class TermWrite:
    term: str
    definition: str
    aliases: list[str]
    status: TermStatus
    source_document_id: int | None = None


def list_visible_terms(
    repository,
    user_id: int,
    current_space_id: int,
    query: str = "",
    status: TermStatus | None = None,
) -> list[Term]:
    _ensure_space_member(repository, user_id, current_space_id)
    normalized_query = query.strip().lower()
    terms = [
        term
        for term in repository.list_terms()
        if term.space_id in {None, current_space_id}
        and (status is None or term.status == status)
        and _matches_query(term, normalized_query)
    ]
    return _dedupe_space_priority(terms, current_space_id)


def create_term(repository, user_id: int, current_space_id: int, request: TermWrite) -> Term:
    _ensure_space_member(repository, user_id, current_space_id)
    _validate_write_request(repository, user_id, current_space_id, request)
    return repository.create_term(
        space_id=current_space_id,
        term=request.term.strip(),
        definition=request.definition.strip(),
        aliases=_normalize_aliases(request.aliases),
        owner_id=user_id,
        status=request.status,
        source_document_id=request.source_document_id,
    )


def get_visible_term(repository, user_id: int, current_space_id: int, term_id: int) -> Term:
    _ensure_space_member(repository, user_id, current_space_id)
    term = repository.get_term(term_id)
    if term is None or term.space_id not in {None, current_space_id}:
        raise TermNotFoundError("term not found")
    return term


def update_term(repository, user_id: int, current_space_id: int, term_id: int, request: TermWrite) -> Term:
    existing_term = get_visible_term(repository, user_id, current_space_id, term_id)
    if existing_term.space_id is None:
        raise TermAccessError("global terms are read-only in Phase1 demo")
    _validate_write_request(repository, user_id, current_space_id, request)
    return repository.update_term(
        term_id=term_id,
        term=request.term.strip(),
        definition=request.definition.strip(),
        aliases=_normalize_aliases(request.aliases),
        status=request.status,
        source_document_id=request.source_document_id,
    )


def delete_term(repository, user_id: int, current_space_id: int, term_id: int) -> None:
    existing_term = get_visible_term(repository, user_id, current_space_id, term_id)
    if existing_term.space_id is None:
        raise TermAccessError("global terms are read-only in Phase1 demo")
    repository.delete_term(term_id)


def find_matching_terms(repository, current_space_id: int, text: str) -> list[Term]:
    normalized_text = text.lower()
    matching_terms = [
        term
        for term in repository.list_terms()
        if term.space_id in {None, current_space_id}
        and _term_tokens(term)
        and any(token.lower() in normalized_text for token in _term_tokens(term))
    ]
    return _dedupe_space_priority(matching_terms, current_space_id)


def _ensure_space_member(repository, user_id: int, current_space_id: int) -> None:
    try:
        ensure_space_access(user_id, current_space_id, repository.list_memberships())
    except SpaceAccessError as exc:
        raise TermAccessError("space access denied") from exc


def _validate_write_request(repository, user_id: int, current_space_id: int, request: TermWrite) -> None:
    if not request.term.strip():
        raise TermValidationError("term is required")
    if not request.definition.strip():
        raise TermValidationError("definition is required")
    if request.source_document_id is not None:
        document = repository.get_document(request.source_document_id)
        if document is None or not can_view_document(user_id, current_space_id, document, repository.list_memberships()):
            raise TermValidationError("source document not found")


def _matches_query(term: Term, normalized_query: str) -> bool:
    if not normalized_query:
        return True
    return any(normalized_query in token.lower() for token in _term_tokens(term))


def _term_tokens(term: Term) -> list[str]:
    return [term.term, *term.aliases, term.definition]


def _normalize_aliases(aliases: list[str]) -> list[str]:
    normalized_aliases: list[str] = []
    for alias in aliases:
        normalized_alias = alias.strip()
        if normalized_alias and normalized_alias not in normalized_aliases:
            normalized_aliases.append(normalized_alias)
    return normalized_aliases


def _dedupe_space_priority(terms: list[Term], current_space_id: int) -> list[Term]:
    sorted_terms = sorted(terms, key=lambda term: (term.space_id != current_space_id, term.term, term.id))
    deduped_terms: list[Term] = []
    seen_terms: set[str] = set()
    for term in sorted_terms:
        normalized_term = term.term.lower()
        if normalized_term in seen_terms:
            continue
        seen_terms.add(normalized_term)
        deduped_terms.append(term)
    return deduped_terms
