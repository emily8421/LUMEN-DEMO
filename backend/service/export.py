"""Export service for Sprint-17: single-document ``.md`` download and space ZIP backup.

对称于 ``backend/service/imports.py``：纯函数、首参 ``repository``（鸭子类型，由 API 层
注入单例）。仅覆盖 Phase1.5A 目标（REQ-038）——不引依赖（标准库 ``zipfile``）、不写
``lumen_doc_exports``、不生成长期公开链接、不做 PDF（留 Sprint-18 / RG-006）。

权限口径（见 ``docs/design/export-delivery.md`` Flow-007 与 ``docs/07-api-spec.md`` API-030）：
- 单文档：复用 ``get_visible_document``，不可见 → ``DocumentNotFoundError``（API 映射 4004）。
- 空间 ZIP：``ensure_space_access`` 校验成员（4003），再 ``list_visible_documents`` 只取当前
  用户可见文档；不可见文档不进入 ZIP，也不在响应中泄露隐藏数量。
"""

from __future__ import annotations

import io
import zipfile
from dataclasses import dataclass

from backend.model.entities import Document
from backend.service.document import (
    DocumentNotFoundError,
    VersionNotFoundError,
    get_visible_document,
    list_visible_documents,
)
from backend.service.space import SpaceAccessError, ensure_space_access


class ExportError(Exception):
    """Raised when the space ZIP archive cannot be produced (API 映射 5000)."""


@dataclass(frozen=True)
class DocumentExport:
    content: bytes
    filename: str


@dataclass(frozen=True)
class SpaceExport:
    archive: bytes
    document_count: int


def export_document_md(
    repository,
    user_id: int,
    current_space_id: int,
    document_id: int,
    version_no: int | None = None,
) -> DocumentExport:
    document = get_visible_document(repository, user_id, current_space_id, document_id)

    if version_no is None:
        content_md = document.content_md
    else:
        version = repository.get_document_version(document_id, version_no)
        if version is None:
            raise VersionNotFoundError("version not found")
        content_md = version.content_md

    return DocumentExport(
        content=content_md.encode("utf-8"),
        filename=_build_md_filename(document.title),
    )


def export_space_zip(repository, user_id: int, current_space_id: int) -> SpaceExport:
    memberships = repository.list_memberships()
    ensure_space_access(user_id, current_space_id, memberships)

    visible_documents = list_visible_documents(
        user_id=user_id,
        current_space_id=current_space_id,
        documents=repository.list_documents(),
        memberships=memberships,
    )

    buffer = io.BytesIO()
    try:
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            used_names: set[str] = set()
            for document in visible_documents:
                entry_name = _unique_zip_entry(_build_zip_entry(document.title), used_names)
                archive.writestr(entry_name, document.content_md.encode("utf-8"))
    except Exception as exc:  # zipfile 写入失败不应返回半截 ZIP
        raise ExportError("failed to build space export zip") from exc

    return SpaceExport(archive=buffer.getvalue(), document_count=len(visible_documents))


# --- 文件名 / ZIP 内路径安全化 -------------------------------------------------
#
# ZIP 内路径需同时防两类风险：
# 1. 路径穿越（``..`` / 绝对路径 / 盘符）——抽出非法段。
# 2. 文件系统 / ZIP 非法字符（Windows 与多数解压器共享 ``<>:"|?*\\``）。
#
# Sprint-16 导入会把相对路径作为标题前缀（如 ``smoke-folder/doc1``）；导出时保留 ``/``
# 分隔以维持目录感（EXP-C-002 建议），但每段单独清洗。

_UNSAFE_NAME_CHARS = '<>:"|?*\\'


def _build_md_filename(title: str) -> str:
    leaf = _sanitize_leaf(title) or "document"
    return f"{leaf}.md"


def _build_zip_entry(title: str) -> str:
    raw_parts = title.replace("\\", "/").split("/")
    parts: list[str] = []
    for raw in raw_parts:
        sanitized = _sanitize_leaf(raw)
        if sanitized and sanitized not in {".", ".."}:
            parts.append(sanitized)
    if not parts:
        parts = ["document"]
    parts[-1] = f"{parts[-1]}.md"
    return "/".join(parts)


def _sanitize_leaf(name: str) -> str:
    cleaned = name.strip()
    for char in _UNSAFE_NAME_CHARS:
        cleaned = cleaned.replace(char, "_")
    # 去掉前导点（避免 Windows 隐藏文件名）与首尾空白
    return cleaned.lstrip(".").strip()


def _unique_zip_entry(base: str, used: set[str]) -> str:
    if base not in used:
        used.add(base)
        return base
    stem, dot, ext = base.rpartition(".")
    index = 1
    while True:
        candidate = f"{stem} ({index}){dot}{ext}" if dot else f"{base} ({index})"
        if candidate not in used:
            used.add(candidate)
            return candidate
        index += 1
