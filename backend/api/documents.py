"""FastAPI router for Sprint-2 document CRUD and versions."""

from __future__ import annotations

from backend.model.entities import Document, DocumentPermission, DocumentVersion
from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.document import (
    DocumentCreate,
    DocumentMove,
    DocumentUpdate,
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
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception


if APIRouter is not None:
    router = APIRouter(prefix="/api/documents", tags=["documents"])

    class DocumentWriteRequest(BaseModel):
        title: str
        content_md: str
        permission: DocumentPermission = DocumentPermission.TEAM
        # ⑥：新建时指定所属文件夹（可空=根目录）；仅 create 使用，update 沿用既有字段不动。
        folder_id: int | None = None

    class DocumentMoveRequest(BaseModel):
        folder_id: int | None = None

    @router.get("")
    def list_documents(ctx: TokenContext = Depends(get_current_user)) -> dict[str, object]:
        documents = list_visible_documents(
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            documents=repository.list_documents(),
            memberships=repository.list_memberships(),
        )
        return {"code": 0, "msg": "ok", "data": [_document_summary(document) for document in documents]}

    @router.post("")
    def create_document_endpoint(
        request: DocumentWriteRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        document = create_document(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            request=DocumentCreate(
                title=request.title,
                content_md=request.content_md,
                permission=request.permission,
                folder_id=request.folder_id,
            ),
        )
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.get("/{document_id}")
    def get_document_endpoint(
        document_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        document = _read_document_or_404(ctx.user_id, ctx.current_space_id, document_id)
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.put("/{document_id}")
    def update_document_endpoint(
        document_id: int,
        request: DocumentWriteRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        document = update_document(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            document_id=document_id,
            request=DocumentUpdate(
                title=request.title,
                content_md=request.content_md,
                permission=request.permission,
            ),
        )
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.patch("/{document_id}/folder")
    def move_document_folder_endpoint(
        document_id: int,
        request: DocumentMoveRequest,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        document = move_document_to_folder(
            repository=repository,
            user_id=ctx.user_id,
            current_space_id=ctx.current_space_id,
            document_id=document_id,
            request=DocumentMove(folder_id=request.folder_id),
        )
        return {"code": 0, "msg": "ok", "data": _document_detail(document)}

    @router.delete("/{document_id}")
    def delete_document_endpoint(
        document_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        delete_document(repository, ctx.user_id, ctx.current_space_id, document_id)
        return {"code": 0, "msg": "ok", "data": {"deleted": True}}

    @router.get("/{document_id}/versions")
    def list_document_versions(
        document_id: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        versions = list_versions(repository, ctx.user_id, ctx.current_space_id, document_id)
        return {"code": 0, "msg": "ok", "data": [_version_detail(version) for version in versions]}

    @router.post("/{document_id}/versions/{version_no}/restore")
    def restore_document_version(
        document_id: int,
        version_no: int,
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        document = restore_version(repository, ctx.user_id, ctx.current_space_id, document_id, version_no)
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
        ctx: TokenContext = Depends(get_current_user),
    ) -> dict[str, object]:
        try:
            view = polish_selection(
                repository,
                ctx.user_id,
                ctx.current_space_id,
                document_id,
                PolishRequest(
                    mode=request.mode,
                    selection_md=request.selection_md,
                    instruction=request.instruction,
                    use_sources=request.use_sources,
                ),
            )
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
        return get_visible_document(repository, user_id, current_space_id, document_id)


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
