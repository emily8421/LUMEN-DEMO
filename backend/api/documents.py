"""FastAPI router for Sprint-2 document CRUD and versions."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.model.entities import Document, DocumentPermission, DocumentVersion
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.repository import repository
from backend.service.document import (
    DocumentAccessError,
    DocumentCreate,
    DocumentMove,
    DocumentNotFoundError,
    DocumentUpdate,
    DocumentValidationError,
    VersionNotFoundError,
    create_document,
    delete_document,
    get_visible_document,
    list_versions,
    list_visible_documents,
    move_document_to_folder,
    restore_version,
    update_document,
)
from backend.service.ai_polish import (
    LlmUnavailableError,
    PolishRequest,
    PolishValidationError,
    PolishView,
    polish_selection,
)

try:
    from fastapi import APIRouter, Header, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    Header = None
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/documents", tags=["documents"])

    class DocumentWriteRequest(BaseModel):
        title: str
        content_md: str
        permission: DocumentPermission = DocumentPermission.TEAM

    class DocumentMoveRequest(BaseModel):
        folder_id: int | None = None

    @router.get("")
    def list_documents(authorization: str = Header(default="")) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        documents = list_visible_documents(
            user_id=payload.user_id,
            current_space_id=payload.current_space_id,
            documents=repository.list_documents(),
            memberships=repository.list_memberships(),
        )
        return {"code": 0, "msg": "ok", "data": [_document_summary(document) for document in documents]}

    @router.post("")
    def create_document_endpoint(
        request: DocumentWriteRequest,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        document = create_document(
            repository=repository,
            user_id=payload.user_id,
            current_space_id=payload.current_space_id,
            request=DocumentCreate(
                title=request.title,
                content_md=request.content_md,
                permission=request.permission,
            ),
        )
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.get("/{document_id}")
    def get_document_endpoint(
        document_id: int,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        document = _read_document_or_404(payload.user_id, payload.current_space_id, document_id)
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.put("/{document_id}")
    def update_document_endpoint(
        document_id: int,
        request: DocumentWriteRequest,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            document = update_document(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
                document_id=document_id,
                request=DocumentUpdate(
                    title=request.title,
                    content_md=request.content_md,
                    permission=request.permission,
                ),
            )
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except DocumentAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "no write permission on external document"}) from exc
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.patch("/{document_id}/folder")
    def move_document_folder_endpoint(
        document_id: int,
        request: DocumentMoveRequest,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            document = move_document_to_folder(
                repository=repository,
                user_id=payload.user_id,
                current_space_id=payload.current_space_id,
                document_id=document_id,
                request=DocumentMove(folder_id=request.folder_id),
            )
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except DocumentAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "no write permission on external document"}) from exc
        except DocumentValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.delete("/{document_id}")
    def delete_document_endpoint(
        document_id: int,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            delete_document(repository, payload.user_id, payload.current_space_id, document_id)
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except DocumentAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "no write permission on external document"}) from exc
        return {"code": 0, "msg": "ok", "data": {"deleted": True}}

    @router.get("/{document_id}/versions")
    def list_document_versions(
        document_id: int,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            versions = list_versions(repository, payload.user_id, payload.current_space_id, document_id)
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        return {"code": 0, "msg": "ok", "data": [_version_detail(version) for version in versions]}

    @router.post("/{document_id}/versions/{version_no}/restore")
    def restore_document_version(
        document_id: int,
        version_no: int,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            document = restore_version(repository, payload.user_id, payload.current_space_id, document_id, version_no)
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except VersionNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "version not found"}) from exc
        except DocumentAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "no write permission on external document"}) from exc
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    class PolishRequestBody(BaseModel):
        mode: str
        selection_md: str = ""
        instruction: str | None = None
        use_sources: bool = True

    @router.post("/{document_id}/polish")
    def polish_document_endpoint(
        document_id: int,
        request: PolishRequestBody,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            view = polish_selection(
                repository,
                payload.user_id,
                payload.current_space_id,
                document_id,
                PolishRequest(
                    mode=request.mode,
                    selection_md=request.selection_md,
                    instruction=request.instruction,
                    use_sources=request.use_sources,
                ),
            )
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc
        except DocumentAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": "no write permission on external document"}) from exc
        except PolishValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc
        except LlmUnavailableError as exc:
            raise HTTPException(status_code=503, detail={"code": 5030, "msg": "AI service unavailable"}) from exc
        return {"code": 0, "msg": "ok", "data": _polish_view(view)}

    def _polish_view(view: PolishView) -> dict[str, object]:
        return {
            "draft_id": view.draft_id,
            "output_md": view.output_md,
            "sources": [
                {
                    "chunk_id": source.chunk_id,
                    "document_id": source.document_id,
                    "title": source.title,
                    "snippet": source.snippet,
                }
                for source in view.sources
            ],
            "status": view.status,
        }

    def _read_document_or_404(user_id: int, current_space_id: int, document_id: int) -> Document:
        try:
            return get_visible_document(repository, user_id, current_space_id, document_id)
        except DocumentNotFoundError as exc:
            raise HTTPException(status_code=404, detail={"code": 4004, "msg": "document not found"}) from exc

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc

    def _document_summary(document: Document) -> dict[str, object]:
        return {
            "id": document.id,
            "space_id": document.space_id,
            "folder_id": document.folder_id,
            "title": document.title,
            "permission": document.permission.value,
            "type": document.type,
            "current_version": document.current_version,
            "owner_id": document.owner_id,
        }

    def _document_detail(document: Document) -> dict[str, object]:
        data = _document_summary(document)
        data["content_md"] = document.content_md
        return data

    def _version_detail(version: DocumentVersion) -> dict[str, object]:
        return {
            "id": version.id,
            "document_id": version.document_id,
            "version_no": version.version_no,
            "content_md": version.content_md,
            "editor_id": version.editor_id,
            "created_at": version.created_at,
        }
else:
    router = None
