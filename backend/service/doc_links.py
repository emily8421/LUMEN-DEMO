"""REQ-026 internal links / backlinks service (Phase2A).

wikilink 自动解析在 ``backend/service/document.py`` 的 ``sync_document_wikilinks``
（避免与 document service 循环 import）。本模块负责**查询**（出链 / 反链 + 权限折算）
与**手动登记**（manual；wikilink 一律由正文解析，不接受手动 POST）。

权限口径（见 ``docs/07-api-spec.md`` API-018、``docs/06-db-design.md`` lumen_doc_links）：
- 出链：resolved 目标对当前读者不可见 → 折算 ``no_access`` 且不返回 ``target_title``。
- 反链：来源文档对当前读者不可见 → 整条过滤，不泄露反链来源。
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.model.entities import DocLink
from backend.model.error_codes import ApiError, ErrorCode
from backend.service.document import get_visible_document
from backend.service.permission import can_view_document


class DocLinkValidationError(ApiError):
    """手动登记链接请求非法（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


@dataclass(frozen=True)
class DocLinkView:
    id: int
    source_document_id: int
    target_document_id: int | None
    target_title: str | None
    link_text: str
    link_type: str
    status: str


@dataclass(frozen=True)
class DocLinkCreateRequest:
    source_document_id: int
    link_text: str
    target_document_id: int | None = None
    target_title: str | None = None
    link_type: str = "manual"


def list_links(repository, user_id: int, current_space_id: int, document_id: int, direction: str) -> list[DocLinkView]:
    # Sprint-27 P0：查询前先校验文档可见性（不可见 → DocumentNotFoundError → API 4004）。
    # 否则同空间成员可枚举他人 PRIVATE 文档 id，从出链 link_text 泄露私有正文片段。
    get_visible_document(repository, user_id, current_space_id, document_id)
    memberships = repository.list_memberships()
    links = repository.list_doc_links(current_space_id, document_id, direction)

    views: list[DocLinkView] = []
    for link in links:
        if direction == "backlink":
            source = repository.get_document(link.source_document_id)
            if source is None or not can_view_document(user_id, current_space_id, source, memberships):
                continue  # 反链来源不可见 → 过滤，不泄露
            views.append(_to_view(link))
            continue

        # outbound：resolved 目标不可见 → 折算 no_access，不泄露 target_title
        if link.status == "resolved" and link.target_document_id is not None:
            target = repository.get_document(link.target_document_id)
            if target is None or not can_view_document(user_id, current_space_id, target, memberships):
                views.append(
                    DocLinkView(
                        id=link.id,
                        source_document_id=link.source_document_id,
                        target_document_id=None,
                        target_title=None,
                        link_text=link.link_text,
                        link_type=link.link_type,
                        status="no_access",
                    )
                )
                continue
        views.append(_to_view(link))
    return views


def upsert_link(repository, user_id: int, current_space_id: int, request: DocLinkCreateRequest) -> DocLink:
    if request.link_type != "manual":
        raise DocLinkValidationError("only manual links can be registered; wikilinks are parsed from document content")

    # 登记链接需对来源文档有读权限（不可见 → DocumentNotFoundError → 4004）
    get_visible_document(repository, user_id, current_space_id, request.source_document_id)

    target_id = request.target_document_id
    target_title = (request.target_title or request.link_text).strip()
    if target_id is None and target_title:
        target_id = repository.find_document_id_by_title(current_space_id, target_title)
    if target_id == request.source_document_id:
        raise DocLinkValidationError("cannot link a document to itself")

    return repository.upsert_manual_link(
        current_space_id,
        request.source_document_id,
        target_id,
        target_title,
        request.link_text,
    )


def _to_view(link: DocLink) -> DocLinkView:
    return DocLinkView(
        id=link.id,
        source_document_id=link.source_document_id,
        target_document_id=link.target_document_id,
        target_title=link.target_title,
        link_text=link.link_text,
        link_type=link.link_type,
        status=link.status,
    )
