"""Permission predicates shared by lists, search, and RAG candidate selection."""

from __future__ import annotations

from collections.abc import Iterable

from backend.model.entities import Document, DocumentPermission, SpaceMember


def is_space_member(user_id: int, space_id: int, memberships: Iterable[SpaceMember]) -> bool:
    return any(
        membership.user_id == user_id and membership.space_id == space_id
        for membership in memberships
    )


def can_access_space(user_id: int, space_id: int, memberships: Iterable[SpaceMember]) -> bool:
    return is_space_member(user_id, space_id, memberships)


def can_view_document(user_id: int, current_space_id: int, document: Document, memberships: Iterable[SpaceMember]) -> bool:
    if document.space_id != current_space_id:
        return False

    if not is_space_member(user_id, current_space_id, memberships):
        return False

    if document.permission == DocumentPermission.PRIVATE:
        return document.owner_id == user_id

    return document.permission in {DocumentPermission.TEAM, DocumentPermission.EXTERNAL}


def filter_visible_documents(
    user_id: int,
    current_space_id: int,
    documents: Iterable[Document],
    memberships: Iterable[SpaceMember],
) -> list[Document]:
    membership_list = list(memberships)
    return [
        document
        for document in documents
        if can_view_document(user_id, current_space_id, document, membership_list)
    ]


def visible_document_where_clause(user_id_param: str = "user_id", space_id_param: str = "space_id") -> str:
    return (
        f"space_id = :{space_id_param} "
        f"AND (permission <> 'private' OR owner_id = :{user_id_param})"
    )
