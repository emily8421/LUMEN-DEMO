import importlib.util
import io
import unittest
import zipfile


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


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class ExportApiTest(unittest.TestCase):
    """Sprint-17 API-030：导出端点的二进制响应与错误码（替换 repository 单例）。"""

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
                authorization=f"Bearer {token}",
            )
        finally:
            export_api.repository = original_repository

        self.assertEqual(response.body, b"# Nova\n\nInitial sprint note.")
        self.assertIn("text/markdown", response.media_type)
        self.assertIn('filename="Nova Sprint Notes.md"', response.headers["content-disposition"])

    def test_export_document_api_rejects_invisible_document(self) -> None:
        from fastapi import HTTPException

        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

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
            with self.assertRaises(HTTPException) as context:
                export_api.export_document_endpoint(
                    document_id=secret_id,
                    format="md",
                    authorization=f"Bearer {token}",
                )
        finally:
            export_api.repository = original_repository

        self.assertEqual(context.exception.status_code, 404)
        self.assertEqual(context.exception.detail["code"], 4004)

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
                authorization=f"Bearer {token}",
            )
        finally:
            export_api.repository = original_repository

        self.assertIn("application/zip", response.media_type)
        self.assertIn('filename="lumen-space-export.zip"', response.headers["content-disposition"])
        self.assertTrue(zipfile.is_zipfile(io.BytesIO(response.body)))
        self.assertIn("Nova Sprint Notes.md", _zip_names(response.body))

    def test_export_space_api_rejects_non_member(self) -> None:
        from fastapi import HTTPException

        from backend.api import export as export_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token

        original_repository = export_api.repository
        export_api.repository = DemoRepository()
        try:
            token = create_demo_token(user_id=3, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            with self.assertRaises(HTTPException) as context:
                export_api.export_space_endpoint(
                    format="zip",
                    authorization=f"Bearer {token}",
                )
        finally:
            export_api.repository = original_repository

        self.assertEqual(context.exception.status_code, 403)
        self.assertEqual(context.exception.detail["code"], 4003)


if __name__ == "__main__":
    unittest.main()
