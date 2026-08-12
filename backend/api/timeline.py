"""FastAPI router for API-033 topic timeline (REQ-013a / REQ-024)."""

from __future__ import annotations

from backend.model.schemas import ApiEnvelope, TimelineView
from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.timeline import (
    TimelineDensityWindow,
    TimelineEvent,
    get_timeline,
)

from fastapi import APIRouter, Depends, Query


router = APIRouter(prefix="/api/spaces", tags=["timeline"])

@router.get("/{space_id}/timeline", response_model=ApiEnvelope[TimelineView])
def timeline_endpoint(
    space_id: int,
    q: str | None = None,
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = None,
    tag_ids: list[int] | None = Query(default=None),
    density: bool = True,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    view = get_timeline(
        repository=repository,
        user_id=ctx.user_id,
        space_id=space_id,
        q=q,
        from_date=from_,
        to_date=to,
        tag_ids=tuple(tag_ids or ()),
        density=density,
    )

    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "items": [_event_view(item) for item in view.items],
            "density": [_density_view(item) for item in view.density],
            "degraded": view.degraded,
            "window": view.window,
        },
    }


def _event_view(event: TimelineEvent) -> dict[str, object]:
    return {
        "date": event.date,
        "document_id": event.document_id,
        "title": event.title,
        "event_type": event.event_type,
        "permission": event.permission,
        "actor": event.actor,
    }

def _density_view(item: TimelineDensityWindow) -> dict[str, object]:
    return {
        "window_start": item.window_start,
        "window_end": item.window_end,
        "event_count": item.event_count,
        "level": item.level,
        "ratio": item.ratio,
    }
