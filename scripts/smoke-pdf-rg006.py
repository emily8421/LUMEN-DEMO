"""RG-006 smoke for Chinese PDF generation and rendering.

Generates a representative Chinese PDF with ReportLab, renders it with Poppler,
extracts text with pdfplumber, and performs a basic nonblank PNG check. This is
an environment gate smoke only; it does not implement API-019 product logic.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from PIL import Image
from pypdf import PdfReader
import pdfplumber
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "tmp" / "pdfs"
FONT_CANDIDATES = [
    Path("C:/Windows/Fonts/simhei.ttf"),
    Path("C:/Windows/Fonts/msyh.ttc"),
    Path("C:/Windows/Fonts/simsun.ttc"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run RG-006 Chinese PDF dependency smoke.")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Directory for PDF and PNG outputs.")
    parser.add_argument("--json-out", default="", help="Optional JSON summary path.")
    return parser.parse_args()


def find_font() -> Path:
    for font_path in FONT_CANDIDATES:
        if font_path.exists():
            return font_path
    raise RuntimeError("No Chinese font found. Checked: " + ", ".join(str(path) for path in FONT_CANDIDATES))


def register_font(font_path: Path) -> str:
    font_name = "LumenCJK"
    pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
    return font_name


def build_styles(font_name: str) -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "LumenTitle",
            parent=base["Title"],
            fontName=font_name,
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "h2": ParagraphStyle(
            "LumenHeading2",
            parent=base["Heading2"],
            fontName=font_name,
            fontSize=14,
            leading=19,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "LumenBody",
            parent=base["BodyText"],
            fontName=font_name,
            fontSize=10.5,
            leading=16,
            spaceAfter=7,
        ),
        "small": ParagraphStyle(
            "LumenSmall",
            parent=base["BodyText"],
            fontName=font_name,
            fontSize=9,
            leading=13,
        ),
    }


def header_footer(canvas: Any, doc: SimpleDocTemplate, font_name: str) -> None:
    canvas.saveState()
    canvas.setFont(font_name, 8)
    canvas.setFillColor(colors.HexColor("#5f6368"))
    canvas.drawString(18 * mm, 12 * mm, "LUMEN RG-006 中文 PDF 样例")
    canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def build_pdf(pdf_path: Path, font_path: Path, font_name: str) -> None:
    styles = build_styles(font_name)
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="LUMEN RG-006 中文 PDF 样例",
    )

    table_data = [
        ["章节", "内容", "状态"],
        ["时间线", "支持中文标题、日期与摘要", "通过"],
        ["引用", "保留来源标题与片段", "通过"],
        ["权限", "导出前继承文档可见性", "待 Sprint-18 编码"],
    ]
    table = Table(table_data, colWidths=[30 * mm, 95 * mm, 38 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef2f7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#202124")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#c7ccd1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story: list[Any] = [
        Paragraph("LUMEN 中文 PDF 导出验证", styles["title"]),
        Paragraph("验证目标", styles["h2"]),
        Paragraph(
            "本样例用于 RG-006：验证 ReportLab 在当前 Windows + Python 3.14 环境下可以生成包含中文正文、表格、页眉页脚和来源引用的 PDF。",
            styles["body"],
        ),
        Paragraph("代表性内容", styles["h2"]),
        Paragraph("1. 智能照明项目复盘：场景联动平均延迟 280ms，异常集中在旧网关固件。", styles["body"]),
        Paragraph("2. 写作引用：来源《项目周报》第 3 节，建议在正式导出中保留文档标题与版本号。", styles["body"]),
        table,
        Spacer(1, 10),
        Paragraph("字体", styles["h2"]),
        Paragraph(f"本次注册字体：{font_path}", styles["small"]),
        PageBreak(),
        Paragraph("第二页排版检查", styles["h2"]),
        Paragraph(
            "这页用于确认分页、页脚页码和连续中文段落不会出现乱码、黑块、重叠或明显裁切。Sprint-18 编码时仍需补 Markdown 子集映射、权限过滤、失败 5030 和自动化测试。",
            styles["body"],
        ),
    ]
    doc.build(story, onFirstPage=lambda c, d: header_footer(c, d, font_name), onLaterPages=lambda c, d: header_footer(c, d, font_name))


def run_command(args: list[str]) -> str:
    result = subprocess.run(args, check=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.stdout.strip()


def render_pdf(pdf_path: Path, png_prefix: Path) -> list[Path]:
    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise RuntimeError("pdftoppm not found on PATH.")
    run_command([pdftoppm, "-png", str(pdf_path), str(png_prefix)])
    rendered = sorted(png_prefix.parent.glob(png_prefix.name + "-*.png"))
    if not rendered:
        raise RuntimeError("pdftoppm finished but no PNG pages were produced.")
    return rendered


def inspect_png(path: Path) -> dict[str, Any]:
    with Image.open(path) as image:
        grayscale = image.convert("L")
        extrema = grayscale.getextrema()
        histogram = grayscale.histogram()
        dark_pixels = sum(histogram[:245])
        total_pixels = image.width * image.height
        dark_ratio = dark_pixels / total_pixels
        if extrema == (255, 255) or dark_ratio < 0.001:
            raise RuntimeError(f"Rendered PNG appears blank: {path}")
        return {
            "path": str(path),
            "width": image.width,
            "height": image.height,
            "extrema": extrema,
            "dark_ratio": round(dark_ratio, 5),
        }


def extract_text(pdf_path: Path) -> str:
    texts: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            texts.append(page.extract_text() or "")
    return "\n".join(texts)


def main() -> int:
    args = parse_args()
    out_dir = Path(args.out_dir)
    if not out_dir.is_absolute():
        out_dir = REPO_ROOT / out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    font_path = find_font()
    font_name = register_font(font_path)
    pdf_path = out_dir / "rg006-chinese-reportlab-sample.pdf"
    png_prefix = out_dir / "rg006-chinese-reportlab-sample"
    build_pdf(pdf_path, font_path, font_name)

    reader = PdfReader(str(pdf_path))
    png_pages = render_pdf(pdf_path, png_prefix)
    png_inspection = [inspect_png(path) for path in png_pages]
    text = extract_text(pdf_path)
    required_snippets = ["LUMEN 中文 PDF 导出验证", "智能照明项目复盘", "场景联动平均延迟", "第二页排版检查"]
    missing = [snippet for snippet in required_snippets if snippet not in text]
    if missing:
        raise RuntimeError("Extracted PDF text missed snippets: " + ", ".join(missing))

    summary = {
        "status": "passed",
        "pdf_path": str(pdf_path),
        "pages": len(reader.pages),
        "font_path": str(font_path),
        "rendered_pages": [str(path) for path in png_pages],
        "png_inspection": png_inspection,
        "text_snippet_count": len(required_snippets),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if args.json_out:
        json_path = Path(args.json_out)
        if not json_path.is_absolute():
            json_path = REPO_ROOT / json_path
        json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
