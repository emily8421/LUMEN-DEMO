import importlib.util
import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from urllib.parse import quote


def _zip_names(archive: bytes) -> list[str]:
    with zipfile.ZipFile(io.BytesIO(archive)) as zf:
        return zf.namelist()


def _zip_read(archive: bytes, name: str) -> str:
    with zipfile.ZipFile(io.BytesIO(archive)) as zf:
        return zf.read(name).decode("utf-8")


class ExportServiceTest(unittest.TestCase):
    """Sprint-17 REQ-038：单文档 .md 导出与空间 ZIP 导出的业务逻辑（DemoRepository）。"""

    def test_export_document_md_returns_current_content(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_document_md

        repository = DemoRepository()

        export = export_document_md(repository, user_id=1, current_space_id=10, document_id=100)

        self.assertEqual(export.content, b"# Nova\n\nInitial sprint note.")
        self.assertEqual(export.filename, "Nova Sprint Notes.md")

    def test_export_document_md_specific_version(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_document_md

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="Versioned Doc",
            content_md="v1 body",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )
        repository.update_document(
            document_id=document.id,
            title="Versioned Doc",
            content_md="v2 body",
            permission=DocumentPermission.TEAM,
            editor_id=1,
        )

        current = export_document_md(repository, 1, 10, document.id)
        first_version = export_document_md(repository, 1, 10, document.id, version_no=1)

        self.assertEqual(current.content, b"v2 body")
        self.assertEqual(first_version.content, b"v1 body")

    def test_export_document_md_unknown_version_raises(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import VersionNotFoundError
        from backend.service.export import export_document_md

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="Single Version",
            content_md="only",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        with self.assertRaises(VersionNotFoundError):
            export_document_md(repository, 1, 10, document.id, version_no=99)

    def test_export_document_md_rejects_invisible_document(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentNotFoundError
        from backend.service.export import export_document_md

        repository = DemoRepository()
        # owner_id=2 的私有文档，对 user_id=1 不可见
        repository.create_document(
            space_id=10,
            title="Kira Secret",
            content_md="hidden",
            owner_id=2,
            permission=DocumentPermission.PRIVATE,
        )
        secret_id = repository.list_documents()[-1].id

        with self.assertRaises(DocumentNotFoundError):
            export_document_md(repository, user_id=1, current_space_id=10, document_id=secret_id)

    def test_export_space_zip_contains_only_visible_documents(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_space_zip

        repository = DemoRepository()
        repository.create_document(
            space_id=10,
            title="Kira Team Note",
            content_md="team-visible",
            owner_id=2,
            permission=DocumentPermission.TEAM,
        )
        repository.create_document(
            space_id=10,
            title="Kira Private Note",
            content_md="hidden",
            owner_id=2,
            permission=DocumentPermission.PRIVATE,
        )

        export = export_space_zip(repository, user_id=1, current_space_id=10)

        names = _zip_names(export.archive)
        self.assertEqual(export.document_count, 2)
        self.assertIn("Nova Sprint Notes.md", names)
        self.assertIn("Kira Team Note.md", names)
        # 不可见文档（他人私有）不进入 ZIP；跨空间文档（doc 200 在 space 20）也不进入
        self.assertNotIn("Kira Private Note.md", names)
        self.assertEqual(_zip_read(export.archive, "Kira Team Note.md"), "team-visible")

    def test_export_space_zip_preserves_path_prefix(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_space_zip

        repository = DemoRepository()
        # 模拟 Sprint-16 导入留下的路径前缀标题
        repository.create_document(
            space_id=10,
            title="docs/team/readme",
            content_md="# Readme\n\nNested.",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        export = export_space_zip(repository, user_id=1, current_space_id=10)

        names = _zip_names(export.archive)
        self.assertIn("docs/team/readme.md", names)

    def test_export_space_zip_sanitizes_unsafe_titles(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_space_zip

        repository = DemoRepository()
        repository.create_document(
            space_id=10,
            title="a/../b:c?d",
            content_md="safe",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        export = export_space_zip(repository, user_id=1, current_space_id=10)

        names = _zip_names(export.archive)
        # 不允许出现路径穿越段或非法字符；仅保留清洗后的目录 / 文件名
        self.assertTrue(all(".." not in name for name in names), names)
        self.assertTrue(all(":" not in name and "?" not in name for name in names), names)
        self.assertEqual(_zip_read(export.archive, names[-1]), "safe")

    def test_export_space_zip_empty_when_no_visible_documents(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_space_zip

        repository = DemoRepository()
        # user_id=1 是 space 20 成员，但 space 20 仅有的 doc 200 是 owner=3 的私有文档 → 无可见文档
        export = export_space_zip(repository, user_id=1, current_space_id=20)

        self.assertEqual(export.document_count, 0)
        # 空间无可见文档时返回合法空 ZIP，不提示隐藏数量
        self.assertTrue(zipfile.is_zipfile(io.BytesIO(export.archive)))
        self.assertEqual(_zip_names(export.archive), [])

    def test_export_space_zip_rejects_non_member(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import export_space_zip
        from backend.service.space import SpaceAccessError

        repository = DemoRepository()
        # user_id=3 不是 space 10 成员
        with self.assertRaises(SpaceAccessError):
            export_space_zip(repository, user_id=3, current_space_id=10)

def _demo_ctx(user_id: int = 1, current_space_id: int = 10):
    from backend.model.entities import User
    from backend.service.auth_context import TokenContext

    return TokenContext(
        user_id=user_id,
        current_space_id=current_space_id,
        session_id=None,
        user=User(id=user_id, external_id="demo", name="Demo"),
    )



@unittest.skipIf(importlib.util.find_spec("reportlab") is None, "ReportLab is not installed")
class PdfExportServiceTest(unittest.TestCase):
    """Sprint-18 REQ-027：单文档 PDF 导出任务、版本绑定与失败态。"""

    def test_create_pdf_export_generates_chinese_pdf_and_records_done(self) -> None:
        from pdfplumber import open as open_pdf
        from pypdf import PdfReader

        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import create_pdf_export

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="中文 PDF 导出样例",
            content_md=(
                "# 中文标题\n\n"
                "关键中文段落：北斗项目复盘与团队知识沉淀。\n\n"
                "- 第一条行动项\n"
                "- 第二条行动项\n\n"
                "| 字段 | 结果 |\n"
                "| --- | --- |\n"
                "| 版本 | 当前 |\n\n"
                "> 引用块保持可读。"
            ),
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        with tempfile.TemporaryDirectory() as directory:
            result = create_pdf_export(repository, 1, 10, document.id, output_dir=Path(directory))

            artifact_path = Path(result.artifact_path or "")
            export_record = repository.get_doc_export(result.export_id)

            self.assertEqual(result.status, "done")
            self.assertTrue(artifact_path.exists(), artifact_path)
            self.assertEqual(export_record.status if export_record else None, "done")
            self.assertEqual(export_record.version_no if export_record else None, document.current_version)
            self.assertGreaterEqual(len(PdfReader(str(artifact_path)).pages), 1)
            with open_pdf(str(artifact_path)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            self.assertIn("关键中文段落", text)

    def test_create_pdf_export_uses_requested_version(self) -> None:
        from pdfplumber import open as open_pdf

        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import create_pdf_export

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="版本 PDF",
            content_md="第一版中文内容",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )
        repository.update_document(
            document.id,
            title="版本 PDF",
            content_md="第二版中文内容",
            permission=DocumentPermission.TEAM,
            editor_id=1,
        )

        with tempfile.TemporaryDirectory() as directory:
            result = create_pdf_export(repository, 1, 10, document.id, version_no=1, output_dir=Path(directory))

            with open_pdf(result.artifact_path or "") as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            export_record = repository.get_doc_export(result.export_id)

            self.assertIn("第一版中文内容", text)
            self.assertNotIn("第二版中文内容", text)
            self.assertEqual(export_record.version_no if export_record else None, 1)

    def test_download_pdf_export_returns_pdf_bytes_for_visible_document(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import create_pdf_export, download_pdf_export

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="中文下载 PDF",
            content_md="中文下载内容",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        with tempfile.TemporaryDirectory() as directory:
            result = create_pdf_export(repository, 1, 10, document.id, output_dir=Path(directory))

            download = download_pdf_export(repository, 1, 10, result.export_id, output_dir=Path(directory))

            self.assertEqual(download.export_id, result.export_id)
            self.assertTrue(download.content.startswith(b"%PDF"))
            self.assertEqual(download.filename, Path(result.artifact_path or "").name)

    def test_download_pdf_export_rejects_not_ready_task(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import PdfExportNotReadyError, download_pdf_export

        repository = DemoRepository()
        export_task = repository.create_doc_export(
            space_id=10,
            document_id=100,
            requested_by=1,
            version_no=1,
            status="running",
        )

        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(PdfExportNotReadyError):
                download_pdf_export(repository, 1, 10, export_task.id, output_dir=Path(directory))

    def test_download_pdf_export_rejects_invisible_document(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentNotFoundError
        from backend.service.export import download_pdf_export

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="Kira Private PDF",
            content_md="hidden",
            owner_id=2,
            permission=DocumentPermission.PRIVATE,
        )

        with tempfile.TemporaryDirectory() as directory:
            artifact_path = Path(directory) / "secret.pdf"
            artifact_path.write_bytes(b"%PDF-1.4\n")
            export_task = repository.create_doc_export(
                space_id=10,
                document_id=document.id,
                requested_by=2,
                version_no=1,
                status="done",
                artifact_path=str(artifact_path),
            )

            with self.assertRaises(DocumentNotFoundError):
                download_pdf_export(repository, 1, 10, export_task.id, output_dir=Path(directory))

    def test_download_pdf_export_rejects_missing_artifact(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import PdfExportNotFoundError, download_pdf_export

        repository = DemoRepository()
        with tempfile.TemporaryDirectory() as directory:
            missing_path = Path(directory) / "missing.pdf"
            export_task = repository.create_doc_export(
                space_id=10,
                document_id=100,
                requested_by=1,
                version_no=1,
                status="done",
                artifact_path=str(missing_path),
            )

            with self.assertRaises(PdfExportNotFoundError):
                download_pdf_export(repository, 1, 10, export_task.id, output_dir=Path(directory))

    def test_download_pdf_export_rejects_artifact_outside_export_dir(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import PdfExportNotFoundError, download_pdf_export

        repository = DemoRepository()
        with tempfile.TemporaryDirectory() as directory:
            outside_path = Path(directory).parent / f"outside-{Path(directory).name}.pdf"
            outside_path.write_bytes(b"%PDF-1.4\n")
            try:
                export_task = repository.create_doc_export(
                    space_id=10,
                    document_id=100,
                    requested_by=1,
                    version_no=1,
                    status="done",
                    artifact_path=str(outside_path),
                )

                with self.assertRaises(PdfExportNotFoundError):
                    download_pdf_export(repository, 1, 10, export_task.id, output_dir=Path(directory))
            finally:
                outside_path.unlink(missing_ok=True)

    def test_create_pdf_export_rejects_invisible_document(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentNotFoundError
        from backend.service.export import create_pdf_export

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="Kira Secret PDF",
            content_md="hidden",
            owner_id=2,
            permission=DocumentPermission.PRIVATE,
        )

        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(DocumentNotFoundError):
                create_pdf_export(repository, 1, 10, document.id, output_dir=Path(directory))

        self.assertEqual(repository.doc_exports, [])

    def test_create_pdf_export_marks_failed_when_font_unavailable(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.export import PdfExportDependencyError, create_pdf_export

        repository = DemoRepository()
        with tempfile.TemporaryDirectory() as directory:
            missing_font = Path(directory) / "missing.ttf"
            with self.assertRaises(PdfExportDependencyError):
                create_pdf_export(
                    repository,
                    1,
                    10,
                    100,
                    output_dir=Path(directory),
                    font_paths=[missing_font],
                )

            self.assertEqual(len(repository.doc_exports), 1)
            self.assertEqual(repository.doc_exports[0].status, "failed")
            self.assertFalse(any(Path(directory).glob("*.pdf")))


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class ExportApiTest(unittest.TestCase):
    """Sprint-17 API-030：导出端点的二进制响应与错误码（替换 repository 单例）。"""

    def test_export_pdf_download_route_registered(self) -> None:
        from backend.main import create_app

        app = create_app()
        route_paths = {route.path for route in app.routes}

        self.assertIn("/api/export-pdf/{export_id}/download", route_paths)

    def test_export_document_api_returns_markdown_blob(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        original_repository = export_api.repository
        export_api.repository = DemoRepository()
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            response = export_api.export_document_endpoint(
                document_id=100,
                format="md",
                version_no=None,
                ctx=_demo_ctx(),
            )
        finally:
            export_api.repository = original_repository

        self.assertEqual(response.body, b"# Nova\n\nInitial sprint note.")
        self.assertIn("text/markdown", response.media_type)
        self.assertIn('filename="Nova Sprint Notes.md"', response.headers["content-disposition"])

    def test_export_document_api_supports_unicode_filename(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="中文标题",
            content_md="中文正文",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        original_repository = export_api.repository
        export_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            response = export_api.export_document_endpoint(
                document_id=document.id,
                format="md",
                version_no=None,
                ctx=_demo_ctx(),
            )
        finally:
            export_api.repository = original_repository

        disposition = response.headers["content-disposition"]
        self.assertEqual(response.body, "中文正文".encode("utf-8"))
        self.assertIn('filename="____.md"', disposition)
        self.assertIn(f"filename*=UTF-8''{quote('中文标题.md', safe='')}", disposition)

    def test_export_document_api_rejects_invisible_document(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token
        from backend.service.document import DocumentNotFoundError

        repository = DemoRepository()
        repository.create_document(
            space_id=10,
            title="Kira Secret",
            content_md="hidden",
            owner_id=2,
            permission=DocumentPermission.PRIVATE,
        )
        secret_id = repository.list_documents()[-1].id

        original_repository = export_api.repository
        export_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            # Slice B：DocumentNotFoundError 已继承 ApiError，异常冒泡到 main.py handler 转 envelope（code 4004）。
            with self.assertRaises(DocumentNotFoundError) as context:
                export_api.export_document_endpoint(
                    document_id=secret_id,
                    format="md",
                    ctx=_demo_ctx(),
                )
        finally:
            export_api.repository = original_repository

        self.assertEqual(context.exception.code, 4004)

    def test_export_space_api_returns_zip_blob(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        original_repository = export_api.repository
        export_api.repository = DemoRepository()
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            response = export_api.export_space_endpoint(
                format="zip",
                ctx=_demo_ctx(),
            )
        finally:
            export_api.repository = original_repository

        self.assertIn("application/zip", response.media_type)
        self.assertIn('filename="lumen-space-export.zip"', response.headers["content-disposition"])
        self.assertTrue(zipfile.is_zipfile(io.BytesIO(response.body)))
        self.assertIn("Nova Sprint Notes.md", _zip_names(response.body))

    def test_export_space_api_rejects_non_member(self) -> None:
        from backend.api import export as export_api
        from backend.repository.demo_repository import DemoRepository
        from backend.service.space import SpaceAccessError

        original_repository = export_api.repository
        export_api.repository = DemoRepository()
        try:
            with self.assertRaises(SpaceAccessError) as context:
                export_api.export_space_endpoint(
                    format="zip",
                    ctx=_demo_ctx(user_id=3),
                )
        finally:
            export_api.repository = original_repository

        self.assertEqual(context.exception.code, 4003)
        self.assertEqual(context.exception.status_code, 403)

    def test_export_pdf_api_returns_task_view_and_download_blob(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        original_repository = export_api.repository
        export_api.repository = DemoRepository()
        with tempfile.TemporaryDirectory() as directory:
            original_create_pdf_export = export_api.create_pdf_export
            original_download_pdf_export = export_api.download_pdf_export

            def create_pdf_export_in_temp(**kwargs):
                return original_create_pdf_export(**kwargs, output_dir=Path(directory))

            def download_pdf_export_in_temp(**kwargs):
                return original_download_pdf_export(**kwargs, output_dir=Path(directory))

            try:
                export_api.create_pdf_export = create_pdf_export_in_temp
                export_api.download_pdf_export = download_pdf_export_in_temp
                token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
                response = export_api.export_pdf_endpoint(
                    request=export_api.PdfExportRequestBody(document_id=100),
                    ctx=_demo_ctx(),
                )
                download_response = export_api.download_pdf_endpoint(
                    export_id=response["data"]["export_id"],
                    ctx=_demo_ctx(),
                )
            finally:
                export_api.create_pdf_export = original_create_pdf_export
                export_api.download_pdf_export = original_download_pdf_export
                export_api.repository = original_repository

            data = response["data"]
            self.assertEqual(response["code"], 0)
            self.assertEqual(data["status"], "done")
            self.assertTrue(Path(data["artifact_path"]).exists())
            self.assertIn("application/pdf", download_response.media_type)
            self.assertTrue(download_response.body.startswith(b"%PDF"))
            disposition = download_response.headers["content-disposition"]
            self.assertIn('filename="Nova Sprint Notes-v1-export-1.pdf"', disposition)
            self.assertIn(
                f"filename*=UTF-8''{quote('Nova Sprint Notes-v1-export-1.pdf', safe='')}",
                disposition,
            )

    def test_export_pdf_api_maps_dependency_error_to_5030(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.service.auth import create_demo_token
        from backend.service.export import PdfExportDependencyError

        token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
        with patch.object(export_api, "create_pdf_export", side_effect=PdfExportDependencyError("missing font")):
            # Slice B：PdfExportDependencyError 已继承 ApiError，异常冒泡到 main.py handler 转 envelope（code 5030）。
            with self.assertRaises(PdfExportDependencyError) as context:
                export_api.export_pdf_endpoint(
                    request=export_api.PdfExportRequestBody(document_id=100),
                    ctx=_demo_ctx(),
                )

        self.assertEqual(context.exception.code, 5030)

    def test_download_pdf_api_maps_not_ready_to_4090(self) -> None:
        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.service.auth import create_demo_token
        from backend.service.export import PdfExportNotReadyError

        token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
        with patch.object(export_api, "download_pdf_export", side_effect=PdfExportNotReadyError("PDF export is not ready")):
            # Slice B：PdfExportNotReadyError 已继承 ApiError，异常冒泡到 main.py handler 转 envelope（code 4090）。
            with self.assertRaises(PdfExportNotReadyError) as context:
                export_api.download_pdf_endpoint(
                    export_id=1,
                    ctx=_demo_ctx(),
                )

        self.assertEqual(context.exception.code, 4090)


if __name__ == "__main__":
    unittest.main()
