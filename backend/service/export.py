"""Export service for Sprint-17/18 document delivery.

对称于 ``backend/service/imports.py``：纯函数、首参 ``repository``（鸭子类型，由 API 层
注入单例）。覆盖 Phase1.5A 目标（REQ-038：单文档 ``.md`` / 空间 ZIP）与 Phase1.5B
目标（REQ-027：单文档 PDF）。

权限口径（见 ``docs/design/export-delivery.md`` Flow-007 与 ``docs/07-api-spec.md`` API-030）：
- 单文档：复用 ``get_visible_document``，不可见 → ``DocumentNotFoundError``（API 映射 4004）。
- 空间 ZIP：``ensure_space_access`` 校验成员（4003），再 ``repository.list_visible_documents``
  只取当前用户可见文档；不可见文档不进入 ZIP，也不在响应中泄露隐藏数量。
- PDF：复用同一文档可见性校验；创建 ``lumen_doc_exports`` 任务记录并绑定版本；产物落
  gitignored ``tmp/pdf_exports``；下载时再次复用文档可见性校验，不生成公开长期链接。
"""

from __future__ import annotations

import html
import io
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path

from backend.model.entities import Document
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.service.document import (
    VersionNotFoundError,
    get_visible_document,
)
from backend.service.space import ensure_space_access


class ExportError(ApiError):
    """空间 ZIP / PDF 导出无法产出（API 映射 5000）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.INTERNAL, message, status_code)


class PdfExportValidationError(ApiError):
    """API-019 请求字段非法（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


class PdfExportDependencyError(ApiError):
    """ReportLab / 字体依赖不可用（API 映射 5030）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.SERVICE_UNAVAILABLE, message, status_code)


class PdfExportNotFoundError(ApiError):
    """PDF 导出任务 / 产物不存在或不可访问（API 映射 4004）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.NOT_FOUND, message, status_code)


class PdfExportNotReadyError(ApiError):
    """PDF 导出任务存在但尚无可用产物（API 映射 4090）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.CONFLICT, message, status_code)


@dataclass(frozen=True)
class DocumentExport:
    content: bytes
    filename: str


@dataclass(frozen=True)
class SpaceExport:
    archive: bytes
    document_count: int


@dataclass(frozen=True)
class PdfExportOptions:
    include_sources: bool = False
    theme: str = "default"


@dataclass(frozen=True)
class PdfExportResult:
    export_id: int
    status: str
    artifact_path: str | None


@dataclass(frozen=True)
class PdfArtifactDownload:
    content: bytes
    filename: str
    export_id: int


DEFAULT_PDF_EXPORT_DIR = Path("tmp/pdf_exports")
_SUPPORTED_PDF_THEMES = {"default"}
_PDF_FONT_CANDIDATES = (
    Path("C:/Windows/Fonts/simhei.ttf"),
    Path("C:/Windows/Fonts/msyh.ttc"),
    Path("C:/Windows/Fonts/simsun.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.otf"),
    Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
)


def export_document_md(
    repository: RepositoryProtocol,
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


def export_space_zip(repository: RepositoryProtocol, user_id: int, current_space_id: int) -> SpaceExport:
    memberships = repository.list_memberships()
    ensure_space_access(user_id, current_space_id, memberships)

    visible_documents = repository.list_visible_documents(user_id, current_space_id)

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


def create_pdf_export(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    document_id: int,
    version_no: int | None = None,
    options: PdfExportOptions | None = None,
    output_dir: str | Path = DEFAULT_PDF_EXPORT_DIR,
    font_paths: list[str | Path] | None = None,
) -> PdfExportResult:
    """Create a synchronous PDF export task for API-019.

    首版同步生成 PDF，但仍写入 ``lumen_doc_exports``，便于后续无破坏升级为异步任务。
    """

    pdf_options = options or PdfExportOptions()
    if version_no is not None and version_no < 1:
        raise PdfExportValidationError("version_no must be positive")
    if pdf_options.theme not in _SUPPORTED_PDF_THEMES:
        raise PdfExportValidationError("unsupported pdf theme")

    document = get_visible_document(repository, user_id, current_space_id, document_id)
    export_version_no, content_md = _read_export_version(repository, document, version_no)
    export_task = repository.create_doc_export(
        space_id=document.space_id,
        document_id=document.id,
        requested_by=user_id,
        version_no=export_version_no,
        status="running",
    )
    artifact_path = _build_pdf_artifact_path(Path(output_dir), document.title, export_version_no, export_task.id)

    try:
        _render_markdown_pdf(
            title=document.title,
            content_md=content_md,
            output_path=artifact_path,
            font_paths=font_paths,
        )
    except PdfExportDependencyError as exc:
        _delete_if_exists(artifact_path)
        failed = repository.update_doc_export(export_task.id, status="failed", error_message=str(exc))
        raise PdfExportDependencyError(failed.error_message or "PDF export dependency unavailable") from exc
    except Exception as exc:
        _delete_if_exists(artifact_path)
        repository.update_doc_export(export_task.id, status="failed", error_message="failed to build PDF export")
        raise ExportError("failed to build PDF export") from exc

    done = repository.update_doc_export(
        export_task.id,
        status="done",
        artifact_path=_path_for_artifact(artifact_path),
        error_message=None,
    )
    return PdfExportResult(export_id=done.id, status=done.status, artifact_path=done.artifact_path)


def download_pdf_export(
    repository: RepositoryProtocol,
    user_id: int,
    current_space_id: int,
    export_id: int,
    output_dir: str | Path = DEFAULT_PDF_EXPORT_DIR,
) -> PdfArtifactDownload:
    """Read a completed PDF export artifact for the current user's visible document.

    导出记录 ID 不是公开下载链接：每次下载都重新校验空间与源文档可见性，并要求
    artifact 路径仍在受控导出目录下。
    """

    if export_id < 1:
        raise PdfExportValidationError("export_id must be positive")

    export_task = repository.get_doc_export(export_id)
    if export_task is None or export_task.space_id != current_space_id or export_task.format != "pdf":
        raise PdfExportNotFoundError("PDF export not found")

    get_visible_document(repository, user_id, current_space_id, export_task.document_id)

    if export_task.status != "done" or not export_task.artifact_path:
        raise PdfExportNotReadyError("PDF export is not ready")

    artifact_path = _resolve_artifact_path(export_task.artifact_path, Path(output_dir))
    if not artifact_path.is_file():
        raise PdfExportNotFoundError("PDF artifact not found")

    try:
        content = artifact_path.read_bytes()
    except OSError as exc:
        raise ExportError("failed to read PDF artifact") from exc

    return PdfArtifactDownload(content=content, filename=artifact_path.name, export_id=export_task.id)


def _read_export_version(repository: RepositoryProtocol, document: Document, version_no: int | None) -> tuple[int, str]:
    if version_no is None:
        return document.current_version, document.content_md

    version = repository.get_document_version(document.id, version_no)
    if version is None:
        raise VersionNotFoundError("version not found")
    return version.version_no, version.content_md


def _render_markdown_pdf(
    title: str,
    content_md: str,
    output_path: Path,
    font_paths: list[str | Path] | None = None,
) -> None:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except Exception as exc:  # pragma: no cover - environment dependent
        raise PdfExportDependencyError("ReportLab is not installed") from exc

    font_name = _resolve_pdf_font(font_paths=font_paths)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_name(f"{output_path.stem}.tmp.pdf")
    _delete_if_exists(tmp_path)

    stylesheet = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "LumenTitle",
            parent=stylesheet["Title"],
            fontName=font_name,
            fontSize=18,
            leading=24,
            spaceAfter=12,
        ),
        "h1": ParagraphStyle("LumenH1", parent=stylesheet["Heading1"], fontName=font_name, fontSize=15, leading=21),
        "h2": ParagraphStyle("LumenH2", parent=stylesheet["Heading2"], fontName=font_name, fontSize=13, leading=18),
        "h3": ParagraphStyle("LumenH3", parent=stylesheet["Heading3"], fontName=font_name, fontSize=11.5, leading=16),
        "body": ParagraphStyle(
            "LumenBody",
            parent=stylesheet["BodyText"],
            fontName=font_name,
            fontSize=10.5,
            leading=16,
            spaceAfter=7,
        ),
        "bullet": ParagraphStyle(
            "LumenBullet",
            parent=stylesheet["BodyText"],
            fontName=font_name,
            fontSize=10,
            leading=15,
            leftIndent=12,
            spaceAfter=4,
        ),
        "quote": ParagraphStyle(
            "LumenQuote",
            parent=stylesheet["BodyText"],
            fontName=font_name,
            fontSize=10,
            leading=15,
            leftIndent=12,
            textColor=colors.HexColor("#4B5563"),
            borderPadding=6,
            backColor=colors.HexColor("#F3F4F6"),
            spaceAfter=8,
        ),
        "table": ParagraphStyle(
            "LumenTable",
            parent=stylesheet["BodyText"],
            fontName=font_name,
            fontSize=9,
            leading=12,
        ),
    }

    story = [Paragraph(_escape_inline(title), styles["title"]), Spacer(1, 4 * mm)]
    story.extend(_markdown_to_pdf_story(content_md, styles, Table, TableStyle, colors, Paragraph, Spacer))

    doc = SimpleDocTemplate(
        str(tmp_path),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title=title,
    )
    try:
        doc.build(
            story,
            onFirstPage=lambda canvas, page_doc: _draw_pdf_page(canvas, page_doc, title, font_name),
            onLaterPages=lambda canvas, page_doc: _draw_pdf_page(canvas, page_doc, title, font_name),
        )
        tmp_path.replace(output_path)
    except Exception:
        _delete_if_exists(tmp_path)
        raise


def _resolve_pdf_font(font_paths: list[str | Path] | None = None) -> str:
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.cidfonts import UnicodeCIDFont
        from reportlab.pdfbase.ttfonts import TTFont
    except Exception as exc:  # pragma: no cover - environment dependent
        raise PdfExportDependencyError("ReportLab font support is unavailable") from exc

    candidates = [Path(path) for path in font_paths] if font_paths is not None else list(_PDF_FONT_CANDIDATES)
    for index, path in enumerate(candidates, start=1):
        if not path.exists():
            continue
        font_name = f"LumenCJK{index}"
        try:
            pdfmetrics.registerFont(TTFont(font_name, str(path)))
            return font_name
        except Exception:
            continue

    if font_paths is not None:
        raise PdfExportDependencyError("Chinese PDF font is unavailable")

    try:
        pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
        return "STSong-Light"
    except Exception as exc:  # pragma: no cover - environment dependent
        raise PdfExportDependencyError("Chinese PDF font is unavailable") from exc


def _markdown_to_pdf_story(content_md: str, styles, Table, TableStyle, colors, Paragraph, Spacer) -> list:
    story: list = []
    paragraph_lines: list[str] = []
    lines = content_md.splitlines()
    index = 0

    def flush_paragraph() -> None:
        if not paragraph_lines:
            return
        text = " ".join(line.strip() for line in paragraph_lines if line.strip())
        if text:
            story.append(Paragraph(_escape_inline(text), styles["body"]))
        paragraph_lines.clear()

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            story.append(Spacer(1, 4))
            index += 1
            continue

        heading = re.match(r"^(#{1,3})\s+(.+)$", stripped)
        if heading:
            flush_paragraph()
            level = len(heading.group(1))
            story.append(Paragraph(_escape_inline(heading.group(2).strip()), styles[f"h{level}"]))
            index += 1
            continue

        if _looks_like_table_row(stripped):
            flush_paragraph()
            rows: list[list[str]] = []
            while index < len(lines) and _looks_like_table_row(lines[index].strip()):
                row = _split_table_row(lines[index].strip())
                if not _is_table_separator(row):
                    rows.append(row)
                index += 1
            if rows:
                story.append(_build_table(rows, styles, Table, TableStyle, colors, Paragraph))
                story.append(Spacer(1, 6))
            continue

        unordered = re.match(r"^[-*]\s+(.+)$", stripped)
        ordered = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if unordered:
            flush_paragraph()
            story.append(Paragraph(f"- {_escape_inline(unordered.group(1))}", styles["bullet"]))
            index += 1
            continue
        elif ordered:
            flush_paragraph()
            story.append(Paragraph(f"{ordered.group(1)}. {_escape_inline(ordered.group(2))}", styles["bullet"]))
            index += 1
            continue

        if stripped.startswith(">"):
            flush_paragraph()
            story.append(Paragraph(_escape_inline(stripped.lstrip("> ").strip()), styles["quote"]))
            index += 1
            continue

        paragraph_lines.append(line)
        index += 1

    flush_paragraph()
    return story


def _build_table(rows: list[list[str]], styles, Table, TableStyle, colors, Paragraph):
    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]
    data = [[Paragraph(_escape_inline(cell), styles["table"]) for cell in row] for row in normalized]
    table = Table(data, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), styles["table"].fontName),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def _draw_pdf_page(canvas, doc, title: str, font_name: str) -> None:
    canvas.saveState()
    canvas.setFont(font_name, 8)
    width, height = doc.pagesize
    safe_title = title[:60]
    canvas.drawString(doc.leftMargin, height - 10, safe_title)
    canvas.drawRightString(width - doc.rightMargin, 10, f"Page {doc.page}")
    canvas.restoreState()


def _build_pdf_artifact_path(output_dir: Path, title: str, version_no: int, export_id: int) -> Path:
    stem = _sanitize_leaf(title.replace("/", "_").replace("\\", "_")) or "document"
    return output_dir / f"{stem}-v{version_no}-export-{export_id}.pdf"


def _path_for_artifact(path: Path) -> str:
    return str(path).replace("\\", "/")


def _resolve_artifact_path(artifact_path: str, output_dir: Path) -> Path:
    base_dir = output_dir.resolve()
    candidate = Path(artifact_path)
    resolved = candidate.resolve()
    try:
        resolved.relative_to(base_dir)
    except ValueError as exc:
        raise PdfExportNotFoundError("PDF artifact not found") from exc
    return resolved


def _delete_if_exists(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        return


def _escape_inline(text: str) -> str:
    return html.escape(text.strip(), quote=False)


def _looks_like_table_row(line: str) -> bool:
    return line.startswith("|") and line.endswith("|") and line.count("|") >= 2


def _split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip("|").split("|")]


def _is_table_separator(row: list[str]) -> bool:
    return bool(row) and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in row)


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
