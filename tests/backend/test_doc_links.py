import importlib.util
import unittest

def _demo_ctx(user_id: int = 1, current_space_id: int = 10):
    from backend.model.entities import User
    from backend.service.auth_context import TokenContext

    return TokenContext(
        user_id=user_id,
        current_space_id=current_space_id,
        session_id=None,
        user=User(id=user_id, external_id="demo", name="Demo"),
    )



class DocLinkServiceTest(unittest.TestCase):
    """REQ-026 内链 / 反链：wikilink 自动解析、权限折算、手动登记（DemoRepository）。"""

    def test_extract_wikilinks(self) -> None:
        from backend.service.document import extract_wikilinks

        self.assertEqual(extract_wikilinks("see [[Alpha]] and [[Beta]]"), ["Alpha", "Beta"])
        self.assertEqual(extract_wikilinks("no links here"), [])
        self.assertEqual(extract_wikilinks("[[A]] [[A]]"), ["A", "A"])
        self.assertEqual(extract_wikilinks("[[Alpha|alias]]"), ["Alpha"])
        self.assertEqual(extract_wikilinks("[[Alpha#section]]"), ["Alpha"])
        self.assertEqual(extract_wikilinks("[[Alpha#section|alias]]"), ["Alpha"])
    def test_sync_wikilinks_strips_alias_and_anchor(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        target = create_document(
            repository, 1, 10,
            DocumentCreate(title="Alpha", content_md="alpha", permission=DocumentPermission.TEAM),
        )
        source = create_document(
            repository, 1, 10,
            DocumentCreate(title="Source", content_md="refs [[Alpha|alias]] and [[Alpha#section]]", permission=DocumentPermission.TEAM),
        )

        links = repository.list_doc_links(10, source.id, "outbound")
        self.assertEqual(len(links), 1)  # 两种形式剥离后同目标，去重为一条
        self.assertEqual(links[0].target_document_id, target.id)
        self.assertEqual(links[0].status, "resolved")


    def test_sync_wikilinks_resolves_and_unresolves(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        alpha = create_document(
            repository, 1, 10,
            DocumentCreate(title="Alpha", content_md="alpha", permission=DocumentPermission.TEAM),
        )
        source = create_document(
            repository, 1, 10,
            DocumentCreate(title="Source", content_md="links [[Alpha]] and [[Missing]]", permission=DocumentPermission.TEAM),
        )

        links = repository.list_doc_links(10, source.id, "outbound")
        resolved = [link for link in links if link.target_title == "Alpha"]
        missing = [link for link in links if link.target_title == "Missing"]

        self.assertEqual(len(links), 2)
        self.assertEqual(len(resolved), 1)
        self.assertEqual(resolved[0].status, "resolved")
        self.assertEqual(resolved[0].target_document_id, alpha.id)
        self.assertEqual(missing[0].status, "unresolved")
        self.assertIsNone(missing[0].target_document_id)

    def test_self_link_is_skipped(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        doc = create_document(
            repository, 1, 10,
            DocumentCreate(title="Self", content_md="refs [[Self]]", permission=DocumentPermission.TEAM),
        )

        self.assertEqual(repository.list_doc_links(10, doc.id, "outbound"), [])

    def test_outbound_no_access_when_target_invisible(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.doc_links import list_links
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        # owner2 的私有文档（user1 不可见）
        repository.create_document(
            space_id=10, title="Secret", content_md="s", owner_id=2, permission=DocumentPermission.PRIVATE,
        )
        source = create_document(
            repository, 1, 10,
            DocumentCreate(title="Src", content_md="links [[Secret]]", permission=DocumentPermission.TEAM),
        )

        views = list_links(repository, user_id=1, current_space_id=10, document_id=source.id, direction="outbound")
        no_access = [view for view in views if view.status == "no_access"]

        self.assertEqual(len(no_access), 1)
        self.assertIsNone(no_access[0].target_title)  # 不泄露目标标题
        self.assertIsNone(no_access[0].target_document_id)

    def test_backlink_filters_invisible_sources(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.doc_links import list_links
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        target = create_document(
            repository, 1, 10,
            DocumentCreate(title="Target", content_md="t", permission=DocumentPermission.TEAM),
        )
        # 可见反链：owner1 team 文档链 Target
        create_document(
            repository, 1, 10,
            DocumentCreate(title="VisibleSrc", content_md="see [[Target]]", permission=DocumentPermission.TEAM),
        )
        # 不可见反链：owner2 private 文档链 Target
        create_document(
            repository, 2, 10,
            DocumentCreate(title="SecretSrc", content_md="refs [[Target]]", permission=DocumentPermission.PRIVATE),
        )

        views = list_links(repository, user_id=1, current_space_id=10, document_id=target.id, direction="backlink")

        # 只返回可见来源；SecretSrc 被过滤，不泄露
        self.assertEqual(len(views), 1)

    def test_upsert_manual_link_resolves_by_title(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.doc_links import DocLinkCreateRequest, upsert_link
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        source = create_document(
            repository, 1, 10, DocumentCreate(title="Src", content_md="s", permission=DocumentPermission.TEAM),
        )
        target = create_document(
            repository, 1, 10, DocumentCreate(title="Tgt", content_md="t", permission=DocumentPermission.TEAM),
        )

        link = upsert_link(
            repository, 1, 10,
            DocLinkCreateRequest(
                source_document_id=source.id, link_text="manual ref", target_title="Tgt", link_type="manual",
            ),
        )

        self.assertEqual(link.status, "resolved")
        self.assertEqual(link.target_document_id, target.id)
        self.assertEqual(link.link_type, "manual")

    def test_wikilink_post_is_rejected(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.doc_links import DocLinkCreateRequest, DocLinkValidationError, upsert_link
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        source = create_document(
            repository, 1, 10, DocumentCreate(title="Src", content_md="s", permission=DocumentPermission.TEAM),
        )

        with self.assertRaises(DocLinkValidationError):
            upsert_link(
                repository, 1, 10,
                DocLinkCreateRequest(source_document_id=source.id, link_text="x", link_type="wikilink"),
            )


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class DocLinkApiTest(unittest.TestCase):
    """REQ-026 API-018：GET/POST /api/doc-links（替换 repository 单例）。"""

    def test_list_and_create_links_via_api(self) -> None:
        from backend.api import doc_links as doc_links_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token
        from backend.service.document import DocumentCreate, create_document

        repository = DemoRepository()
        source = create_document(
            repository, 1, 10, DocumentCreate(title="Source", content_md="see [[Nova Sprint Notes]]", permission=DocumentPermission.TEAM),
        )

        original_repository = doc_links_api.repository
        doc_links_api.repository = repository
        try:
            token = create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            ctx = _demo_ctx()

            listed = doc_links_api.list_links_endpoint(document_id=source.id, direction="outbound", ctx=ctx)
            self.assertEqual(listed["code"], 0)
            self.assertEqual(len(listed["data"]), 1)
            self.assertEqual(listed["data"][0]["status"], "resolved")

            created = doc_links_api.create_link_endpoint(
                request=doc_links_api.DocLinkCreateBody(
                    source_document_id=source.id, link_text="manual", target_title="Nova Sprint Notes", link_type="manual",
                ),
                ctx=ctx,
            )
            self.assertEqual(created["data"]["status"], "resolved")
        finally:
            doc_links_api.repository = original_repository


if __name__ == "__main__":
    unittest.main()
