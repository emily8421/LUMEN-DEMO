import unittest


class SeedIndexTest(unittest.TestCase):
    """Sprint-12②：ensure_documents_indexed 回填 seed 文档的分块（DemoRepository）。"""

    def test_seed_documents_start_without_chunks(self) -> None:
        from backend.repository.demo_repository import DemoRepository

        repository = DemoRepository()
        # DemoRepository seed（doc 100 / 200）初始无 chunks，复现 PG migrations/005 的坑
        self.assertEqual(repository.list_document_chunks(100), [])
        self.assertEqual(repository.list_document_chunks(200), [])

    def test_ensure_documents_indexed_backfills_chunks(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import ensure_documents_indexed

        repository = DemoRepository()

        indexed = ensure_documents_indexed(repository)

        self.assertEqual(indexed, 2)
        self.assertNotEqual(repository.list_document_chunks(100), [])
        self.assertNotEqual(repository.list_document_chunks(200), [])

    def test_ensure_documents_indexed_is_idempotent(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import ensure_documents_indexed

        repository = DemoRepository()
        ensure_documents_indexed(repository)

        second_pass = ensure_documents_indexed(repository)

        self.assertEqual(second_pass, 0)

    def test_ensure_documents_indexed_skips_already_indexed(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import ensure_documents_indexed, sync_document_chunks

        repository = DemoRepository()
        sync_document_chunks(repository, repository.get_document(100))  # 仅 doc 100 预先索引

        indexed = ensure_documents_indexed(repository)

        self.assertEqual(indexed, 1)  # 只回填了 doc 200
        self.assertNotEqual(repository.list_document_chunks(200), [])


if __name__ == "__main__":
    unittest.main()
