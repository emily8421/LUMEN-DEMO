"""FastAPI router for API-033 topic timeline (REQ-013a / REQ-024)."""

from __future__ import annotations

from backend.api.auth import TOKEN_SIGNING_KEY
from backend.repository import repository
from backend.service.auth import TokenError, extract_bearer_token, parse_demo_token
from backend.service.timeline import (
    TimelineAccessError,
    TimelineDensityWindow,
    TimelineEvent,
    TimelineValidationError,
    get_timeline,
)

try:
    from fastapi import APIRouter, Header, HTTPException, Query
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    Header = None
    HTTPException = Exception
    Query = None


if APIRouter is not None:
    router = APIRouter(prefix="/api/spaces", tags=["timeline"])

    @router.get("/{space_id}/timeline")
    def timeline_endpoint(
        space_id: int,
        q: str | None = None,
        from_: str | None = Query(default=None, alias="from"),
        to: str | None = None,
        tag_ids: list[int] | None = Query(default=None),
        density: bool = True,
        authorization: str = Header(default=""),
    ) -> dict[str, object]:
        payload = _read_token_payload(authorization)
        try:
            view = get_timeline(
                repository=repository,
                user_id=payload.user_id,
                space_id=space_id,
                q=q,
                from_date=from_,
                to_date=to,
                tag_ids=tuple(tag_ids or ()),
                density=density,
            )
        except TimelineAccessError as exc:
            raise HTTPException(status_code=403, detail={"code": 4003, "msg": str(exc)}) from exc
        except TimelineValidationError as exc:
            raise HTTPException(status_code=422, detail={"code": 4220, "msg": str(exc)}) from exc

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

    def _read_token_payload(authorization: str):
        try:
            token = extract_bearer_token(authorization)
            return parse_demo_token(token, signing_key=TOKEN_SIGNING_KEY)
        except TokenError as exc:
            raise HTTPException(status_code=401, detail={"code": 4001, "msg": "invalid token"}) from exc

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
else:
    router = None
