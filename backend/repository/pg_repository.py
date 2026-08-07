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

from sqlalchemy import delete, func, or_, select, text as sql_text

from backend.model.entities import (
    AiDraft,
    DocExport,
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
    SpaceMemberDetail,
    SpaceRole,
    Tag,
    TagLink,
    QuickEntry,
    Term,
    TermCategory,
    Session,
    TermStatus,
    User,
)
from backend.model.orm import (
    AiDraftORM,
    DocExportORM,
    DocLinkORM,
    DocumentChunkORM,
    DocumentORM,
    DocumentVersionORM,
    FolderORM,
    ImportJobORM,
    QuickEntryORM,
    SessionORM,
    SpaceMemberORM,
    SpaceORM,
    TagLinkORM,
    TagORM,
    TermCategoryORM,
    TermORM,
    UserORM,
)
from backend.service.db import SessionLocal


# --- ORM row -> frozen dataclass entity converters ---

def _dt_iso(dt: datetime | None) -> str:
    return dt.isoformat() if dt is not None else ""


def _to_user(r: UserORM) -> User:
    return User(
        id=r.id,
        external_id=r.external_id,
        name=r.name,
        created_at=_dt_iso(r.created_at),
        email=r.email,
        password_hash=r.password_hash,
        status=r.status,
        failed_login_count=r.failed_login_count,
        locked_until=_dt_iso(r.locked_until),
        last_login_at=_dt_iso(r.last_login_at),
        role=r.role,
    )


def _to_session(r: SessionORM) -> Session:
    return Session(
        id=r.id,
        user_id=r.user_id,
        current_space_id=r.current_space_id,
        token_hash=r.token_hash,
        expires_at=_dt_iso(r.expires_at),
        created_at=_dt_iso(r.created_at),
        revoked_at=_dt_iso(r.revoked_at) or None,
        last_used_at=_dt_iso(r.last_used_at) or None,
        client_ua=r.client_ua,
        client_ip=r.client_ip,
    )


def _to_space(r: SpaceORM) -> Space:
    return Space(id=r.id, code=r.code, name=r.name, created_at=_dt_iso(r.created_at))


def _to_member(r: SpaceMemberORM) -> SpaceMember:
    return SpaceMember(user_id=r.user_id, space_id=r.space_id, role=SpaceRole(r.role), created_at=_dt_iso(r.created_at))


def _to_member_detail(member: SpaceMemberORM, user: UserORM) -> SpaceMemberDetail:
    return SpaceMemberDetail(
        user_id=member.user_id,
        space_id=member.space_id,
        name=user.name,
        email=user.email,
        role=SpaceRole(member.role),
        joined_at=_dt_iso(member.created_at),
    )


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
        folder_id=r.folder_id,
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
        category_id=r.category_id,
        category=r.category,
        source=r.source,
        created_at=_dt_iso(r.created_at),
        updated_at=_dt_iso(r.updated_at),
    )


def _to_term_category(r: TermCategoryORM) -> TermCategory:
    return TermCategory(
        id=r.id,
        space_id=r.space_id,
        parent_id=r.parent_id,
        name=r.name,
        order_idx=r.order_idx,
        created_by=r.created_by,
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


def _to_ai_draft(r: AiDraftORM) -> AiDraft:
    return AiDraft(
        id=r.id,
        space_id=r.space_id,
        document_id=r.document_id,
        user_id=r.user_id,
        mode=r.mode,
        input_excerpt_hash=r.input_excerpt_hash,
        prompt_summary=r.prompt_summary,
        output_md=r.output_md,
        cited_chunk_ids=tuple(r.cited_chunk_ids or []),
        status=r.status,
        created_at=_dt_iso(r.created_at),
    )


def _to_doc_export(r: DocExportORM) -> DocExport:
    return DocExport(
        id=r.id,
        space_id=r.space_id,
        document_id=r.document_id,
        requested_by=r.requested_by,
        format=r.format,
        status=r.status,
        version_no=r.version_no,
        artifact_path=r.artifact_path,
        error_message=r.error_message,
        created_at=_dt_iso(r.created_at),
        finished_at=_dt_iso(r.finished_at) or None,
    )


def _to_folder(r: FolderORM) -> Folder:
    return Folder(
        id=r.id,
        space_id=r.space_id,
        parent_id=r.parent_id,
        name=r.name,
        order=r.order,
        created_by=r.created_by,
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

    def find_user_by_id(self, user_id: int) -> User | None:
        with SessionLocal() as session:
            row = session.get(UserORM, user_id)
            return _to_user(row) if row else None

    def find_user_by_email(self, email: str) -> User | None:
        with SessionLocal() as session:
            row = session.scalars(select(UserORM).where(UserORM.email == email)).first()
            return _to_user(row) if row else None

    def create_user_with_personal_space(
        self,
        email: str,
        external_id: str,
        name: str,
        password_hash: str,
    ) -> User:
        """注册用户 + 自动创建个人空间（C-AUTH-001：归属个人空间，role=admin 可管理）。"""
        with SessionLocal() as session:
            user = UserORM(
                external_id=external_id,
                name=name,
                email=email,
                password_hash=password_hash,
                status="active",
                failed_login_count=0,
            )
            session.add(user)
            session.flush()
            space = SpaceORM(code=f"personal-{user.id}", name=f"{name} 的个人空间")
            session.add(space)
            session.flush()
            session.add(SpaceMemberORM(user_id=user.id, space_id=space.id, role="admin"))
            session.commit()
            return _to_user(user)

    def record_login_failure(self, user_id: int) -> int:
        with SessionLocal() as session:
            row = session.get(UserORM, user_id)
            if row is None:
                return 0
            row.failed_login_count = (row.failed_login_count or 0) + 1
            session.commit()
            return row.failed_login_count

    def set_locked_until(self, user_id: int, locked_until: str) -> None:
        with SessionLocal() as session:
            row = session.get(UserORM, user_id)
            if row is None:
                return
            row.locked_until = datetime.fromisoformat(locked_until)
            session.commit()

    def reset_login_failures(self, user_id: int) -> None:
        with SessionLocal() as session:
            row = session.get(UserORM, user_id)
            if row is None:
                return
            row.failed_login_count = 0
            row.locked_until = None
            row.last_login_at = func.now()
            session.commit()

    def create_session(
        self,
        user_id: int,
        current_space_id: int | None,
        token_hash: str,
        expires_at: str,
        client_ua: str | None = None,
        client_ip: str | None = None,
    ) -> Session:
        with SessionLocal() as session:
            row = SessionORM(
                user_id=user_id,
                current_space_id=current_space_id,
                token_hash=token_hash,
                expires_at=datetime.fromisoformat(expires_at),
                client_ua=client_ua,
                client_ip=client_ip,
            )
            session.add(row)
            session.commit()
            return _to_session(row)

    def find_session_by_token_hash(self, token_hash: str) -> Session | None:
        with SessionLocal() as session:
            row = session.scalars(select(SessionORM).where(SessionORM.token_hash == token_hash)).first()
            return _to_session(row) if row else None

    def list_sessions(self, user_id: int) -> list[Session]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(SessionORM)
                .where(SessionORM.user_id == user_id, SessionORM.revoked_at.is_(None))
                .order_by(SessionORM.created_at.desc())
            ).all()
            return [_to_session(r) for r in rows]

    def revoke_session(self, session_id: int, user_id: int) -> bool:
        with SessionLocal() as session:
            row = session.get(SessionORM, session_id)
            if row is None or row.user_id != user_id:
                return False
            row.revoked_at = func.now()
            session.commit()
            return True

    def update_session_space(self, session_id: int, space_id: int) -> Session:
        with SessionLocal() as session:
            row = session.get(SessionORM, session_id)
            if row is None:
                raise KeyError(session_id)
            row.current_space_id = space_id
            row.last_used_at = func.now()
            session.commit()
            return _to_session(row)

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

    # --- Sprint-28（REQ-045/046/047，task-040）：用户管理 / 空间成员 CRUD / 用户搜索 ---

    def list_users(self, q: str = "", role: str = "", status: str = "") -> list[User]:
        """admin 域用户列表（API-044）：q 匹配 name/email，可按 role / status 过滤。"""
        with SessionLocal() as session:
            stmt = select(UserORM).order_by(UserORM.id)
            if q:
                like = f"%{q}%"
                stmt = stmt.where(or_(UserORM.name.ilike(like), UserORM.email.ilike(like)))
            if role:
                stmt = stmt.where(UserORM.role == role)
            if status:
                stmt = stmt.where(UserORM.status == status)
            return [_to_user(r) for r in session.scalars(stmt).all()]

    def search_users(self, q: str = "") -> list[User]:
        """成员添加时用户搜索（API-050）：q 匹配 name/email，返回最小字段子集（上限 20）。"""
        with SessionLocal() as session:
            stmt = select(UserORM).order_by(UserORM.id)
            if q:
                like = f"%{q}%"
                stmt = stmt.where(or_(UserORM.name.ilike(like), UserORM.email.ilike(like)))
            return [_to_user(r) for r in session.scalars(stmt.limit(20)).all()]

    def update_user_role(self, user_id: int, role: str) -> User | None:
        """改全局角色（API-045）；不存在返回 None。"""
        with SessionLocal() as session:
            row = session.get(UserORM, user_id)
            if row is None:
                return None
            row.role = role
            session.commit()
            return _to_user(row)

    def set_user_status(self, user_id: int, status: str) -> User | None:
        """禁用 / 启用账号（API-045）；不存在返回 None。禁用后登录 4030 由 auth service 处理。"""
        with SessionLocal() as session:
            row = session.get(UserORM, user_id)
            if row is None:
                return None
            row.status = status
            session.commit()
            return _to_user(row)

    def revoke_user_sessions(self, user_id: int) -> int:
        """禁用账号时撤销全部活跃会话（API-045：既有会话失效）。"""
        with SessionLocal() as session:
            rows = session.scalars(
                select(SessionORM).where(SessionORM.user_id == user_id, SessionORM.revoked_at.is_(None))
            ).all()
            for row in rows:
                row.revoked_at = func.now()
            session.commit()
            return len(rows)

    def find_space(self, space_id: int) -> Space | None:
        with SessionLocal() as session:
            row = session.get(SpaceORM, space_id)
            return _to_space(row) if row else None

    def list_space_members(self, space_id: int) -> list[SpaceMemberDetail]:
        """空间成员列表（API-046）：含用户展示字段 + 加入时间 joined_at。"""
        with SessionLocal() as session:
            rows = session.execute(
                select(SpaceMemberORM, UserORM)
                .join(UserORM, UserORM.id == SpaceMemberORM.user_id)
                .where(SpaceMemberORM.space_id == space_id)
                .order_by(SpaceMemberORM.created_at, SpaceMemberORM.user_id)
            ).all()
            return [_to_member_detail(member, user) for member, user in rows]

    def add_space_member(self, space_id: int, user_id: int, role: str) -> SpaceMemberDetail | None:
        """按 email 添加成员（API-047）；已是成员返回 None。"""
        with SessionLocal() as session:
            existing = session.get(SpaceMemberORM, (user_id, space_id))
            if existing is not None:
                return None
            session.add(SpaceMemberORM(user_id=user_id, space_id=space_id, role=role))
            session.commit()
            user = session.get(UserORM, user_id)
            row = session.get(SpaceMemberORM, (user_id, space_id))
            if row is None:
                return None
            return _to_member_detail(row, user)

    def update_space_member_role(self, space_id: int, user_id: int, role: str) -> SpaceMemberDetail | None:
        """改空间角色（API-048）；非成员返回 None。"""
        with SessionLocal() as session:
            row = session.get(SpaceMemberORM, (user_id, space_id))
            if row is None:
                return None
            row.role = role
            session.commit()
            user = session.get(UserORM, user_id)
            return _to_member_detail(row, user)

    def remove_space_member(self, space_id: int, user_id: int) -> bool:
        """移除成员（API-049）；文档归属不变（仅删成员关系）。"""
        with SessionLocal() as session:
            row = session.get(SpaceMemberORM, (user_id, space_id))
            if row is None:
                return False
            session.delete(row)
            session.commit()
            return True

    def count_space_admins(self, space_id: int) -> int:
        with SessionLocal() as session:
            rows = session.scalars(
                select(SpaceMemberORM).where(SpaceMemberORM.space_id == space_id, SpaceMemberORM.role == "admin")
            ).all()
            return len(rows)

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
        with SessionLocal() as session:
            row = AiDraftORM(
                space_id=space_id,
                document_id=document_id,
                user_id=user_id,
                mode=mode,
                input_excerpt_hash=input_excerpt_hash,
                prompt_summary=prompt_summary,
                output_md=output_md,
                cited_chunk_ids=list(cited_chunk_ids),
                status=status,
            )
            session.add(row)
            session.commit()
            return _to_ai_draft(row)

    # --- document exports (REQ-027, API-019) ---

    def create_doc_export(
        self,
        space_id: int,
        document_id: int,
        requested_by: int,
        version_no: int,
        status: str = "queued",
        artifact_path: str | None = None,
        error_message: str | None = None,
    ) -> DocExport:
        with SessionLocal() as session:
            row = DocExportORM(
                space_id=space_id,
                document_id=document_id,
                requested_by=requested_by,
                format="pdf",
                status=status,
                version_no=version_no,
                artifact_path=artifact_path,
                error_message=error_message,
            )
            if status in {"done", "failed"}:
                row.finished_at = func.now()
            session.add(row)
            session.commit()
            return _to_doc_export(row)

    def get_doc_export(self, export_id: int) -> DocExport | None:
        with SessionLocal() as session:
            row = session.get(DocExportORM, export_id)
            return _to_doc_export(row) if row else None

    def update_doc_export(
        self,
        export_id: int,
        status: str,
        artifact_path: str | None = None,
        error_message: str | None = None,
    ) -> DocExport:
        with SessionLocal() as session:
            row = session.get(DocExportORM, export_id)
            if row is None:
                raise KeyError(export_id)
            row.status = status
            if artifact_path is not None:
                row.artifact_path = artifact_path
            row.error_message = error_message
            if status in {"done", "failed"}:
                row.finished_at = func.now()
            session.commit()
            return _to_doc_export(row)

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
        category_id: int | None = None,
        category: str | None = None,
        source: str | None = None,
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
                category_id=category_id,
                category=category,
                source=source,
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
        category_id: int | None = None,
        category: str | None = None,
        source: str | None = None,
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
            t.category_id = category_id
            t.category = category
            t.source = source
            t.updated_at = func.now()
            session.commit()
            return _to_term(t)

    def delete_term(self, term_id: int) -> None:
        with SessionLocal() as session:
            session.execute(delete(TermORM).where(TermORM.id == term_id))
            session.commit()

    # --- folders (REQ-039) ---

    def _next_folder_order(self, session, space_id: int, parent_id: int | None) -> int:
        query = select(func.max(FolderORM.order)).where(FolderORM.space_id == space_id)
        if parent_id is None:
            query = query.where(FolderORM.parent_id.is_(None))
        else:
            query = query.where(FolderORM.parent_id == parent_id)
        max_order = session.scalars(query).first()
        return (max_order or 0) + 1

    def list_folders(self, space_id: int) -> list[Folder]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(FolderORM)
                .where(FolderORM.space_id == space_id)
                .order_by(FolderORM.parent_id, FolderORM.order, FolderORM.name)
            ).all()
            return [_to_folder(r) for r in rows]

    def get_folder(self, folder_id: int) -> Folder | None:
        with SessionLocal() as session:
            row = session.get(FolderORM, folder_id)
            return _to_folder(row) if row else None

    def find_folder_by_name(self, space_id: int, parent_id: int | None, name: str) -> Folder | None:
        with SessionLocal() as session:
            query = select(FolderORM).where(FolderORM.space_id == space_id, FolderORM.name == name)
            if parent_id is None:
                query = query.where(FolderORM.parent_id.is_(None))
            else:
                query = query.where(FolderORM.parent_id == parent_id)
            row = session.scalars(query).first()
            return _to_folder(row) if row else None

    def create_folder(self, space_id: int, parent_id: int | None, name: str, created_by: int) -> Folder:
        with SessionLocal() as session:
            row = FolderORM(
                space_id=space_id,
                parent_id=parent_id,
                name=name,
                order=self._next_folder_order(session, space_id, parent_id),
                created_by=created_by,
            )
            session.add(row)
            session.commit()
            return _to_folder(row)

    def rename_folder(self, folder_id: int, name: str) -> Folder | None:
        with SessionLocal() as session:
            row = session.scalars(select(FolderORM).where(FolderORM.id == folder_id)).first()
            if row is None:
                return None
            row.name = name
            row.updated_at = func.now()
            session.commit()
            return _to_folder(row)

    def move_folder(self, folder_id: int, parent_id: int | None) -> Folder | None:
        with SessionLocal() as session:
            row = session.scalars(select(FolderORM).where(FolderORM.id == folder_id)).first()
            if row is None:
                return None
            row.parent_id = parent_id
            row.order = self._next_folder_order(session, row.space_id, parent_id)
            row.updated_at = func.now()
            session.commit()
            return _to_folder(row)

    def delete_folder(self, folder_id: int) -> None:
        with SessionLocal() as session:
            session.execute(delete(FolderORM).where(FolderORM.id == folder_id))
            session.commit()

    def is_folder_empty(self, space_id: int, folder_id: int) -> bool:
        with SessionLocal() as session:
            has_child = session.scalars(
                select(FolderORM.id)
                .where(FolderORM.space_id == space_id, FolderORM.parent_id == folder_id)
                .limit(1)
            ).first()
            if has_child is not None:
                return False
            has_doc = session.scalars(
                select(DocumentORM.id).where(DocumentORM.folder_id == folder_id).limit(1)
            ).first()
            return has_doc is None

    def is_descendant_folder(self, space_id: int, ancestor_id: int, candidate_id: int) -> bool:
        """``candidate`` 是否是 ``ancestor`` 的后代（含自身）。用 PG ``WITH RECURSIVE`` 递归 CTE 防 N+1。

        用于移动 folder 时的防环校验：移动 folder 到 target 时，若 target 是 folder
        自身或其后代则拒绝（4220）。
        """
        with SessionLocal() as session:
            result = session.scalars(
                sql_text(
                    """
                    WITH RECURSIVE descendants(id) AS (
                        SELECT CAST(:ancestor AS BIGINT)
                        UNION ALL
                        SELECT f.id FROM lumen_folders f
                        JOIN descendants d ON f.parent_id = d.id
                        WHERE f.space_id = CAST(:space AS BIGINT)
                    )
                    SELECT 1 FROM descendants WHERE id = CAST(:candidate AS BIGINT) LIMIT 1
                    """
                ).params(ancestor=ancestor_id, candidate=candidate_id, space=space_id)
            ).first()
            return result is not None

    def list_folder_document_ids(self, space_id: int, folder_id: int) -> list[int]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(DocumentORM.id).where(
                    DocumentORM.space_id == space_id, DocumentORM.folder_id == folder_id
                )
            ).all()
            return list(rows)

    def set_document_folder(self, document_id: int, folder_id: int | None) -> None:
        """预留：文档归属写入（Flow-D-012 导入保留结构 / 文档 CRUD 复用）。本轮 service 不调用。"""
        with SessionLocal() as session:
            doc = session.get(DocumentORM, document_id)
            if doc is None:
                raise KeyError(document_id)
            doc.folder_id = folder_id
            doc.updated_at = func.now()
            session.commit()

    def reorder_folders(self, space_id: int, ordered_folder_ids: list[int]) -> None:
        with SessionLocal() as session:
            for order, folder_id in enumerate(ordered_folder_ids, start=1):
                row = session.scalars(
                    select(FolderORM).where(FolderORM.id == folder_id, FolderORM.space_id == space_id)
                ).first()
                if row is not None:
                    row.order = order
                    row.updated_at = func.now()
            session.commit()

    # --- term categories (REQ-036 领域树, migration 017) ---

    def _next_term_category_order(self, session, space_id: int, parent_id: int | None) -> int:
        query = select(func.max(TermCategoryORM.order_idx)).where(TermCategoryORM.space_id == space_id)
        if parent_id is None:
            query = query.where(TermCategoryORM.parent_id.is_(None))
        else:
            query = query.where(TermCategoryORM.parent_id == parent_id)
        max_order = session.scalars(query).first()
        return (max_order or 0) + 1

    def list_term_categories(self, space_id: int) -> list[TermCategory]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(TermCategoryORM)
                .where(TermCategoryORM.space_id == space_id)
                .order_by(TermCategoryORM.parent_id, TermCategoryORM.order_idx, TermCategoryORM.name)
            ).all()
            return [_to_term_category(r) for r in rows]

    def get_term_category(self, category_id: int) -> TermCategory | None:
        with SessionLocal() as session:
            row = session.get(TermCategoryORM, category_id)
            return _to_term_category(row) if row else None

    def find_term_category_by_name(self, space_id: int, parent_id: int | None, name: str) -> TermCategory | None:
        with SessionLocal() as session:
            query = select(TermCategoryORM).where(TermCategoryORM.space_id == space_id, TermCategoryORM.name == name)
            if parent_id is None:
                query = query.where(TermCategoryORM.parent_id.is_(None))
            else:
                query = query.where(TermCategoryORM.parent_id == parent_id)
            row = session.scalars(query).first()
            return _to_term_category(row) if row else None

    def create_term_category(self, space_id: int, parent_id: int | None, name: str, created_by: int) -> TermCategory:
        with SessionLocal() as session:
            row = TermCategoryORM(
                space_id=space_id,
                parent_id=parent_id,
                name=name,
                order_idx=self._next_term_category_order(session, space_id, parent_id),
                created_by=created_by,
            )
            session.add(row)
            session.commit()
            return _to_term_category(row)

    def rename_term_category(self, category_id: int, name: str) -> TermCategory | None:
        with SessionLocal() as session:
            row = session.scalars(select(TermCategoryORM).where(TermCategoryORM.id == category_id)).first()
            if row is None:
                return None
            row.name = name
            row.updated_at = func.now()
            session.commit()
            return _to_term_category(row)

    def move_term_category(self, category_id: int, parent_id: int | None) -> TermCategory | None:
        with SessionLocal() as session:
            row = session.scalars(select(TermCategoryORM).where(TermCategoryORM.id == category_id)).first()
            if row is None:
                return None
            row.parent_id = parent_id
            row.order_idx = self._next_term_category_order(session, row.space_id, parent_id)
            row.updated_at = func.now()
            session.commit()
            return _to_term_category(row)

    def delete_term_category(self, category_id: int) -> None:
        with SessionLocal() as session:
            session.execute(delete(TermCategoryORM).where(TermCategoryORM.id == category_id))
            session.commit()

    def is_term_category_empty(self, space_id: int, category_id: int) -> bool:
        with SessionLocal() as session:
            has_child = session.scalars(
                select(TermCategoryORM.id)
                .where(TermCategoryORM.space_id == space_id, TermCategoryORM.parent_id == category_id)
                .limit(1)
            ).first()
            if has_child is not None:
                return False
            has_term = session.scalars(
                select(TermORM.id).where(TermORM.category_id == category_id).limit(1)
            ).first()
            return has_term is None

    def is_descendant_term_category(self, space_id: int, ancestor_id: int, candidate_id: int) -> bool:
        """``candidate`` 是否是 ``ancestor`` 的后代（含自身）。用 PG ``WITH RECURSIVE`` 递归 CTE 防 N+1。"""
        with SessionLocal() as session:
            result = session.scalars(
                sql_text(
                    """
                    WITH RECURSIVE descendants(id) AS (
                        SELECT CAST(:ancestor AS BIGINT)
                        UNION ALL
                        SELECT c.id FROM lumen_term_categories c
                        JOIN descendants d ON c.parent_id = d.id
                        WHERE c.space_id = CAST(:space AS BIGINT)
                    )
                    SELECT 1 FROM descendants WHERE id = CAST(:candidate AS BIGINT) LIMIT 1
                    """
                ).params(ancestor=ancestor_id, candidate=candidate_id, space=space_id)
            ).first()
            return result is not None

    def list_term_category_term_ids(self, space_id: int, category_id: int) -> list[int]:
        with SessionLocal() as session:
            rows = session.scalars(
                select(TermORM.id).where(
                    TermORM.space_id == space_id, TermORM.category_id == category_id
                )
            ).all()
            return list(rows)

    def reorder_term_categories(self, space_id: int, ordered_category_ids: list[int]) -> None:
        with SessionLocal() as session:
            for order, category_id in enumerate(ordered_category_ids, start=1):
                row = session.scalars(
                    select(TermCategoryORM).where(TermCategoryORM.id == category_id, TermCategoryORM.space_id == space_id)
                ).first()
                if row is not None:
                    row.order_idx = order
                    row.updated_at = func.now()
            session.commit()
