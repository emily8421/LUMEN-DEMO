"""In-memory demo repository used until PostgreSQL integration is wired."""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime

from backend.model.entities import Document, DocumentPermission, DocumentVersion, Space, SpaceMember, SpaceRole, User


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
        self._next_document_id = 201
        self._next_version_id = 3

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
        document = Document(
            id=self._next_document_id,
            space_id=space_id,
            title=title,
            content_md=content_md,
            owner_id=owner_id,
            permission=permission,
            current_version=1,
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
        )
        self._replace_document(updated_document)
        self._append_version(document_id, next_version, content_md, editor_id)
        return updated_document

    def delete_document(self, document_id: int) -> None:
        self.documents = [document for document in self.documents if document.id != document_id]
        self.document_versions = [version for version in self.document_versions if version.document_id != document_id]

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

    def _replace_document(self, updated_document: Document) -> None:
        self.documents = [
            updated_document if document.id == updated_document.id else document
            for document in self.documents
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


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


repository = DemoRepository()



