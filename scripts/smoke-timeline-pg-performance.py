"""Real PostgreSQL performance smoke for API-033 timeline service.

The script seeds an isolated space with enough documents/events to trigger the
timeline degraded path, runs backend.service.timeline.get_timeline through the
real PgRepository, validates the result shape, then removes the fixture.
"""

from __future__ import annotations

import argparse
import json
import secrets
import sys
import time
from dataclasses import asdict
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import text


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.repository.pg_repository import PgRepository  # noqa: E402
from backend.service.db import engine, init_db  # noqa: E402
from backend.service.timeline import (  # noqa: E402
    MAX_RETURNED_ITEMS_WHEN_DEGRADED,
    get_timeline,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run real PG timeline performance smoke.")
    parser.add_argument("--documents", type=int, default=620, help="Number of documents to seed.")
    parser.add_argument("--links", type=int, default=240, help="Number of doc link events to seed.")
    parser.add_argument("--max-seconds", type=float, default=12.0, help="Maximum allowed service elapsed seconds.")
    parser.add_argument("--query", default="phoenix", help="Timeline q value used by the smoke.")
    parser.add_argument("--json-out", default="", help="Optional path for a JSON result file.")
    parser.add_argument("--keep-data", action="store_true", help="Leave seeded smoke data in PostgreSQL.")
    return parser.parse_args()


def assert_positive(value: int, label: str) -> None:
    if value < 1:
        raise ValueError(f"{label} must be positive.")


def seed_fixture(document_count: int, link_count: int, query: str, run_id: str) -> dict[str, Any]:
    assert_positive(document_count, "documents")
    if link_count < 0:
        raise ValueError("links must be zero or positive.")
    if link_count >= document_count:
        raise ValueError("links must be lower than documents so every link has a distinct target.")

    init_db()
    start_at = datetime.now(UTC) - timedelta(days=420)
    title_prefix = f"PG Timeline Smoke {run_id} Phoenix "

    with engine.begin() as conn:
        user_id = conn.execute(
            text(
                """
                INSERT INTO lumen_users (external_id, name)
                VALUES (:external_id, :name)
                RETURNING id
                """
            ),
            {
                "external_id": f"timeline-smoke-{run_id}",
                "name": "Timeline Smoke",
            },
        ).scalar_one()
        space_id = conn.execute(
            text(
                """
                INSERT INTO lumen_spaces (code, name)
                VALUES (:code, :name)
                RETURNING id
                """
            ),
            {
                "code": f"timeline-smoke-{run_id}",
                "name": "Timeline Smoke Space",
            },
        ).scalar_one()
        conn.execute(
            text(
                """
                INSERT INTO lumen_space_members (user_id, space_id, role)
                VALUES (:user_id, :space_id, 'admin')
                """
            ),
            {"user_id": user_id, "space_id": space_id},
        )
        tag_id = conn.execute(
            text(
                """
                INSERT INTO lumen_tags (space_id, name, normalized_name, color, description, status, created_by)
                VALUES (:space_id, :name, :normalized_name, '#3b82f6', 'smoke tag', 'active', :user_id)
                RETURNING id
                """
            ),
            {
                "space_id": space_id,
                "name": f"Smoke Tag {run_id}",
                "normalized_name": f"smoke-tag-{run_id}",
                "user_id": user_id,
            },
        ).scalar_one()

        documents = conn.execute(
            text(
                """
                INSERT INTO lumen_documents
                    (space_id, title, content_md, owner_id, permission, type, current_version, created_at, updated_at)
                SELECT
                    :space_id,
                    :title_prefix || lpad(gs::text, 4, '0'),
                    :content_prefix || gs::text,
                    :user_id,
                    'team',
                    'markdown',
                    1,
                    CAST(:start_at AS timestamp) + ((gs % :day_span) * interval '1 day'),
                    CAST(:start_at AS timestamp) + ((gs % :day_span) * interval '1 day') + interval '1 hour'
                FROM generate_series(1, :document_count) AS gs
                RETURNING id, title, content_md
                """
            ),
            {
                "space_id": space_id,
                "title_prefix": title_prefix,
                "content_prefix": f"{query} timeline pg performance chunk {run_id} ",
                "user_id": user_id,
                "start_at": start_at,
                "day_span": 365,
                "document_count": document_count,
            },
        ).mappings().all()

        conn.execute(
            text(
                """
                INSERT INTO lumen_document_versions (document_id, version_no, content_md, editor_id)
                VALUES (:document_id, 1, :content_md, :user_id)
                """
            ),
            [
                {"document_id": row["id"], "content_md": row["content_md"], "user_id": user_id}
                for row in documents
            ],
        )
        conn.execute(
            text(
                """
                INSERT INTO lumen_chunks (document_id, ordinal, text)
                VALUES (:document_id, 1, :chunk_text)
                """
            ),
            [
                {
                    "document_id": row["id"],
                    "chunk_text": f"{query} timeline searchable smoke chunk for document {row['id']} {run_id}",
                }
                for row in documents
            ],
        )
        conn.execute(
            text(
                """
                INSERT INTO lumen_tag_links (tag_id, document_id, link_source, created_by)
                VALUES (:tag_id, :document_id, 'manual', :user_id)
                """
            ),
            [{"tag_id": tag_id, "document_id": row["id"], "user_id": user_id} for row in documents],
        )

        link_rows = []
        for index, source in enumerate(documents[:link_count]):
            target = documents[index + 1]
            link_rows.append(
                {
                    "space_id": space_id,
                    "source_document_id": source["id"],
                    "target_document_id": target["id"],
                    "target_title": target["title"],
                    "link_text": "timeline smoke link",
                }
            )
        if link_rows:
            conn.execute(
                text(
                    """
                    INSERT INTO lumen_doc_links
                        (space_id, source_document_id, target_document_id, target_title, link_text, link_type, status)
                    VALUES
                        (:space_id, :source_document_id, :target_document_id, :target_title, :link_text, 'manual', 'resolved')
                    """
                ),
                link_rows,
            )

    return {
        "run_id": run_id,
        "user_id": user_id,
        "space_id": space_id,
        "tag_id": tag_id,
        "documents": document_count,
        "links": link_count,
        "expected_min_events": document_count * 3 + link_count,
    }


def cleanup_fixture(fixture: dict[str, Any]) -> None:
    if not fixture:
        return
    with engine.begin() as conn:
        space_id = fixture.get("space_id")
        user_id = fixture.get("user_id")
        if space_id:
            conn.execute(text("DELETE FROM lumen_spaces WHERE id = :space_id"), {"space_id": space_id})
        if user_id:
            conn.execute(text("DELETE FROM lumen_users WHERE id = :user_id"), {"user_id": user_id})


def run_smoke(args: argparse.Namespace) -> dict[str, Any]:
    run_id = datetime.now(UTC).strftime("%Y%m%d%H%M%S") + "-" + secrets.token_hex(3)
    fixture: dict[str, Any] = {}
    try:
        fixture = seed_fixture(args.documents, args.links, args.query.lower(), run_id)
        repository = PgRepository()

        started = time.perf_counter()
        view = get_timeline(
            repository,
            user_id=fixture["user_id"],
            space_id=fixture["space_id"],
            q=args.query,
            tag_ids=(fixture["tag_id"],),
            density=True,
        )
        elapsed_seconds = time.perf_counter() - started
        density_events = sum(item.event_count for item in view.density)

        if not view.degraded:
            raise AssertionError("Expected degraded=true for large PG fixture.")
        if view.window != "week":
            raise AssertionError(f"Expected week density window, got {view.window}.")
        if len(view.items) != MAX_RETURNED_ITEMS_WHEN_DEGRADED:
            raise AssertionError(
                f"Expected {MAX_RETURNED_ITEMS_WHEN_DEGRADED} returned items, got {len(view.items)}."
            )
        if density_events < fixture["expected_min_events"]:
            raise AssertionError(
                f"Expected at least {fixture['expected_min_events']} density events, got {density_events}."
            )
        if elapsed_seconds > args.max_seconds:
            raise AssertionError(
                f"Timeline service exceeded budget: {elapsed_seconds:.3f}s > {args.max_seconds:.3f}s."
            )

        return {
            "ok": True,
            "checked_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "run_id": run_id,
            "documents": fixture["documents"],
            "links": fixture["links"],
            "density_events": density_events,
            "returned_items": len(view.items),
            "density_windows": len(view.density),
            "degraded": view.degraded,
            "window": view.window,
            "elapsed_ms": round(elapsed_seconds * 1000, 2),
            "first_item": asdict(view.items[0]) if view.items else None,
        }
    finally:
        if fixture and not args.keep_data:
            cleanup_fixture(fixture)


def main() -> int:
    args = parse_args()
    result = run_smoke(args)
    if args.json_out:
        Path(args.json_out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        "TIMELINE_PG_PERF_SMOKE ok "
        f"documents={result['documents']} links={result['links']} density_events={result['density_events']} "
        f"returned={result['returned_items']} degraded={result['degraded']} "
        f"window={result['window']} elapsed_ms={result['elapsed_ms']}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"TIMELINE_PG_PERF_SMOKE failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
