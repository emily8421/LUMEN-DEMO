import unittest


class ExternalWriteGuardTest(unittest.TestCase):
    """Sprint-13 口径 B：external 文档仅 owner 可写（service 级 update/delete/restore 拦截）。"""

    @staticmethod
    def _make_external_repository():
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository

        repository = DemoRepository()
        repository.create_document(
            space_id=10,
            title="External Brief",
            content_md="# External\n\nRead-only for non-owners.",
            owner_id=1,
            permission=DocumentPermission.EXTERNAL,
        )
        return repository

    def _external_id(self, repository) -> int:
        return repository.list_documents()[-1].id

    def test_non_owner_cannot_update_external_document(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.service.document import DocumentAccessError, DocumentUpdate, update_document

        repository = self._make_external_repository()
        external_id = self._external_id(repository)

        with self.assertRaises(DocumentAccessError):
            update_document(
                repository=repository,
                user_id=2,  # space 10 成员但非 owner
                current_space_id=10,
                document_id=external_id,
                request=DocumentUpdate(
                    title="External Brief",
                    content_md="tampered",
                    permission=DocumentPermission.EXTERNAL,
                ),
            )

    def test_owner_can_update_external_document(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.service.document import DocumentUpdate, update_document

        repository = self._make_external_repository()
        external_id = self._external_id(repository)

        updated = update_document(
            repository=repository,
            user_id=1,  # owner
            current_space_id=10,
            document_id=external_id,
            request=DocumentUpdate(
                title="External Brief v2",
                content_md="updated by owner",
                permission=DocumentPermission.EXTERNAL,
            ),
        )

        self.assertEqual(updated.title, "External Brief v2")
        self.assertEqual(updated.current_version, 2)

    def test_non_owner_cannot_delete_external_document(self) -> None:
        from backend.service.document import DocumentAccessError, delete_document

        repository = self._make_external_repository()
        external_id = self._external_id(repository)

        with self.assertRaises(DocumentAccessError):
            delete_document(repository, user_id=2, current_space_id=10, document_id=external_id)
        self.assertIsNotNone(repository.get_document(external_id))

    def test_non_owner_cannot_restore_external_document_version(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.service.document import DocumentAccessError, DocumentUpdate, restore_version, update_document

        repository = self._make_external_repository()
        external_id = self._external_id(repository)
        # owner 先产生 v2，使版本恢复路径可用
        update_document(
            repository=repository,
            user_id=1,
            current_space_id=10,
            document_id=external_id,
            request=DocumentUpdate(
                title="External Brief v2",
                content_md="v2 by owner",
                permission=DocumentPermission.EXTERNAL,
            ),
        )

        with self.assertRaises(DocumentAccessError):
            restore_version(repository, user_id=2, current_space_id=10, document_id=external_id, version_no=1)

    def test_team_document_remains_writable_by_non_owner(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentUpdate, update_document

        repository = DemoRepository()  # doc 100 = space 10 / team / owner 1
        updated = update_document(
            repository=repository,
            user_id=2,  # 非 owner 的空间成员
            current_space_id=10,
            document_id=100,
            request=DocumentUpdate(
                title="Nova Sprint Notes",
                content_md="edited by member",
                permission=DocumentPermission.TEAM,
            ),
        )

        self.assertEqual(updated.content_md, "edited by member")


if __name__ == "__main__":
    unittest.main()
