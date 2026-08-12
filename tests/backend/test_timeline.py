import importlib.util
import unittest
from dataclasses import replace

def _demo_ctx(user_id: int = 1, current_space_id: int = 10):
    from backend.model.entities import User
    from backend.service.auth_context import TokenContext

    return TokenContext(
        user_id=user_id,
        current_space_id=current_space_id,
        session_id=None,
        user=User(id=user_id, external_id="demo", name="Demo"),
    )



class TimelineServiceTest(unittest.TestCase):
    """REQ-013a / REQ-024 topic timeline service over DemoRepository."""

    def test_keyword_matches_title_and_chunks_without_leaking_private_documents(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.timeline import get_timeline

        repository = DemoRepository()
        title_match = _create_timed_document(
            repository,
            title="弱网稳定性纪要",
            content_md="标题命中即可进入主题时间线。",
            owner_id=1,
            permission=DocumentPermission.TEAM,
            created_at="2026-01-02T10:00:00",
        )
        chunk_match = _create_timed_document(
            repository,
            title="普通会议纪要",
            content_md="正文命中由 chunk 索引支撑。",
            owner_id=1,
            permission=DocumentPermission.TEAM,
            created_at="2026-01-03T10:00:00",
        )
        private_match = _create_timed_document(
            repository,
            title="弱网秘密",
            content_md="不可见文档不能泄露。",
            owner_id=2,
            permission=DocumentPermission.PRIVATE,
            created_at="2026-01-04T10:00:00",
        )
        repository.replace_document_chunks(chunk_match.id, ["弱网 回归 和 触发延迟"])
        repository.replace_document_chunks(private_match.id, ["弱网 私密内容"])

        view = get_timeline(repository, user_id=1, space_id=10, q="弱网")

        document_ids = {item.document_id for item in view.items}
        self.assertEqual(document_ids, {title_match.id, chunk_match.id})
        self.assertFalse(view.degraded)

    def test_runtime_created_document_has_timeline_event_without_manual_timestamp(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.timeline import get_timeline

        repository = DemoRepository()
        document = repository.create_document(
            space_id=10,
            title="Phoenix Runtime Smoke",
            content_md="Created through the normal repository path.",
            owner_id=1,
            permission=DocumentPermission.TEAM,
        )

        view = get_timeline(repository, user_id=1, space_id=10, q="phoenix")

        self.assertTrue(document.created_at)
        self.assertTrue(document.updated_at)
        self.assertIn(document.id, {item.document_id for item in view.items})
        self.assertIn("created", {item.event_type for item in view.items if item.document_id == document.id})

    def test_timeline_assembles_four_event_types_with_actor_rules(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, add_document_tag, create_tag
        from backend.service.timeline import get_timeline

        repository = DemoRepository()
        document = _create_timed_document(
            repository,
            title="Orion 复盘",
            content_md="事件矩阵",
            owner_id=1,
            permission=DocumentPermission.TEAM,
            created_at="2026-02-01T09:00:00",
            updated_at="2026-02-02T09:00:00",
        )
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="稳定性"))
        add_document_tag(repository, 1, 10, document.id, tag.id)
        repository.tag_links = [replace(link, created_at="2026-02-03T09:00:00") for link in repository.tag_links]
        link = repository.upsert_manual_link(10, document.id, None, "无目标", "[[无目标]]")
        repository.doc_links = [replace(link, created_at="2026-02-04T09:00:00")]

        view = get_timeline(repository, user_id=1, space_id=10)

        events = {item.event_type: item for item in view.items if item.document_id == document.id}
        self.assertEqual(set(events), {"created", "updated", "tagged", "linked"})
        self.assertEqual(events["created"].actor, 1)
        self.assertEqual(events["updated"].actor, 1)
        self.assertEqual(events["tagged"].actor, 1)
        self.assertIsNone(events["linked"].actor)
        self.assertEqual(events["linked"].permission, "team")

    def test_tag_ids_filter_to_tagged_documents(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        from backend.service.tag import TagCreateRequest, create_tag
        from backend.service.timeline import get_timeline

        repository = DemoRepository()
        tagged = _create_timed_document(
            repository,
            title="标签主题",
            content_md="tagged",
            owner_id=1,
            permission=DocumentPermission.TEAM,
            created_at="2026-03-01T09:00:00",
        )
        _create_timed_document(
            repository,
            title="未打标签",
            content_md="untagged",
            owner_id=1,
            permission=DocumentPermission.TEAM,
            created_at="2026-03-02T09:00:00",
        )
        tag = create_tag(repository, 1, 10, TagCreateRequest(name="主题A"))
        repository.upsert_document_tag(tag.id, tagged.id, "manual", 1)

        view = get_timeline(repository, user_id=1, space_id=10, tag_ids=(tag.id,))

        self.assertEqual({item.document_id for item in view.items}, {tagged.id})

    def test_density_and_degraded_flag(self) -> None:
        from backend.model.entities import DocumentPermission
        from backend.repository.demo_repository import DemoRepository
        import backend.service.timeline as timeline

        repository = DemoRepository()
        _create_timed_document(
            repository,
            title="A",
            content_md="a",
            owner_id=1,
            permission=DocumentPermission.TEAM,
            created_at="2026-04-01T09:00:00",
            updated_at="2026-04-02T09:00:00",
        )
        original_limit = timeline.MAX_EVENTS_BEFORE_DEGRADE
        timeline.MAX_EVENTS_BEFORE_DEGRADE = 1
        try:
            view = timeline.get_timeline(repository, user_id=1, space_id=10, density=True)
        finally:
            timeline.MAX_EVENTS_BEFORE_DEGRADE = original_limit

        self.assertTrue(view.degraded)
        self.assertEqual(view.window, "week")
        self.assertGreaterEqual(sum(item.event_count for item in view.density), 2)

    def test_invalid_tag_id_is_validation_error(self) -> None:
        from backend.repository.demo_repository import DemoRepository
        from backend.service.timeline import TimelineValidationError, get_timeline

        repository = DemoRepository()

        with self.assertRaises(TimelineValidationError):
            get_timeline(repository, user_id=1, space_id=10, tag_ids=(999,))


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class TimelineApiTest(unittest.TestCase):
    """API-033 endpoint function tests with demo token and repository swap."""

    def test_timeline_api_rejects_empty_q(self) -> None:
        from backend.api import timeline as timeline_api
        from backend.api.auth import TOKEN_SIGNING_KEY
        from backend.repository.demo_repository import DemoRepository
        from backend.service.auth import create_demo_token
        from backend.service.timeline import TimelineValidationError

        original_repository = timeline_api.repository
        timeline_api.repository = DemoRepository()
        try:
            create_demo_token(user_id=1, current_space_id=10, signing_key=TOKEN_SIGNING_KEY)
            ctx = _demo_ctx()
            # Slice B：TimelineValidationError 已继承 ApiError，异常冒泡到 main.py handler 转 envelope（code 4220）。
            with self.assertRaises(TimelineValidationError) as context:
                timeline_api.timeline_endpoint(
                    space_id=10,
                    q="",
                    from_=None,
                    to=None,
                    tag_ids=[],
                    density=True,
                    ctx=ctx,
                )
            self.assertEqual(context.exception.code, 4220)
        finally:
            timeline_api.repository = original_repository


def _create_timed_document(
    repository,
    title: str,
    content_md: str,
    owner_id,
    permission,
    created_at: str,
    updated_at: str | None = None,
):
    document = repository.create_document(
        space_id=10,
        title=title,
        content_md=content_md,
        owner_id=owner_id,
        permission=permission,
    )
    stamped = replace(document, created_at=created_at, updated_at=updated_at or created_at)
    repository.documents = [stamped if item.id == document.id else item for item in repository.documents]
    return stamped
