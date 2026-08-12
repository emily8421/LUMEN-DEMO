"""REQ-013a / REQ-024 topic timeline service.

Candidate A from docs/design/timeline.md: no timeline event table. The service
assembles a read-only view from existing documents, tags, links and chunks.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

from backend.model.entities import Document, DocumentChunk
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol
from backend.service.permission import filter_visible_documents, is_space_member


MAX_DOCUMENTS_BEFORE_DEGRADE = 500
MAX_EVENTS_BEFORE_DEGRADE = 2000
MAX_RETURNED_ITEMS_WHEN_DEGRADED = 200


class TimelineAccessError(ApiError):
    """用户无权读取该空间（API 映射 4003）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.FORBIDDEN, message, status_code)


class TimelineValidationError(ApiError):
    """时间轴查询参数非法（API 映射 4220）。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(ErrorCode.VALIDATION_FAILED, message, status_code)


@dataclass(frozen=True)
class TimelineEvent:
    date: str
    document_id: int
    title: str
    event_type: Literal["created", "updated", "tagged", "linked"]
    permission: str
    actor: int | None


@dataclass(frozen=True)
class TimelineDensityWindow:
    window_start: str
    window_end: str
    event_count: int
    level: int
    ratio: float


@dataclass(frozen=True)
class TimelineView:
    items: list[TimelineEvent]
    density: list[TimelineDensityWindow]
    degraded: bool
    window: Literal["day", "week"]


def get_timeline(
    repository: RepositoryProtocol,
    user_id: int,
    space_id: int,
    q: str | None = None,
    tag_ids: tuple[int, ...] = (),
    from_date: str | None = None,
    to_date: str | None = None,
    density: bool = True,
) -> TimelineView:
    memberships = repository.list_memberships()
    if not is_space_member(user_id, space_id, memberships):
        raise TimelineAccessError("space access denied")

    query = _normalize_query(q)
    range_start = _parse_bound(from_date, "from")
    range_end = _parse_bound(to_date, "to")
    if range_start and range_end and range_start > range_end:
        raise TimelineValidationError("from must be before to")

    visible_documents = filter_visible_documents(
        user_id=user_id,
        current_space_id=space_id,
        documents=repository.list_documents(),
        memberships=memberships,
    )
    visible_by_id = {document.id: document for document in visible_documents}
    selected_ids = set(visible_by_id)

    if query is not None:
        selected_ids &= _match_topic_document_ids(repository, visible_documents, query)

    if tag_ids:
        selected_ids &= _match_tag_document_ids(repository, space_id, tag_ids)

    selected_documents = [document for document in visible_documents if document.id in selected_ids]
    all_events = _collect_events(repository, space_id, selected_documents, range_start, range_end)
    degraded = len(selected_documents) > MAX_DOCUMENTS_BEFORE_DEGRADE or len(all_events) > MAX_EVENTS_BEFORE_DEGRADE
    all_events.sort(key=lambda event: event.date, reverse=True)
    returned_events = all_events[:MAX_RETURNED_ITEMS_WHEN_DEGRADED] if degraded else all_events

    window = _choose_window(all_events, range_start, range_end, degraded)
    density_windows = _build_density(all_events, window, range_start, range_end) if density else []
    return TimelineView(items=returned_events, density=density_windows, degraded=degraded, window=window)


def _normalize_query(q: str | None) -> str | None:
    if q is None:
        return None
    normalized = q.strip().lower()
    if not normalized:
        raise TimelineValidationError("q is required when provided")
    return normalized


def _parse_bound(value: str | None, field_name: str) -> datetime | None:
    if value is None:
        return None
    try:
        return _parse_datetime(value)
    except ValueError as exc:
        raise TimelineValidationError(f"{field_name} must be an ISO datetime") from exc


def _parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=None)


def _match_topic_document_ids(repository: RepositoryProtocol, visible_documents: list[Document], query: str) -> set[int]:
    visible_ids = [document.id for document in visible_documents]
    title_matches = {document.id for document in visible_documents if query in document.title.lower()}
    chunk_matches = {
        chunk.document_id
        for chunk in repository.list_all_document_chunks()
        if chunk.document_id in visible_ids and query in chunk.text.lower()
    }
    recall_limit = max(len(visible_ids) * 5, 20)
    chunk_matches.update(chunk.document_id for chunk in repository.search_chunks(visible_ids, query, limit=recall_limit))
    return title_matches | chunk_matches


def _match_tag_document_ids(repository: RepositoryProtocol, space_id: int, tag_ids: tuple[int, ...]) -> set[int]:
    matched: set[int] = set()
    for tag_id in tag_ids:
        tag = repository.get_tag(tag_id)
        if tag is None or tag.space_id != space_id or tag.status != "active":
            raise TimelineValidationError("tag_ids must reference active tags in this space")
        matched.update(repository.list_tag_document_ids(tag_id))
    return matched


def _collect_events(
    repository: RepositoryProtocol,
    space_id: int,
    documents: list[Document],
    range_start: datetime | None,
    range_end: datetime | None,
) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []
    for document in documents:
        events.extend(_document_events(document, range_start, range_end))
        events.extend(_tag_events(repository, document, range_start, range_end))
        events.extend(_link_events(repository, space_id, document, range_start, range_end))
    return events


def _document_events(
    document: Document,
    range_start: datetime | None,
    range_end: datetime | None,
) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []
    created_at = _event_datetime(document.created_at)
    if created_at is not None and _in_range(created_at, range_start, range_end):
        events.append(_event(document, created_at, "created", document.owner_id))

    updated_at = _event_datetime(document.updated_at)
    if (
        updated_at is not None
        and updated_at != created_at
        and _in_range(updated_at, range_start, range_end)
    ):
        events.append(_event(document, updated_at, "updated", document.owner_id))
    return events


def _tag_events(
    repository: RepositoryProtocol,
    document: Document,
    range_start: datetime | None,
    range_end: datetime | None,
) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []
    for link in repository.list_document_tag_links(document.id):
        occurred_at = _event_datetime(link.created_at)
        if occurred_at is not None and _in_range(occurred_at, range_start, range_end):
            events.append(_event(document, occurred_at, "tagged", link.created_by))
    return events


def _link_events(
    repository: RepositoryProtocol,
    space_id: int,
    document: Document,
    range_start: datetime | None,
    range_end: datetime | None,
) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []
    for link in repository.list_doc_links(space_id, document.id, "outbound"):
        occurred_at = _event_datetime(link.created_at)
        if occurred_at is not None and _in_range(occurred_at, range_start, range_end):
            events.append(_event(document, occurred_at, "linked", None))
    return events


def _event(
    document: Document,
    occurred_at: datetime,
    event_type: Literal["created", "updated", "tagged", "linked"],
    actor: int | None,
) -> TimelineEvent:
    return TimelineEvent(
        date=occurred_at.isoformat(),
        document_id=document.id,
        title=document.title,
        event_type=event_type,
        permission=str(document.permission),
        actor=actor,
    )


def _event_datetime(value: str) -> datetime | None:
    if not value:
        return None
    return _parse_datetime(value)


def _in_range(value: datetime, range_start: datetime | None, range_end: datetime | None) -> bool:
    if range_start is not None and value < range_start:
        return False
    if range_end is not None and value > range_end:
        return False
    return True


def _choose_window(
    events: list[TimelineEvent],
    range_start: datetime | None,
    range_end: datetime | None,
    degraded: bool,
) -> Literal["day", "week"]:
    if degraded:
        return "week"
    if range_start is not None and range_end is not None and (range_end - range_start).days > 180:
        return "week"
    if events:
        first = _parse_datetime(events[-1].date)
        last = _parse_datetime(events[0].date)
        if (last - first).days > 180:
            return "week"
    return "day"


def _build_density(
    events: list[TimelineEvent],
    window: Literal["day", "week"],
    range_start: datetime | None,
    range_end: datetime | None,
) -> list[TimelineDensityWindow]:
    if not events and (range_start is None or range_end is None):
        return []
    start = _bucket_start(range_start or _parse_datetime(events[-1].date), window)
    end = _bucket_start(range_end or _parse_datetime(events[0].date), window)
    counts: dict[datetime, int] = {}
    for event in events:
        bucket = _bucket_start(_parse_datetime(event.date), window)
        counts[bucket] = counts.get(bucket, 0) + 1

    buckets: list[datetime] = []
    current = start
    delta = timedelta(days=7 if window == "week" else 1)
    while current <= end:
        buckets.append(current)
        current += delta

    total = sum(counts.values())
    average = total / len(buckets) if buckets else 0.0
    return [
        TimelineDensityWindow(
            window_start=bucket.isoformat(),
            window_end=(bucket + delta).isoformat(),
            event_count=counts.get(bucket, 0),
            level=_density_level(counts.get(bucket, 0), average),
            ratio=round((counts.get(bucket, 0) / average), 2) if average > 0 else 0.0,
        )
        for bucket in buckets
    ]


def _bucket_start(value: datetime, window: Literal["day", "week"]) -> datetime:
    day = value.replace(hour=0, minute=0, second=0, microsecond=0)
    if window == "week":
        return day - timedelta(days=day.weekday())
    return day


def _density_level(count: int, average: float) -> int:
    if count <= 0:
        return 0
    if average <= 0 or count / average < 0.75:
        return 1
    if count / average < 1.5:
        return 2
    return 3
