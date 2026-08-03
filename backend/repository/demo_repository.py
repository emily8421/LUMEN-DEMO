"""In-memory demo repository used until PostgreSQL integration is wired."""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime

from backend.model.entities import (
    AiDraft,
    DocLink,
    DocLinkDraft,
    Document,
    DocumentChunk,
    DocumentPermission,
    DocumentVersion,
    Folder,
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


class DemoRepository:
    def __init__(self) -> None:
        self.users = [
            User(id=1, external_id="alice", name="Alice"),
            User(id=2, external_id="kira", name="Kira"),
            User(id=3, external_id="brightlite-member", name="BrightLite Member"),
        ]
        self.spaces = [
            Space(id=10, code="nova-internal", name="Nova Internal"),
            Space(id=20, code="brightlite-team", name="BrightLite Team"),
        ]
        self.memberships = [
            SpaceMember(user_id=1, space_id=10, role=SpaceRole.ADMIN),
            SpaceMember(user_id=1, space_id=20, role=SpaceRole.ADMIN),
            SpaceMember(user_id=2, space_id=10, role=SpaceRole.MEMBER),
            SpaceMember(user_id=3, space_id=20, role=SpaceRole.MEMBER),
        ]
        self.documents = [
            Document(
                id=100,
                space_id=10,
                title="Nova Sprint Notes",
                content_md="# Nova\n\nInitial sprint note.",
                owner_id=1,
                permission=DocumentPermission.TEAM,
                current_version=1,
            ),
            Document(
                id=200,
                space_id=20,
                title="BrightLite Private Brief",
                content_md="# BrightLite\n\nPrivate context.",
                owner_id=3,
                permission=DocumentPermission.PRIVATE,
                current_version=1,
            ),
        ]
        self.document_versions = [
            DocumentVersion(id=1, document_id=100, version_no=1, content_md="# Nova\n\nInitial sprint note.", editor_id=1, created_at=_now_iso()),
            DocumentVersion(id=2, document_id=200, version_no=1, content_md="# BrightLite\n\nPrivate context.", editor_id=3, created_at=_now_iso()),
        ]
        self.import_jobs: list[ImportJob] = []
        self.document_chunks: list[DocumentChunk] = []
        self.terms: list[Term] = [
            Term(
                id=1,
                space_id=None,
                term="触发延迟",
                definition="从触发条件满足到指令发出。",
                aliases=["开关延迟"],
                owner_id=1,
                status=TermStatus.CONFIRMED,
            )
        ]
        self._next_document_id = 201
        self._next_version_id = 3
        self._next_import_id = 1
        self._next_chunk_id = 1
        self._next_term_id = 2
        self.doc_links: list[DocLink] = []
        self._next_doc_link_id = 1
        self.tags: list[Tag] = []
        self.tag_links: list[TagLink] = []
        self._next_tag_id = 1
        self.quick_entries: list[QuickEntry] = []
        self._next_quick_entry_id = 1
        self.ai_drafts: list[AiDraft] = []
        self._next_ai_draft_id = 1
        self.folders: list[Folder] = []
        self._next_folder_id = 1

    def find_user_by_external_id(self, external_id: str) -> User | None:
        return next((user for user in self.users if user.external_id == external_id), None)

    def list_memberships(self) -> list[SpaceMember]:
        return list(self.memberships)

    def list_spaces(self) -> list[Space]:
        return list(self.spaces)

    def first_space_id_for_user(self, user_id: int) -> int | None:
        membership = next(
            (membership for membership in self.memberships if membership.user_id == user_id),
            None,
        )
        return None if membership is None else membership.space_id

    def list_documents(self) -> list[Document]:
        return list(self.documents)

    def get_document(self, document_id: int) -> Document | None:
        return next((document for document in self.documents if document.id == document_id), None)

    def create_document(
        self,
        space_id: int,
        title: str,
        content_md: str,
        owner_id: int,
        permission: DocumentPermission,
    ) -> Document:
        now = _now_iso()
        document = Document(
            id=self._next_document_id,
            space_id=space_id,
            title=title,
            content_md=content_md,
            owner_id=owner_id,
            permission=permission,
            current_version=1,
            created_at=now,
            updated_at=now,
        )
        self._next_document_id += 1
        self.documents.append(document)
        self._append_version(document.id, 1, content_md, owner_id)
        return document

    def update_document(
        self,
        document_id: int,
        title: str,
        content_md: str,
        permission: DocumentPermission,
        editor_id: int,
    ) -> Document:
        document = self.require_document(document_id)
        next_version = self._next_document_version_no(document_id)
        updated_document = replace(
            document,
            title=title,
            content_md=content_md,
            permission=permission,
            current_version=next_version,
            updated_at=_now_iso(),
        )
        self._replace_document(updated_document)
        self._append_version(document_id, next_version, content_md, editor_id)
        return updated_document

    def delete_document(self, document_id: int) -> None:
        self.documents = [document for document in self.documents if document.id != document_id]
        self.document_versions = [version for version in self.document_versions if version.document_id != document_id]
        self.document_chunks = [chunk for chunk in self.document_chunks if chunk.document_id != document_id]

    def list_document_versions(self, document_id: int) -> list[DocumentVersion]:
        return sorted(
            [version for version in self.document_versions if version.document_id == document_id],
            key=lambda version: version.version_no,
        )

    def get_document_version(self, document_id: int, version_no: int) -> DocumentVersion | None:
        return next(
            (
                version
                for version in self.document_versions
                if version.document_id == document_id and version.version_no == version_no
            ),
            None,
        )

    def restore_document_version(self, document_id: int, version_no: int, editor_id: int) -> Document:
        document = self.require_document(document_id)
        version = self.get_document_version(document_id, version_no)
        if version is None:
            raise KeyError(document_id)

        restored_document = replace(document, content_md=version.content_md, current_version=version_no)
        self._replace_document(restored_document)
        return restored_document

    def require_document(self, document_id: int) -> Document:
        document = self.get_document(document_id)
        if document is None:
            raise KeyError(document_id)
        return document

    def create_import_job(self, space_id: int, source_filename: str, created_by: int) -> ImportJob:
        import_job = ImportJob(
            id=self._next_import_id,
            space_id=space_id,
            source_filename=source_filename,
            status="processing",
            created_by=created_by,
            created_at=_now_iso(),
        )
        self._next_import_id += 1
        self.import_jobs.append(import_job)
        return import_job

    def complete_import_job(self, import_id: int, parsed_doc_id: int, chunk_count: int) -> ImportJob:
        import_job = self.require_import_job(import_id)
        updated_import = replace(
            import_job,
            status="done",
            parsed_doc_id=parsed_doc_id,
            chunk_count=chunk_count,
            error=None,
        )
        self._replace_import_job(updated_import)
        return updated_import

    def fail_import_job(self, import_id: int, error: str) -> ImportJob:
        import_job = self.require_import_job(import_id)
        updated_import = replace(import_job, status="failed", error=error)
        self._replace_import_job(updated_import)
        return updated_import

    def require_import_job(self, import_id: int) -> ImportJob:
        import_job = next((job for job in self.import_jobs if job.id == import_id), None)
        if import_job is None:
            raise KeyError(import_id)
        return import_job

    def replace_document_chunks(self, document_id: int, chunk_texts: list[str]) -> list[DocumentChunk]:
        self.document_chunks = [chunk for chunk in self.document_chunks if chunk.document_id != document_id]
        chunks: list[DocumentChunk] = []
        for ordinal, text in enumerate(chunk_texts, start=1):
            chunk = DocumentChunk(
                id=self._next_chunk_id,
                document_id=document_id,
                ordinal=ordinal,
                text=text,
            )
            self._next_chunk_id += 1
            chunks.append(chunk)
        self.document_chunks.extend(chunks)
        return chunks

    def list_document_chunks(self, document_id: int) -> list[DocumentChunk]:
        return sorted(
            [chunk for chunk in self.document_chunks if chunk.document_id == document_id],
            key=lambda chunk: chunk.ordinal,
        )

    def list_all_document_chunks(self) -> list[DocumentChunk]:
        return sorted(
            self.document_chunks,
            key=lambda chunk: (chunk.document_id, chunk.ordinal),
        )

    def search_chunks(self, document_ids: list[int], query: str, limit: int) -> list[DocumentChunk]:
        """The in-memory fake has no tsvector index, so SQL full-text recall is skipped."""
        del document_ids, query, limit
        return []

    def recall_chunks(
        self,
        document_ids: list[int],
        query: str,
        limit: int,
        threshold: float = 0.6,
    ) -> list[DocumentChunk]:
        """task-008 T6: the in-memory fake has no embeddings, so vector recall
        returns []. This keeps the in-memory service tests exercising rag.py's
        keyword path unchanged; PgRepository overrides this with real pgvector
        ANN. ``query`` / ``threshold`` are accepted for interface parity only."""
        del document_ids, query, limit, threshold  # interface parity only
        return []

    def list_terms(self) -> list[Term]:
        return sorted(
            self.terms,
            key=lambda term: (term.space_id is not None, term.space_id or 0, term.term, term.id),
        )

    def get_term(self, term_id: int) -> Term | None:
        return next((term for term in self.terms if term.id == term_id), None)

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
        created_term = Term(
            id=self._next_term_id,
            space_id=space_id,
            term=term,
            definition=definition,
            aliases=aliases,
            owner_id=owner_id,
            status=status,
            source_document_id=source_document_id,
        )
        self._next_term_id += 1
        self.terms.append(created_term)
        return created_term

    def update_term(
        self,
        term_id: int,
        term: str,
        definition: str,
        aliases: list[str],
        status: TermStatus,
        source_document_id: int | None = None,
    ) -> Term:
        existing_term = self.require_term(term_id)
        updated_term = replace(
            existing_term,
            term=term,
            definition=definition,
            aliases=aliases,
            status=status,
            source_document_id=source_document_id,
        )
        self._replace_term(updated_term)
        return updated_term

    def delete_term(self, term_id: int) -> None:
        self.terms = [term for term in self.terms if term.id != term_id]

    def require_term(self, term_id: int) -> Term:
        term = self.get_term(term_id)
        if term is None:
            raise KeyError(term_id)
        return term

    def _replace_document(self, updated_document: Document) -> None:
        self.documents = [
            updated_document if document.id == updated_document.id else document
            for document in self.documents
        ]

    def _replace_import_job(self, updated_import: ImportJob) -> None:
        self.import_jobs = [
            updated_import if import_job.id == updated_import.id else import_job
            for import_job in self.import_jobs
        ]

    def _replace_term(self, updated_term: Term) -> None:
        self.terms = [
            updated_term if term.id == updated_term.id else term
            for term in self.terms
        ]

    def _next_document_version_no(self, document_id: int) -> int:
        versions = self.list_document_versions(document_id)
        if not versions:
            return 1
        return max(version.version_no for version in versions) + 1

    def _append_version(self, document_id: int, version_no: int, content_md: str, editor_id: int) -> DocumentVersion:
        version = DocumentVersion(
            id=self._next_version_id,
            document_id=document_id,
            version_no=version_no,
            content_md=content_md,
            editor_id=editor_id,
            created_at=_now_iso(),
        )
        self._next_version_id += 1
        self.document_versions.append(version)
        return version

    # --- doc links (REQ-026) ---

    def list_doc_links(self, space_id: int, document_id: int, direction: str) -> list[DocLink]:
        if direction == "backlink":
            return [
                link
                for link in self.doc_links
                if link.space_id == space_id and link.target_document_id == document_id
            ]
        return [
            link
            for link in self.doc_links
            if link.space_id == space_id and link.source_document_id == document_id
        ]

    def find_document_id_by_title(self, space_id: int, title: str) -> int | None:
        return next(
            (document.id for document in self.documents if document.space_id == space_id and document.title == title),
            None,
        )

    def replace_document_wikilinks(
        self,
        space_id: int,
        source_document_id: int,
        drafts: list[DocLinkDraft],
    ) -> list[DocLink]:
        self.doc_links = [
            link
            for link in self.doc_links
            if not (link.source_document_id == source_document_id and link.link_type == "wikilink")
        ]
        created: list[DocLink] = []
        for draft in drafts:
            link = DocLink(
                id=self._next_doc_link_id,
                space_id=space_id,
                source_document_id=source_document_id,
                target_document_id=draft.target_document_id,
                target_title=draft.target_title,
                link_text=draft.link_text,
                link_type="wikilink",
                status=draft.status,
            )
            self._next_doc_link_id += 1
            self.doc_links.append(link)
            created.append(link)
        return created

    def upsert_manual_link(
        self,
        space_id: int,
        source_document_id: int,
        target_document_id: int | None,
        target_title: str,
        link_text: str,
    ) -> DocLink:
        status = "resolved" if target_document_id is not None else "unresolved"
        link = DocLink(
            id=self._next_doc_link_id,
            space_id=space_id,
            source_document_id=source_document_id,
            target_document_id=target_document_id,
            target_title=target_title,
            link_text=link_text,
            link_type="manual",
            status=status,
        )
        self._next_doc_link_id += 1
        self.doc_links.append(link)
        return link

    # --- tags (REQ-012) ---

    def list_tags(self, space_id: int, q: str | None = None, status: str | None = "active") -> list[Tag]:
        result = [tag for tag in self.tags if tag.space_id == space_id]
        if status is not None:
            result = [tag for tag in result if tag.status == status]
        if q:
            needle = q.strip().lower()
            result = [tag for tag in result if needle in tag.normalized_name]
        return result

    def get_tag(self, tag_id: int) -> Tag | None:
        return next((tag for tag in self.tags if tag.id == tag_id), None)

    def create_tag(
        self,
        space_id: int,
        name: str,
        normalized_name: str,
        created_by: int,
        color: str | None = None,
        description: str | None = None,
    ) -> Tag:
        tag = Tag(
            id=self._next_tag_id,
            space_id=space_id,
            name=name,
            normalized_name=normalized_name,
            color=color,
            description=description,
            status="active",
            created_by=created_by,
            created_at=_now_iso(),
            updated_at=_now_iso(),
        )
        self._next_tag_id += 1
        self.tags.append(tag)
        return tag

    def update_tag(
        self,
        tag_id: int,
        name: str | None = None,
        normalized_name: str | None = None,
        color: str | None = None,
        description: str | None = None,
        status: str | None = None,
    ) -> Tag | None:
        for index, tag in enumerate(self.tags):
            if tag.id != tag_id:
                continue
            fields: dict[str, object] = {"updated_at": _now_iso()}
            if name is not None and normalized_name is not None:
                fields["name"] = name
                fields["normalized_name"] = normalized_name
            if color is not None:
                fields["color"] = color
            if description is not None:
                fields["description"] = description
            if status is not None:
                fields["status"] = status
            updated = replace(tag, **fields)
            self.tags[index] = updated
            return updated
        return None

    def list_document_tag_links(self, document_id: int) -> list[TagLink]:
        return [link for link in self.tag_links if link.document_id == document_id]

    def upsert_document_tag(
        self,
        tag_id: int,
        document_id: int,
        link_source: str,
        created_by: int,
    ) -> TagLink:
        existing = next(
            (
                link
                for link in self.tag_links
                if link.tag_id == tag_id and link.document_id == document_id
            ),
            None,
        )
        if existing is not None:
            return existing
        link = TagLink(
            tag_id=tag_id,
            document_id=document_id,
            link_source=link_source,
            created_by=created_by,
            created_at=_now_iso(),
        )
        self.tag_links.append(link)
        return link

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
        entry = QuickEntry(
            id=self._next_quick_entry_id,
            space_id=space_id,
            owner_id=owner_id,
            title=title,
            content_md=content_md,
            source=source,
            target_document_id=target_document_id,
            created_document_id=created_document_id,
            status=status,
            created_at=_now_iso(),
            updated_at=_now_iso(),
        )
        self._next_quick_entry_id += 1
        self.quick_entries.append(entry)
        return entry

    def get_quick_entry(self, entry_id: int) -> QuickEntry | None:
        return next((entry for entry in self.quick_entries if entry.id == entry_id), None)

    def list_quick_entries(
        self,
        space_id: int,
        owner_id: int,
        status: str | None = None,
    ) -> list[QuickEntry]:
        result = [
            entry
            for entry in self.quick_entries
            if entry.space_id == space_id and entry.owner_id == owner_id
        ]
        if status is not None:
            result = [entry for entry in result if entry.status == status]
        return result

    def update_quick_entry(
        self,
        entry_id: int,
        status: str | None = None,
        target_document_id: int | None = None,
        created_document_id: int | None = None,
    ) -> QuickEntry | None:
        for index, entry in enumerate(self.quick_entries):
            if entry.id != entry_id:
                continue
            fields: dict[str, object] = {"updated_at": _now_iso()}
            if status is not None:
                fields["status"] = status
            if target_document_id is not None:
                fields["target_document_id"] = target_document_id
            if created_document_id is not None:
                fields["created_document_id"] = created_document_id
            updated = replace(entry, **fields)
            self.quick_entries[index] = updated
            return updated
        return None

    # --- ai drafts (REQ-014, API-028) ---

    def create_ai_draft(
        self,
        space_id: int,
        document_id: int,
        user_id: int,
        mode: str,
        input_excerpt_hash: str | None = None,
        prompt_summary: str = "",
        output_md: str = "",
        cited_chunk_ids: tuple[int, ...] = (),
        status: str = "generated",
    ) -> AiDraft:
        draft = AiDraft(
            id=self._next_ai_draft_id,
            space_id=space_id,
            document_id=document_id,
            user_id=user_id,
            mode=mode,
            input_excerpt_hash=input_excerpt_hash,
            prompt_summary=prompt_summary,
            output_md=output_md,
            cited_chunk_ids=cited_chunk_ids,
            status=status,
            created_at=_now_iso(),
        )
        self._next_ai_draft_id += 1
        self.ai_drafts.append(draft)
        return draft

    def remove_document_tag(self, tag_id: int, document_id: int) -> bool:
        before = len(self.tag_links)
        self.tag_links = [
            link
            for link in self.tag_links
            if not (link.tag_id == tag_id and link.document_id == document_id)
        ]
        return len(self.tag_links) < before

    def list_tag_document_ids(self, tag_id: int) -> list[int]:
        return [link.document_id for link in self.tag_links if link.tag_id == tag_id]

    # --- folders (REQ-039) ---

    def _next_folder_order(self, space_id: int, parent_id: int | None) -> int:
        siblings = [f for f in self.folders if f.space_id == space_id and f.parent_id == parent_id]
        return max((f.order for f in siblings), default=0) + 1

    def list_folders(self, space_id: int) -> list[Folder]:
        return sorted(
            [f for f in self.folders if f.space_id == space_id],
            key=lambda f: (f.parent_id is None, f.parent_id or 0, f.order, f.name),
        )

    def get_folder(self, folder_id: int) -> Folder | None:
        return next((f for f in self.folders if f.id == folder_id), None)

    def find_folder_by_name(self, space_id: int, parent_id: int | None, name: str) -> Folder | None:
        return next(
            (f for f in self.folders if f.space_id == space_id and f.parent_id == parent_id and f.name == name),
            None,
        )

    def create_folder(self, space_id: int, parent_id: int | None, name: str, created_by: int) -> Folder:
        folder = Folder(
            id=self._next_folder_id,
            space_id=space_id,
            parent_id=parent_id,
            name=name,
            order=self._next_folder_order(space_id, parent_id),
            created_by=created_by,
            created_at=_now_iso(),
            updated_at=_now_iso(),
        )
        self._next_folder_id += 1
        self.folders.append(folder)
        return folder

    def rename_folder(self, folder_id: int, name: str) -> Folder | None:
        for index, f in enumerate(self.folders):
            if f.id != folder_id:
                continue
            updated = replace(f, name=name, updated_at=_now_iso())
            self.folders[index] = updated
            return updated
        return None

    def move_folder(self, folder_id: int, parent_id: int | None) -> Folder | None:
        for index, f in enumerate(self.folders):
            if f.id != folder_id:
                continue
            updated = replace(
                f,
                parent_id=parent_id,
                order=self._next_folder_order(f.space_id, parent_id),
                updated_at=_now_iso(),
            )
            self.folders[index] = updated
            return updated
        return None

    def delete_folder(self, folder_id: int) -> None:
        self.folders = [f for f in self.folders if f.id != folder_id]

    def is_folder_empty(self, space_id: int, folder_id: int) -> bool:
        if any(f.space_id == space_id and f.parent_id == folder_id for f in self.folders):
            return False
        return not any(d.folder_id == folder_id for d in self.documents)

    def is_descendant_folder(self, space_id: int, ancestor_id: int, candidate_id: int) -> bool:
        """内存递归：candidate 是否是 ancestor 的后代（含自身）。"""
        if candidate_id == ancestor_id:
            return True
        stack = [ancestor_id]
        visited: set[int] = set()
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            for f in self.folders:
                if f.space_id == space_id and f.parent_id == current:
                    if f.id == candidate_id:
                        return True
                    stack.append(f.id)
        return False

    def list_folder_document_ids(self, space_id: int, folder_id: int) -> list[int]:
        return [d.id for d in self.documents if d.space_id == space_id and d.folder_id == folder_id]

    def set_document_folder(self, document_id: int, folder_id: int | None) -> None:
        """预留：文档归属写入（Flow-D-012 / 文档 CRUD 复用）。本轮 service 不调用。"""
        for index, d in enumerate(self.documents):
            if d.id == document_id:
                self.documents[index] = replace(d, folder_id=folder_id, updated_at=_now_iso())
                return
        raise KeyError(document_id)

    def reorder_folders(self, space_id: int, ordered_folder_ids: list[int]) -> None:
        index_by_id = {f.id: i for i, f in enumerate(self.folders)}
        now = _now_iso()
        for order, folder_id in enumerate(ordered_folder_ids, start=1):
            idx = index_by_id.get(folder_id)
            if idx is None:
                continue
            f = self.folders[idx]
            if f.space_id != space_id:
                continue
            self.folders[idx] = replace(f, order=order, updated_at=now)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()



