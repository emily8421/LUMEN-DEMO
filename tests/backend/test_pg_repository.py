"""Integration tests for PgRepository against a real PostgreSQL + pgvector.

Requires the lumen-pg container (docker/compose.yml, :15432). The whole class
is skipped when the database is unreachable, so this file does not break the
55 in-memory tests in environments without Postgres.
"""

from __future__ import annotations

import unittest

from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.model.entities import DocumentPermission, TermStatus
from backend.model.orm import SpaceMemberORM, SpaceORM, UserORM
from backend.service.db import SessionLocal, engine, init_db
from backend.repository.pg_repository import PgRepository


def _truncate_all() -> None:
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


class PgRepositoryTest(unittest.TestCase):
    repo: PgRepository

    @classmethod
    def setUpClass(cls) -> None:
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
        # collisions — test rows use BIGSERIAL ids that clash with the demo's
        # fixed ids on UNIQUE columns (users.external_id, spaces.code).
        _truncate_all()
        engine.dispose()

    def setUp(self) -> None:
        _truncate_all()
        self.user_ids, self.space_ids = _seed_base()
        self.repo = PgRepository()

    # --- users / spaces / members ---

    def test_find_user_by_external_id(self) -> None:
        user = self.repo.find_user_by_external_id("alice")
        assert user is not None
        self.assertEqual(user.name, "Alice")
        self.assertIsNone(self.repo.find_user_by_external_id("nobody"))

    def test_list_spaces_and_memberships(self) -> None:
        spaces = self.repo.list_spaces()
        self.assertEqual({s.code for s in spaces}, {"nova-internal", "brightlite-team"})
        self.assertEqual(len(self.repo.list_memberships()), 2)

    def test_first_space_id_for_user(self) -> None:
        self.assertEqual(self.repo.first_space_id_for_user(self.user_ids[0]), self.space_ids[0])
        self.assertIsNone(self.repo.first_space_id_for_user(99999))

    # --- documents / versions ---

    def test_create_document_appends_version_1(self) -> None:
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        self.assertEqual(doc.current_version, 1)
        self.assertEqual(doc.type, "markdown")
        versions = self.repo.list_document_versions(doc.id)
        self.assertEqual(len(versions), 1)
        self.assertEqual(versions[0].version_no, 1)
        self.assertEqual(versions[0].content_md, "c1")

    def test_update_document_creates_new_version(self) -> None:
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        updated = self.repo.update_document(doc.id, "T2", "c2", DocumentPermission.PRIVATE, self.user_ids[0])
        self.assertEqual(updated.current_version, 2)
        self.assertEqual(updated.content_md, "c2")
        self.assertEqual(updated.permission, DocumentPermission.PRIVATE)
        versions = self.repo.list_document_versions(doc.id)
        self.assertEqual([v.version_no for v in versions], [1, 2])

    def test_restore_does_not_create_new_version(self) -> None:
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        self.repo.update_document(doc.id, "T2", "c2", DocumentPermission.TEAM, self.user_ids[0])
        restored = self.repo.restore_document_version(doc.id, 1, self.user_ids[0])
        self.assertEqual(restored.current_version, 1)
        self.assertEqual(restored.content_md, "c1")
        # still exactly 2 versions — restore rolls back the pointer only
        self.assertEqual(len(self.repo.list_document_versions(doc.id)), 2)

    def test_delete_document_cascades(self) -> None:
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        self.repo.replace_document_chunks(doc.id, ["a", "b"])
        self.repo.delete_document(doc.id)
        self.assertIsNone(self.repo.get_document(doc.id))
        self.assertEqual(self.repo.list_document_chunks(doc.id), [])
        self.assertEqual(self.repo.list_document_versions(doc.id), [])

    def test_set_document_folder_round_trips_folder_id(self) -> None:
        folder = self.repo.create_folder(self.space_ids[0], None, "Imported", self.user_ids[0])
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        self.repo.set_document_folder(doc.id, folder.id)

        fetched = self.repo.require_document(doc.id)

        self.assertEqual(fetched.folder_id, folder.id)

    def test_require_document_raises_keyerror(self) -> None:
        with self.assertRaises(KeyError):
            self.repo.require_document(99999)

    def test_get_document_version(self) -> None:
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        v1 = self.repo.get_document_version(doc.id, 1)
        assert v1 is not None
        self.assertEqual(v1.content_md, "c1")
        self.assertIsNone(self.repo.get_document_version(doc.id, 99))

    # --- import jobs ---

    def test_import_lifecycle(self) -> None:
        job = self.repo.create_import_job(self.space_ids[0], "note.txt", self.user_ids[0])
        self.assertEqual(job.status, "processing")
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        done = self.repo.complete_import_job(job.id, doc.id, 5)
        self.assertEqual(done.status, "done")
        self.assertEqual(done.chunk_count, 5)
        self.assertEqual(done.parsed_doc_id, doc.id)

        job2 = self.repo.create_import_job(self.space_ids[0], "bad.txt", self.user_ids[0])
        failed = self.repo.fail_import_job(job2.id, "boom")
        self.assertEqual(failed.status, "failed")
        self.assertEqual(failed.error, "boom")

        with self.assertRaises(KeyError):
            self.repo.require_import_job(99999)

    # --- chunks ---

    def test_replace_document_chunks_delete_then_rebuild(self) -> None:
        doc = self.repo.create_document(self.space_ids[0], "T", "c1", self.user_ids[0], DocumentPermission.TEAM)
        chunks = self.repo.replace_document_chunks(doc.id, ["a", "b", "c"])
        self.assertEqual([c.ordinal for c in chunks], [1, 2, 3])
        rebuilt = self.repo.replace_document_chunks(doc.id, ["x"])
        self.assertEqual(len(rebuilt), 1)
        all_chunks = self.repo.list_document_chunks(doc.id)
        self.assertEqual(len(all_chunks), 1)
        self.assertEqual(all_chunks[0].text, "x")

    def test_list_all_document_chunks_ordering(self) -> None:
        d1 = self.repo.create_document(self.space_ids[0], "T1", "c", self.user_ids[0], DocumentPermission.TEAM)
        d2 = self.repo.create_document(self.space_ids[0], "T2", "c", self.user_ids[0], DocumentPermission.TEAM)
        self.repo.replace_document_chunks(d1.id, ["a", "b"])
        self.repo.replace_document_chunks(d2.id, ["c"])
        ordered = [(c.document_id, c.ordinal) for c in self.repo.list_all_document_chunks()]
        self.assertEqual(ordered, [(d1.id, 1), (d1.id, 2), (d2.id, 1)])

    # --- terms ---

    def test_term_crud(self) -> None:
        created = self.repo.create_term(
            self.space_ids[0], "触发延迟", "def", ["开关延迟"], self.user_ids[0], TermStatus.CONFIRMED
        )
        self.assertEqual(created.aliases, ["开关延迟"])
        fetched = self.repo.get_term(created.id)
        assert fetched is not None
        self.assertEqual(fetched.term, "触发延迟")

        updated = self.repo.update_term(created.id, "新名", "新def", ["新别名"], TermStatus.PENDING)
        self.assertEqual(updated.term, "新名")
        self.assertEqual(updated.status, TermStatus.PENDING)

        self.repo.delete_term(created.id)
        self.assertIsNone(self.repo.get_term(created.id))
        with self.assertRaises(KeyError):
            self.repo.require_term(created.id)

    def test_list_terms_global_before_space(self) -> None:
        self.repo.create_term(self.space_ids[0], "空间术语", "d", [], self.user_ids[0], TermStatus.PENDING)
        self.repo.create_term(None, "全局术语", "d", [], self.user_ids[0], TermStatus.CONFIRMED)
        terms = self.repo.list_terms()
        self.assertEqual(terms[0].term, "全局术语")
        self.assertEqual(terms[0].space_id, None)
        self.assertEqual(terms[1].term, "空间术语")

    def test_term_unique_space_term(self) -> None:
        self.repo.create_term(self.space_ids[0], "dup", "d", [], self.user_ids[0], TermStatus.CONFIRMED)
        with self.assertRaises(Exception):
            self.repo.create_term(self.space_ids[0], "dup", "d2", [], self.user_ids[0], TermStatus.CONFIRMED)


if __name__ == "__main__":
    unittest.main()
