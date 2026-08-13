"""统一 API 响应契约模型（CQ-P1-006 / response_model·codegen）。

后端所有 JSON 端点统一返回 ``{code, msg, data}`` envelope（docs/07-api-spec.md §1 /
CQ-P1-005 NFR-007 契约）。本文件用 Pydantic 泛型把该 envelope 与各域 data 形状声明为
机器可执行 schema：端点标注 ``response_model=ApiEnvelope[X]`` 后，FastAPI 会在响应
序列化时按模型校验 / 过滤，OpenAPI 快照（``openapi/openapi.json``）随之携带精确
字段与类型，前端类型可由此生成或至少做 schema diff 防漂移（assessment §4.9 /
docs/05-tech-spec.md §4.2.3）。

约定：
- ``data`` 恒为显式类型（含 ``None`` 的端点用 ``ApiEnvelope[None]``），禁止裸 dict；
- 字段命名 / 可空性与既有 HTTP 响应逐字对齐（切片接入时以测试快照为准）；
- 域模型按端点 data 形状声明，优先复用（如 ``DocumentDetail`` 继承 ``DocumentSummary``）；
- 二进制端点（md/zip/pdf 下载）不走 envelope，不在此声明。
"""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiEnvelope(BaseModel, Generic[T]):
    """统一成功 envelope：``{code, msg, data}``。"""

    code: int = 0
    msg: str = "ok"
    data: T

# ---------------------------------------------------------------------------
# Slice B-1：内容域（documents / tags / folders / doc_links / timeline / search）
# ---------------------------------------------------------------------------


class DeletedOk(BaseModel):
    """``DELETE`` 类端点通用 data：``{deleted: true}``。"""

    deleted: bool


class OkStatus(BaseModel):
    """reorder 类端点通用 data：``{ok: true}``。"""

    ok: bool


# --- health（CQ-P1-001）---


class HealthView(BaseModel):
    """``/api/health/*`` 端点 data：存活 / 就绪状态。"""

    status: str
    db: str | None = None


# --- documents ---


class DocumentSummary(BaseModel):
    id: int
    space_id: int
    folder_id: int | None
    title: str
    permission: str
    type: str
    current_version: int
    owner_id: int


class DocumentDetail(DocumentSummary):
    content_md: str


class DocumentVersionView(BaseModel):
    id: int
    document_id: int
    version_no: int
    content_md: str
    editor_id: int
    created_at: str


class PolishSourceView(BaseModel):
    chunk_id: int
    document_id: int
    title: str
    snippet: str


class PolishView(BaseModel):
    draft_id: int
    output_md: str
    sources: list[PolishSourceView]
    status: str


# --- tags ---


class TagView(BaseModel):
    id: int
    name: str
    color: str | None
    description: str | None
    document_count: int
    status: str


class TagDetail(BaseModel):
    id: int
    name: str
    color: str | None
    description: str | None
    status: str


class TagListPage(BaseModel):
    items: list[TagView]
    total: int


class DocumentTagView(BaseModel):
    tag_id: int
    name: str
    color: str | None
    link_source: str


class DocumentTagListPage(BaseModel):
    items: list[DocumentTagView]
    total: int


class TagLinkView(BaseModel):
    tag_id: int
    document_id: int
    link_source: str


class DocumentTagItemView(BaseModel):
    id: int
    title: str
    permission: str
    owner_id: int
    updated_at: str


class TaggedDocumentListPage(BaseModel):
    items: list[DocumentTagItemView]
    total: int


# --- folders ---


class FolderView(BaseModel):
    id: int
    name: str
    parent_id: int | None
    order: int
    document_count: int
    child_folder_count: int
    created_at: str
    updated_at: str


class FolderDetail(BaseModel):
    id: int
    name: str
    parent_id: int | None
    order: int


class FolderListPage(BaseModel):
    items: list[FolderView]
    total: int


# --- doc_links ---


class DocLinkView(BaseModel):
    id: int
    source_document_id: int
    target_document_id: int | None
    target_title: str | None
    link_text: str
    link_type: str
    status: str


class DocLinkCreated(BaseModel):
    id: int
    status: str


# --- timeline ---


class TimelineEventView(BaseModel):
    date: str
    document_id: int
    title: str
    event_type: str
    permission: str
    actor: int | None


class TimelineDensityView(BaseModel):
    window_start: str
    window_end: str
    event_count: int
    level: int
    ratio: float


class TimelineView(BaseModel):
    items: list[TimelineEventView]
    density: list[TimelineDensityView]
    degraded: bool
    window: str


# --- search ---


class SearchResultView(BaseModel):
    doc_id: int
    title: str
    snippet: str
    chunk_id: int
    ordinal: int


class SearchPageView(BaseModel):
    items: list[SearchResultView]
    total: int
    page: int

# ---------------------------------------------------------------------------
# Slice B-2：术语 / 导入域（terms / term_categories / quick_entry / imports / rag）
# ---------------------------------------------------------------------------


# --- terms ---


class TermDetail(BaseModel):
    id: int
    space_id: int | None
    term: str
    definition: str
    aliases: list[str]
    owner_id: int
    status: str
    source_document_id: int | None
    category_id: int | None
    category: str | None
    source: str | None


class TermListPage(BaseModel):
    items: list[TermDetail]
    total: int
    page: int


# --- term_categories ---


class TermCategoryView(BaseModel):
    id: int
    name: str
    parent_id: int | None
    order_idx: int
    term_count: int
    child_category_count: int
    created_at: str
    updated_at: str


class TermCategoryDetail(BaseModel):
    id: int
    name: str
    parent_id: int | None
    order_idx: int


class TermCategoryListPage(BaseModel):
    items: list[TermCategoryView]
    total: int


# --- quick_entry ---


class QuickEntryView(BaseModel):
    id: int
    status: str
    created_document_id: int | None
    target_document_id: int | None
    title: str
    owner_id: int


# --- imports ---


class ImportFileView(BaseModel):
    import_id: int
    status: str
    parsed_doc_id: int | None
    chunk_count: int
    mode: str


class BatchImportItemView(BaseModel):
    filename: str
    relative_path: str | None
    title: str
    status: str
    import_id: int | None
    parsed_doc_id: int | None
    folder_id: int | None
    chunk_count: int
    error: str | None


class BatchImportView(BaseModel):
    batch_id: str
    total: int
    success_count: int
    failed_count: int
    skipped_count: int
    items: list[BatchImportItemView]


# --- rag ---


class RagSourceView(BaseModel):
    doc_id: int | None
    title: str
    snippet: str
    source_type: str


class QueryAnswerView(BaseModel):
    answer: str
    sources: list[RagSourceView]


class LlmConfigView(BaseModel):
    name: str
    provider: str
    model: str
    base_url: str
    enabled: bool

# ---------------------------------------------------------------------------
# Slice B-3：账户 / 空间域（auth / spaces / space_members / users / admin / export）
# ---------------------------------------------------------------------------


# --- auth ---


class RegisterView(BaseModel):
    user_id: int
    name: str
    email: str | None


class LoginView(BaseModel):
    token: str
    user_id: int
    name: str
    current_space_id: int | None
    role: str


class RefreshView(BaseModel):
    token: str
    user_id: int
    name: str
    current_space_id: int | None


class SessionView(BaseModel):
    id: int
    created_at: str
    expires_at: str
    last_used_at: str | None
    client_ua: str | None
    client_ip: str | None
    current: bool


class PasswordResetMessageView(BaseModel):
    message: str


# --- spaces ---


class SpaceView(BaseModel):
    id: int
    code: str
    name: str


class SwitchSpaceView(BaseModel):
    current_space_id: int


# --- space_members / users ---


class SpaceMemberView(BaseModel):
    user_id: int
    name: str
    email: str | None
    role: str
    joined_at: str


class UserSearchView(BaseModel):
    id: int
    name: str
    email: str | None


# --- admin ---


class AdminUserView(BaseModel):
    id: int
    name: str
    email: str | None
    role: str
    status: str
    last_login_at: str


class AdminJoinedSpaceView(BaseModel):
    space_id: int
    space_code: str
    space_name: str
    role: str
    joined_at: str


class AdminAvailableSpaceView(BaseModel):
    space_id: int
    space_code: str
    space_name: str


class AdminUserSpacesView(BaseModel):
    joined: list[AdminJoinedSpaceView]
    available: list[AdminAvailableSpaceView]


# --- export ---


class PdfExportView(BaseModel):
    export_id: int
    status: str
    artifact_path: str | None
