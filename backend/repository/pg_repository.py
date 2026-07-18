"""PostgreSQL repository implementing the same interface as DemoRepository.

task-008 T3: replace the in-memory backing store with PostgreSQL while keeping
the method signatures, return types, ordering and exception behaviour identical
to ``DemoRepository``. Service / API layers are duck-typed on this interface, so
they need no changes (the singleton pointer is switched in T5, not here).

Tables are created by migrations 001-004 (db.init_db). This module is read/write
only; embedding is left NULL (filled in T4) and ts_vector is owned by a DB trigger.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, func, select, text as sql_text

from backend.model.entities import (
    DocLink,
    DocLinkDraft,
    Document,
    DocumentChunk,
    DocumentPermission,
    DocumentVersion,
    ImportJob,
    Space,
    SpaceMember,
    SpaceRole,
    Tag,
    TagLink,
    QuickEntry,
    Term,
    TermStatus,
    User,
)
from backend.model.orm import (
    DocLinkORM,
    DocumentChunkORM,
    DocumentORM,
    DocumentVersionORM,
    ImportJobORM,
    QuickEntryORM,
    SpaceMemberORM,
    SpaceORM,
    TagLinkORM,
    TagORM,
    TermORM,
    UserORM,
)
from backend.service.db import SessionLocal


# --- ORM row -> frozen dataclass entity converters ---

def _dt_iso(dt: datetime | None) -> str:
    return dt.isoformat() if dt is not None else ""


def _to_user(r: UserORM) -> User:
    return User(id=r.id, external_id=r.external_id, name=r.name, created_at=_dt_iso(r.created_at))


def _to_space(r: SpaceORM) -> Space:
    return Space(id=r.id, code=r.code, name=r.name, created_at=_dt_iso(r.created_at))


def _to_member(r: SpaceMemberORM) -> SpaceMember:
    return SpaceMember(user_id=r.user_id, space_id=r.space_id, role=SpaceRole(r.role))


def _to_document(r: DocumentORM) -> Document:
    return Document(
        id=r.id,
        space_id=r.space_id,
        title=r.title,
        content_md=r.content_md,
        owner_id=r.owner_id,
        permission=DocumentPermission(r.permission),
        type=r.type,
        current_version=r.current_version,
        created_at=_dt_iso(r.created_at),
        updated_at=_dt_iso(r.updated_at),
    )


def _to_version(r: DocumentVersionORM) -> DocumentVersion:
    return DocumentVersion(
        id=r.id,
        document_id=r.document_id,
        version_no=r.version_no,
        content_md=r.content_md,
        editor_id=r.editor_id,
        created_at=_dt_iso(r.created_at),
    )


def _to_import(r: ImportJobORM) -> ImportJob:
    return ImportJob(
        id=r.id,
        space_id=r.space_id,
        source_filename=r.source_filename,
        status=r.status,
        created_by=r.created_by,
        parsed_doc_id=r.parsed_doc_id,
        chunk_count=r.chunk_count,
        error=r.error,
        mime=r.mime,
        created_at=_dt_iso(r.created_at),
    )


def _to_chunk(r: DocumentChunkORM) -> DocumentChunk:
    return DocumentChunk(
        id=r.id,
        document_id=r.document_id,
        ordinal=r.ordinal,
        text=r.text,
        embedding=list(r.embedding) if r.embedding is not None else None,
        ts_vector=None,  # maintained by DB trigger; T3 does not read it
    )


def _to_term(r: TermORM) -> Term:
    return Term(
        id=r.id,
        space_id=r.space_id,
        term=r.term,
        definition=r.definition,
        aliases=list(r.aliases or []),
        owner_id=r.owner_id,
        status=TermStatus(r.status),
        source_document_id=r.source_document_id,
        created_at=_dt_iso(r.created_at),
        updated_at=_dt_iso(r.updated_at),
    )


def _to_doc_link(r: DocLinkORM) -> DocLink:
    return DocLink(
        id=r.id,
        space_id=r.space_id,
        source_document_id=r.source_document_id,
        target_document_id=r.target_document_id,
        target_title=r.target_title,
        link_text=r.link_text,
        link_type=r.link_type,
        status=r.status,
        created_at=_dt_iso(r.created_at),
        updated_at=_dt_iso(r.updated_at),
    )


def _to_tag(r: TagORM) -> Tag:
    return Tag(
        id=r.id,
        space_id=r.space_id,
        name=r.name,
        normalized_name=r.normalized_name,
        color=r.color,
        description=r.description,
        status=r.status,
        created_by=r.created_by,
        created_at=_dt_iso(r.created_at),
        updated_at=_dt_iso(r.updated_at),
    )


def _to_tag_link(r: TagLinkORM) -> TagLink:
    return TagLink(
        tag_id=r.tag_id,
        document_id=r.document_id,
        link_source=r.link_source,
        created_by=r.created_by,
        created_at=_dt_iso(r.created_at),
    )


def _to_quick_entry(r: QuickEntryORM) -> QuickEntry:
    return QuickEntry(
        id=r.id,
        space_id=r.space_id,
        owner_id=r.owner_id,
        title=r.title,
        content_md=r.content_md,
        source=r.source,
        target_document_id=r.target_document_id,
        created_document_id=r.created_document_id,
        status=r.status,
        created_at=_dt_iso(r.created_at),
        updated_at=_dt_iso(r.updated_at),
    )


def _safe_embed(texts: list[str]) -> list[list[float]]:
    """Embed texts via bge-small-zh, returning [] on any failure.

    Lazy-imports the embedding service so importing this module does not pull
    sentence-transformers into every caller (e.g. test_pg_repository, which only
    needs the SQL path). Empty input → [] without loading the model. On any
    error (model not downloaded / network) returns [] so callers degrade: chunk
    writes store text-only (embedding NULL) and recall falls back to keyword.
    """
    if not texts:
        return []
    try:
        from backend.service.embedding import embed_texts

        return embed_texts(texts)
    except Exception as exc:  # pragma: no cover - env-dependent
        print(f"[embedding] embed failed (text-only / vector recall skipped): {exc}")
        return []


class PgRepository:
    """PostgreSQL-backed implementation of the DemoRepository interface."""

    # --- users / spaces / members ---

    def find_user_by_external_id(self, external_id: str) -> User | None:
        with SessionLocal() as session:
            row = session.scalars(select(UserORM).where(UserORM.external_id == external_id)).first()
            return _to_user(row) if row else None

    def list_memberships(self) -> list[SpaceMember]:
        with SessionLocal() as session:
            rows = session.scalars(select(SpaceMemberORM)).all()
            return [_to_member(r) for r in rows]

    def list_spaces(self) -> list[Space]:
        with SessionLocal() as session:
            rows = session.scalars(select(SpaceORM)).all()
            return [_to_space(r) for r in rows]

    def first_space_id_for_user(self, user_id: int) -> int | None:
        with SessionLocal() as session:
            row = session.scalars(
                select(SpaceMemberORM)
                .where(SpaceMemberORM.user_id == user_id)
                .order_by(SpaceMemberORM.space_id)
            ).first()
            return None if row is None else row.space_id

    # --- documents ---

    def list_documents(self) -> list[Document]:
        with SessionLocal() as session:
            rows = session.scalars(select(DocumentORM)).all()
            return [_to_document(r) for r in rows]

    def get_document(self, document_id: int) -> Document | None:
        with SessionLocal() as session:
            row = session.get(DocumentORM, document_id)
            return _to_document(row) if row else None

    def require_document(self, document_id: int) -> Document:
        document = self.get_document(document_id)
        if document is None:
            raise KeyError(document_id)
        return document

    def create_document(
        self,
        space_id: int,
        title: str,
        content_md: str,
        owner_id: int,
        permission: DocumentPermission,
    ) -> Document:
        with SessionLocal() as session:
            doc = DocumentORM(
                space_id=space_id,
                title=title,
                content_md=content_md,
                owner_id=owner_id,
                permission=permission.value,
                current_version=1,
            )
            session.add(doc)
            session.flush()  # populate doc.id from BIGSERIAL
            session.add(DocumentVersionORM(
                document_id=doc.id,
                version_no=1,
                content_md=content_md,
                editor_id=owner_id,
            ))
            session.commit()
            return _to_document(doc)

    def update_document(
        self,
        document_id: int,
        title: str,
        content_md: str,
        permission: DocumentPermission,
        editor_id: int,
    ) -> Document:
        with SessionLocal() as session:
            doc = session.get(DocumentORM, document_id)
            if doc is None:
                raise KeyError(document_id)
            next_version = self._next_version_no(session, document_id)
            doc.title = title
            doc.content_md = content_md
            doc.permission = permission.value
            doc.current_version = next_version
            doc.updated_at = func.now()
            session.add(DocumentVersionORM(
                document_id=document_id,
                version_no=next_version,
                content_md=content_md,
                editor_id=editor_id,
            ))
            session.commit()
            return _to_document(doc)

    def delete_document(self, document_id: int) -> None:
        with SessionLocal() as session:
            # versions + chunks removed by ON DELETE CASCADE
            session.execute(delete(DocumentORM).where(DocumentORM.id == document_id))
            session.commit()

    # --- versions ---

    def list_document_versions(self, document_id: int) -> list[DocumentVersion]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(DocumentVersionORM)
                .where(DocumentVersionORM.document_id == document_id)
                .order_by(DocumentVersionORM.version_no)
            ).all()
            return [_to_version(r) for r in rows]

    def get_document_version(self, document_id: int, version_no: int) -> DocumentVersion | None:
        with SessionLocal() as session:
            row = session.scalars(
                select(DocumentVersionORM)
                .where(
                    DocumentVersionORM.document_id == document_id,
                    DocumentVersionORM.version_no == version_no,
                )
            ).first()
            return _to_version(row) if row else None

    def restore_document_version(self, document_id: int, version_no: int, editor_id: int) -> Document:
        # Mirrors DemoRepository: does NOT create a new version row — only rolls
        # back content_md and the current_version pointer. editor_id is accepted
        # for signature parity but not used (same as the in-memory version).
        with SessionLocal() as session:
            doc = session.get(DocumentORM, document_id)
            if doc is None:
                raise KeyError(document_id)
            version = session.scalars(
                select(DocumentVersionORM)
                .where(
                    DocumentVersionORM.document_id == document_id,
                    DocumentVersionORM.version_no == version_no,
                )
            ).first()
            if version is None:
                raise KeyError(document_id)
            doc.content_md = version.content_md
            doc.current_version = version_no
            doc.updated_at = func.now()
            session.commit()
            return _to_document(doc)

    def _next_version_no(self, session, document_id: int) -> int:
        max_v = session.scalars(
            select(func.max(DocumentVersionORM.version_no)).where(
                DocumentVersionORM.document_id == document_id
            )
        ).first()
        return (max_v or 0) + 1

    # --- import jobs ---

    def create_import_job(self, space_id: int, source_filename: str, created_by: int) -> ImportJob:
        with SessionLocal() as session:
            job = ImportJobORM(
                space_id=space_id,
                source_filename=source_filename,
                created_by=created_by,
                status="processing",
            )
            session.add(job)
            session.commit()
            return _to_import(job)

    def complete_import_job(self, import_id: int, parsed_doc_id: int, chunk_count: int) -> ImportJob:
        with SessionLocal() as session:
            job = session.get(ImportJobORM, import_id)
            if job is None:
                raise KeyError(import_id)
            job.status = "done"
            job.parsed_doc_id = parsed_doc_id
            job.chunk_count = chunk_count
            job.error = None
            session.commit()
            return _to_import(job)

    def fail_import_job(self, import_id: int, error: str) -> ImportJob:
        with SessionLocal() as session:
            job = session.get(ImportJobORM, import_id)
            if job is None:
                raise KeyError(import_id)
            job.status = "failed"
            job.error = error
            session.commit()
            return _to_import(job)

    def require_import_job(self, import_id: int) -> ImportJob:
        with SessionLocal() as session:
            job = session.get(ImportJobORM, import_id)
            if job is None:
                raise KeyError(import_id)
            return _to_import(job)

    # --- chunks ---

    def replace_document_chunks(self, document_id: int, chunk_texts: list[str]) -> list[DocumentChunk]:
        with SessionLocal() as session:
            session.execute(delete(DocumentChunkORM).where(DocumentChunkORM.document_id == document_id))
            created = [
                DocumentChunkORM(document_id=document_id, ordinal=ordinal, text=text)
                for ordinal, text in enumerate(chunk_texts, start=1)
            ]
            # task-008 T6: embed chunk texts so vector recall (rag.py) has vectors
            # to search. Guarded — if the model is unavailable the chunks are still
            # stored (embedding NULL) and recall degrades to keyword/title match.
            vectors = _safe_embed(chunk_texts)
            for chunk, vector in zip(created, vectors):
                chunk.embedding = vector
            session.add_all(created)
            session.commit()
            return [_to_chunk(c) for c in created]

    def list_document_chunks(self, document_id: int) -> list[DocumentChunk]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(DocumentChunkORM)
                .where(DocumentChunkORM.document_id == document_id)
                .order_by(DocumentChunkORM.ordinal)
            ).all()
            return [_to_chunk(r) for r in rows]

    def list_all_document_chunks(self) -> list[DocumentChunk]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(DocumentChunkORM).order_by(DocumentChunkORM.document_id, DocumentChunkORM.ordinal)
            ).all()
            return [_to_chunk(r) for r in rows]

    # --- doc links (REQ-026) ---

    def list_doc_links(self, space_id: int, document_id: int, direction: str) -> list[DocLink]:
        with SessionLocal() as session:
            query = select(DocLinkORM).where(DocLinkORM.space_id == space_id)
            if direction == "backlink":
                query = query.where(DocLinkORM.target_document_id == document_id)
            else:
                query = query.where(DocLinkORM.source_document_id == document_id)
            rows = session.scalars(query).all()
            return [_to_doc_link(r) for r in rows]

    def find_document_id_by_title(self, space_id: int, title: str) -> int | None:
        with SessionLocal() as session:
            row = session.scalars(
                select(DocumentORM).where(DocumentORM.space_id == space_id, DocumentORM.title == title)
            ).first()
            return None if row is None else row.id

    def replace_document_wikilinks(
        self,
        space_id: int,
        source_document_id: int,
        drafts: list[DocLinkDraft],
    ) -> list[DocLink]:
        with SessionLocal() as session:
            session.execute(
                delete(DocLinkORM).where(
                    DocLinkORM.source_document_id == source_document_id,
                    DocLinkORM.link_type == "wikilink",
                )
            )
            created = [
                DocLinkORM(
                    space_id=space_id,
                    source_document_id=source_document_id,
                    target_document_id=draft.target_document_id,
                    target_title=draft.target_title,
                    link_text=draft.link_text,
                    link_type="wikilink",
                    status=draft.status,
                )
                for draft in drafts
            ]
            session.add_all(created)
            session.commit()
            return [_to_doc_link(r) for r in created]

    def upsert_manual_link(
        self,
        space_id: int,
        source_document_id: int,
        target_document_id: int | None,
        target_title: str,
        link_text: str,
    ) -> DocLink:
        status = "resolved" if target_document_id is not None else "unresolved"
        with SessionLocal() as session:
            row = DocLinkORM(
                space_id=space_id,
                source_document_id=source_document_id,
                target_document_id=target_document_id,
                target_title=target_title,
                link_text=link_text,
                link_type="manual",
                status=status,
            )
            session.add(row)
            session.commit()
            return _to_doc_link(row)

    # --- tags (REQ-012) ---

    def list_tags(self, space_id: int, q: str | None = None, status: str | None = "active") -> list[Tag]:
        with SessionLocal() as session:
            query = select(TagORM).where(TagORM.space_id == space_id)
            if status is not None:
                query = query.where(TagORM.status == status)
            if q:
                query = query.where(TagORM.normalized_name.contains(q.strip().lower()))
            rows = session.scalars(query.order_by(TagORM.id)).all()
            return [_to_tag(r) for r in rows]

    def get_tag(self, tag_id: int) -> Tag | None:
        with SessionLocal() as session:
            row = session.scalars(select(TagORM).where(TagORM.id == tag_id)).first()
            return None if row is None else _to_tag(row)

    def create_tag(
        self,
        space_id: int,
        name: str,
        normalized_name: str,
        created_by: int,
        color: str | None = None,
        description: str | None = None,
    ) -> Tag:
        with SessionLocal() as session:
            row = TagORM(
                space_id=space_id,
                name=name,
                normalized_name=normalized_name,
                color=color,
                description=description,
                status="active",
                created_by=created_by,
            )
            session.add(row)
            session.commit()
            return _to_tag(row)

    def update_tag(
        self,
        tag_id: int,
        name: str | None = None,
        normalized_name: str | None = None,
        color: str | None = None,
        description: str | None = None,
        status: str | None = None,
    ) -> Tag | None:
        with SessionLocal() as session:
            row = session.scalars(select(TagORM).where(TagORM.id == tag_id)).first()
            if row is None:
                return None
            if name is not None and normalized_name is not None:
                row.name = name
                row.normalized_name = normalized_name
            if color is not None:
                row.color = color
            if description is not None:
                row.description = description
            if status is not None:
                row.status = status
            session.commit()
            return _to_tag(row)

    def list_document_tag_links(self, document_id: int) -> list[TagLink]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(TagLinkORM).where(TagLinkORM.document_id == document_id)
            ).all()
            return [_to_tag_link(r) for r in rows]

    def upsert_document_tag(
        self,
        tag_id: int,
        document_id: int,
        link_source: str,
        created_by: int,
    ) -> TagLink:
        with SessionLocal() as session:
            existing = session.scalars(
                select(TagLinkORM).where(
                    TagLinkORM.tag_id == tag_id,
                    TagLinkORM.document_id == document_id,
                )
            ).first()
            if existing is not None:
                return _to_tag_link(existing)
            row = TagLinkORM(
                tag_id=tag_id,
                document_id=document_id,
                link_source=link_source,
                created_by=created_by,
            )
            session.add(row)
            session.commit()
            return _to_tag_link(row)

    # --- quick entries (REQ-025) ---

    def create_quick_entry(
        self,
        space_id: int,
        owner_id: int,
        title: str,
        content_md: str = "",
        source: str | None = None,
        target_document_id: int | None = None,
        created_document_id: int | None = None,
        status: str = "draft",
    ) -> QuickEntry:
        with SessionLocal() as session:
            row = QuickEntryORM(
                space_id=space_id,
                owner_id=owner_id,
                title=title,
                content_md=content_md,
                source=source,
                target_document_id=target_document_id,
                created_document_id=created_document_id,
                status=status,
            )
            session.add(row)
            session.commit()
            return _to_quick_entry(row)

    def get_quick_entry(self, entry_id: int) -> QuickEntry | None:
        with SessionLocal() as session:
            row = session.scalars(select(QuickEntryORM).where(QuickEntryORM.id == entry_id)).first()
            return None if row is None else _to_quick_entry(row)

    def list_quick_entries(
        self,
        space_id: int,
        owner_id: int,
        status: str | None = None,
    ) -> list[QuickEntry]:
        with SessionLocal() as session:
            query = select(QuickEntryORM).where(
                QuickEntryORM.space_id == space_id,
                QuickEntryORM.owner_id == owner_id,
            )
            if status is not None:
                query = query.where(QuickEntryORM.status == status)
            rows = session.scalars(query.order_by(QuickEntryORM.id)).all()
            return [_to_quick_entry(r) for r in rows]

    def update_quick_entry(
        self,
        entry_id: int,
        status: str | None = None,
        target_document_id: int | None = None,
        created_document_id: int | None = None,
    ) -> QuickEntry | None:
        with SessionLocal() as session:
            row = session.scalars(select(QuickEntryORM).where(QuickEntryORM.id == entry_id)).first()
            if row is None:
                return None
            if status is not None:
                row.status = status
            if target_document_id is not None:
                row.target_document_id = target_document_id
            if created_document_id is not None:
                row.created_document_id = created_document_id
            session.commit()
            return _to_quick_entry(row)

    def remove_document_tag(self, tag_id: int, document_id: int) -> bool:
        with SessionLocal() as session:
            deleted = session.execute(
                delete(TagLinkORM).where(
                    TagLinkORM.tag_id == tag_id,
                    TagLinkORM.document_id == document_id,
                )
            ).rowcount
            session.commit()
            return deleted > 0

    def list_tag_document_ids(self, tag_id: int) -> list[int]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(TagLinkORM.document_id).where(TagLinkORM.tag_id == tag_id)
            ).all()
            return list(rows)

    def search_chunks(self, document_ids: list[int], query: str, limit: int) -> list[DocumentChunk]:
        """Search visible chunks with PostgreSQL full-text indexes.

        Uses the optional zhparser-backed config when migration 006 can create
        it; otherwise it falls back to the existing ``simple`` config. The
        service layer still adds substring and vector matches, so this method is
        a ranked SQL-side candidate path rather than the only search source.
        """
        if not document_ids or not query.strip() or limit < 1:
            return []
        ts_query = "websearch_to_tsquery(lumen_search_regconfig(), :query)"
        with SessionLocal() as session:
            rows = session.scalars(
                select(DocumentChunkORM)
                .where(
                    DocumentChunkORM.document_id.in_(document_ids),
                    sql_text(f"lumen_chunks.ts_vector @@ {ts_query}"),
                )
                .order_by(
                    sql_text(f"ts_rank(lumen_chunks.ts_vector, {ts_query}) DESC"),
                    DocumentChunkORM.document_id,
                    DocumentChunkORM.ordinal,
                )
                .limit(limit)
                .params(query=query)
            ).all()
            return [_to_chunk(r) for r in rows]

    def recall_chunks(
        self,
        document_ids: list[int],
        query: str,
        limit: int,
        threshold: float = 0.6,
    ) -> list[DocumentChunk]:
        """task-008 T6: semantic vector recall over the visible documents.

        Embeds ``query`` (bge-small-zh, 512-dim) and returns up to ``limit``
        chunks whose cosine similarity to the query is >= ``threshold``, scoped
        to ``document_ids`` (the service layer's permission-filtered doc set),
        nearest first (uses the hnsw ``vector_cosine_ops`` index). Returns [] when
        the query is empty, no documents are visible, or embedding is unavailable
        (rag.py then falls back to its keyword path).
        """
        if not document_ids or not query.strip():
            return []
        vectors = _safe_embed([query])
        if not vectors:
            return []
        query_vector = vectors[0]
        max_distance = 1.0 - threshold  # similarity >= threshold  <=>  distance <= 1 - threshold
        with SessionLocal() as session:
            distance = DocumentChunkORM.embedding.cosine_distance(query_vector)
            rows = session.scalars(
                select(DocumentChunkORM)
                .where(
                    DocumentChunkORM.document_id.in_(document_ids),
                    DocumentChunkORM.embedding.is_not(None),
                    distance <= max_distance,
                )
                .order_by(distance)
                .limit(limit)
            ).all()
            return [_to_chunk(r) for r in rows]

    # --- terms ---

    def list_terms(self) -> list[Term]:
        # Global terms (space_id NULL) first, then space terms — matches
        # DemoRepository's (space_id is not None, space_id or 0, term, id) key.
        with SessionLocal() as session:
            rows = session.scalars(
                select(TermORM).order_by(
                    TermORM.space_id.is_not(None),
                    func.coalesce(TermORM.space_id, 0),
                    TermORM.term,
                    TermORM.id,
                )
            ).all()
            return [_to_term(r) for r in rows]

    def get_term(self, term_id: int) -> Term | None:
        with SessionLocal() as session:
            row = session.get(TermORM, term_id)
            return _to_term(row) if row else None

    def require_term(self, term_id: int) -> Term:
        term = self.get_term(term_id)
        if term is None:
            raise KeyError(term_id)
        return term

    def create_term(
        self,
        space_id: int | None,
        term: str,
        definition: str,
        aliases: list[str],
        owner_id: int,
        status: TermStatus,
        source_document_id: int | None = None,
    ) -> Term:
        with SessionLocal() as session:
            t = TermORM(
                space_id=space_id,
                term=term,
                definition=definition,
                aliases=list(aliases),
                owner_id=owner_id,
                status=status.value,
                source_document_id=source_document_id,
            )
            session.add(t)
            session.commit()
            return _to_term(t)

    def update_term(
        self,
        term_id: int,
        term: str,
        definition: str,
        aliases: list[str],
        status: TermStatus,
        source_document_id: int | None = None,
    ) -> Term:
        with SessionLocal() as session:
            t = session.get(TermORM, term_id)
            if t is None:
                raise KeyError(term_id)
            t.term = term
            t.definition = definition
            t.aliases = list(aliases)
            t.status = status.value
            t.source_document_id = source_document_id
            t.updated_at = func.now()
            session.commit()
            return _to_term(t)

    def delete_term(self, term_id: int) -> None:
        with SessionLocal() as session:
            session.execute(delete(TermORM).where(TermORM.id == term_id))
            session.commit()
