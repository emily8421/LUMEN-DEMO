"""Term management service for Sprint-5 degraded demo."""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import Term, TermStatus
from backend.model.error_codes import ApiError, ErrorCode
from backend.service.permission import can_view_document
from backend.service.space import SpaceAccessError, ensure_space_access


class TermAccessError(ApiError):
    """空间 / 资源访问被拒（API 映射 4003）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


class TermNotFoundError(ApiError):
    """术语不存在或不属于当前空间（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


class TermValidationError(ApiError):
    """术语请求字段非法 / 源文档不可见（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


@dataclass(frozen=True)
class TermWrite:
    term: str
    definition: str
    aliases: list[str]
    status: TermStatus
    source_document_id: int | None = None
    # 术语管理增强（REQ-036 领域树，migration 017）。
    category_id: int | None = None
    category: str | None = None
    source: str | None = None


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
    _validate_category(repository, current_space_id, request.category_id)
    return repository.create_term(
        space_id=current_space_id,
        term=request.term.strip(),
        definition=request.definition.strip(),
        aliases=_normalize_aliases(request.aliases),
        owner_id=user_id,
        status=request.status,
        source_document_id=request.source_document_id,
        category_id=request.category_id,
        category=request.category.strip() if request.category else None,
        source=request.source.strip() if request.source else None,
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
    _validate_category(repository, current_space_id, request.category_id)
    return repository.update_term(
        term_id=term_id,
        term=request.term.strip(),
        definition=request.definition.strip(),
        aliases=_normalize_aliases(request.aliases),
        status=request.status,
        source_document_id=request.source_document_id,
        category_id=request.category_id,
        category=request.category.strip() if request.category else None,
        source=request.source.strip() if request.source else None,
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


def _validate_category(repository, current_space_id: int, category_id: int | None) -> None:
    """校验 category_id（若提供）属于当前空间的领域树节点；跨空间→4220。"""
    if category_id is None:
        return
    category = repository.get_term_category(category_id)
    if category is None or category.space_id != current_space_id:
        raise TermValidationError("category not found in this space")


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
