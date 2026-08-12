"""Integration tests for CQ-P1-003 Slice C: UoW rollback semantics.

对真实 PostgreSQL 注入故障（``replace_document_wikilinks`` 抛 RuntimeError），
验证 service 层 ``unit_of_work`` 真正回滚：import 主事务内的写步（文档主表 /
版本 / chunks / wikilinks）全部撤销，import_job 不残留 done（fail_import_job
在事务外独立写 failed）。这是 uow.py 注释声明的「PG integration 验证 rollback
真语义」，demo 层 UoW 为 no-op 无法覆盖。

Requires the lumen-pg container (docker/compose.yml, :15432) + 独立 lumen_test
库 + 三 guard env（LUMEN_ENV=test / ALLOW_DESTRUCTIVE_TEST_DB=1）；数据库不可达
时整类 skip，不破坏默认「无 PG」环境（见 README §运行）。
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import pytest
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent))
from pg_test_support import assert_test_database_safe_from_engine  # noqa: E402

from backend.model.entities import DocumentPermission
from backend.model.orm import SpaceMemberORM, SpaceORM, UserORM
from backend.repository.pg_repository import PgRepository
from backend.service.db import SessionLocal, engine, init_db
from backend.service.imports import ImportTextRequest, import_extracted_text

pytestmark = pytest.mark.integration


def _truncate_all() -> None:
    assert_test_database_safe_from_engine(engine)
    with engine.connect() as conn:
        conn.execute(
            text(
                "TRUNCATE TABLE lumen_users, lumen_spaces, lumen_space_members, "
                "lumen_documents, lumen_document_versions, lumen_chunks, "
                "lumen_imports, lumen_terms, lumen_folders RESTART IDENTITY CASCADE"
            )
        )
        conn.commit()


def _seed_base() -> tuple[list[int], list[int]]:
    with SessionLocal() as session:
        alice = UserORM(external_id="alice", name="Alice")
        kira = UserORM(external_id="kira", name="Kira")
        nova = SpaceORM(code="nova-internal", name="Nova Internal")
        bright = SpaceORM(code="brightlite-team", name="BrightLite Team")
        session.add_all([alice, kira, nova, bright])
        session.flush()
        session.add_all([
            SpaceMemberORM(user_id=alice.id, space_id=nova.id, role="admin"),
            SpaceMemberORM(user_id=kira.id, space_id=nova.id, role="member"),
        ])
        session.commit()
        return [alice.id, kira.id], [nova.id, bright.id]


class UoWRollbackTest(unittest.TestCase):
    repo: PgRepository

    @classmethod
    def setUpClass(cls) -> None:
        assert_test_database_safe_from_engine(engine)
        try:
            init_db()
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()
        except Exception as exc:  # pragma: no cover - env-dependent
            raise unittest.SkipTest(f"PostgreSQL not available: {exc}") from exc

    @classmethod
    def tearDownClass(cls) -> None:
        # Leave the DB empty so the next process (e.g. uvicorn lifespan init_db)
        # can re-apply the demo seed (migration 005) without natural-key
        # collisions — same rationale as test_pg_repository.py.
        _truncate_all()
        engine.dispose()

    def setUp(self) -> None:
        _truncate_all()
        self.user_ids, self.space_ids = _seed_base()
        self.repo = PgRepository()

    def test_import_rolls_back_document_when_wikilink_sync_fails(self) -> None:
        captured_doc_id: list[int] = []
        captured_job_id: list[int] = []
        # patch 前绑定原始方法；side_effect 内用它绕过 mock 做真实 create（拿 job id）。
        original_create_import_job = self.repo.create_import_job

        def _boom_wikilinks(space_id: int, source_document_id: int, drafts: list) -> None:
            captured_doc_id.append(source_document_id)
            raise RuntimeError("boom")

        def _capture_import_job(space_id: int, source_filename: str, created_by: int):
            job = original_create_import_job(space_id, source_filename, created_by)
            captured_job_id.append(job.id)
            return job

        with patch.object(PgRepository, "replace_document_wikilinks", side_effect=_boom_wikilinks), patch.object(
            PgRepository, "create_import_job", side_effect=_capture_import_job
        ):
            with self.assertRaises(RuntimeError):
                import_extracted_text(
                    repository=self.repo,
                    user_id=self.user_ids[0],
                    current_space_id=self.space_ids[0],
                    request=ImportTextRequest(
                        filename="rollback.md",
                        content=b"# Rollback\n\nSome content.",
                        permission=DocumentPermission.TEAM,
                    ),
                )

        # 故障注入确已走到写路径（replace_document_wikilinks 被调用）。
        self.assertTrue(captured_doc_id, "replace_document_wikilinks 应被调用")

        # ① UoW 回滚：主事务内的文档主表 / 版本 / chunks / wikilinks 全部撤销。
        self.assertIsNone(self.repo.get_document(captured_doc_id[0]))
        self.assertEqual(self.repo.list_document_chunks(captured_doc_id[0]), [])
        self.assertEqual(self.repo.list_document_versions(captured_doc_id[0]), [])

        # ② import_job 不残留 done：create_import_job 在事务外独立提交，fail_import_job
        #    也在事务外独立写 failed（不随主事务回滚、不掩盖原异常）。
        self.assertEqual(len(captured_job_id), 1)
        job = self.repo.require_import_job(captured_job_id[0])
        self.assertEqual(job.status, "failed")
        self.assertIsNone(job.parsed_doc_id)


if __name__ == "__main__":
    unittest.main()
