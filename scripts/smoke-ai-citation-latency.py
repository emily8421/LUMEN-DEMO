"""Real PG + LLM latency smoke for API-028 citation mode.

Seeds an isolated PostgreSQL space with citation source documents, calls
backend.service.ai_polish.polish_selection(mode="citation") through the real
PgRepository and configured LLM adapter, records elapsed time, then removes the
fixture. The script prints only non-secret config status and timing summaries.
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import statistics
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.model.entities import DocumentPermission  # noqa: E402
from backend.repository.pg_repository import PgRepository  # noqa: E402
from backend.service import llm_adapter  # noqa: E402
from backend.service.ai_polish import PolishRequest, polish_selection  # noqa: E402
from backend.service.db import engine, init_db  # noqa: E402
from backend.service.document import DocumentCreate, create_document  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run real PG + LLM citation latency smoke.")
    parser.add_argument("--runs", type=int, default=3, help="Number of citation calls.")
    parser.add_argument("--max-seconds", type=float, default=15.0, help="Maximum allowed single-call elapsed seconds.")
    parser.add_argument("--query", default="phoenix launch risk", help="Citation query / instruction.")
    parser.add_argument("--env-file", default=".env", help="Optional dotenv file to load without overriding env vars.")
    parser.add_argument("--json-out", default="", help="Optional path for a JSON result file.")
    parser.add_argument("--keep-data", action="store_true", help="Leave seeded smoke data in PostgreSQL.")
    return parser.parse_args()


def ensure_positive(value: int, label: str) -> None:
    if value < 1:
        raise ValueError(f"{label} must be positive.")


def load_env_file(path_value: str) -> None:
    if not path_value:
        return
    path = Path(path_value)
    if not path.is_absolute():
        path = REPO_ROOT / path
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip().strip('"').strip("'")
        os.environ[key] = value


def seed_fixture(query: str, run_id: str) -> dict[str, Any]:
    init_db()
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
                "external_id": f"ai-citation-latency-{run_id}",
                "name": "AI Citation Latency Smoke",
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
                "code": f"ai-citation-latency-{run_id}",
                "name": "AI Citation Latency Space",
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

    repository = PgRepository()
    source_texts = [
        (
            "Phoenix Launch Risk Brief",
            "Phoenix launch risk depends on support readiness, onboarding docs, and customer escalation routes.",
        ),
        (
            "Phoenix Customer Evidence",
            "Customer interviews mention phoenix launch risk when rollout notes lack owner names and fallback paths.",
        ),
        (
            "Phoenix Mitigation Plan",
            "The mitigation plan says phoenix launch risk should be reduced with weekly review and cited evidence.",
        ),
    ]
    source_ids = []
    for title, content in source_texts:
        doc = create_document(
            repository,
            user_id,
            space_id,
            DocumentCreate(title=f"{title} {run_id}", content_md=content, permission=DocumentPermission.TEAM),
        )
        source_ids.append(doc.id)

    target = create_document(
        repository,
        user_id,
        space_id,
        DocumentCreate(
            title=f"Phoenix Draft {run_id}",
            content_md=f"Draft section needing cited support for {query}.",
            permission=DocumentPermission.TEAM,
        ),
    )
    return {"run_id": run_id, "user_id": user_id, "space_id": space_id, "target_id": target.id, "source_ids": source_ids}


def cleanup_fixture(fixture: dict[str, Any]) -> None:
    with engine.begin() as conn:
        space_id = fixture.get("space_id")
        user_id = fixture.get("user_id")
        if space_id:
            conn.execute(text("DELETE FROM lumen_spaces WHERE id = :space_id"), {"space_id": space_id})
        if user_id:
            conn.execute(text("DELETE FROM lumen_users WHERE id = :user_id"), {"user_id": user_id})


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((len(ordered) - 1) * ratio)))
    return ordered[index]


def run_smoke(args: argparse.Namespace) -> dict[str, Any]:
    ensure_positive(args.runs, "runs")
    load_env_file(args.env_file)
    llm_config = llm_adapter.load_config()
    if not llm_config.enabled:
        raise RuntimeError("LLM not configured; set LLM_PROVIDER and LLM_API_KEY before running this smoke.")

    run_id = datetime.now(UTC).strftime("%Y%m%d%H%M%S") + "-" + secrets.token_hex(3)
    fixture: dict[str, Any] = {}
    try:
        fixture = seed_fixture(args.query, run_id)
        repository = PgRepository()
        request = PolishRequest(
            mode="citation",
            selection_md=f"Summarize and cite evidence for {args.query}.",
            instruction=args.query,
        )

        samples: list[dict[str, Any]] = []
        for ordinal in range(1, args.runs + 1):
            started = time.perf_counter()
            view = polish_selection(
                repository,
                fixture["user_id"],
                fixture["space_id"],
                fixture["target_id"],
                request,
            )
            elapsed_seconds = time.perf_counter() - started
            if not view.sources:
                raise AssertionError("Expected at least one citation source.")
            if elapsed_seconds > args.max_seconds:
                raise AssertionError(
                    f"Citation call {ordinal} exceeded budget: {elapsed_seconds:.3f}s > {args.max_seconds:.3f}s."
                )
            samples.append(
                {
                    "run": ordinal,
                    "elapsed_ms": round(elapsed_seconds * 1000, 2),
                    "sources": len(view.sources),
                    "output_chars": len(view.output_md),
                    "draft_id": view.draft_id,
                }
            )

        elapsed_values = [sample["elapsed_ms"] for sample in samples]
        return {
            "ok": True,
            "checked_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "run_id": run_id,
            "provider": llm_config.provider,
            "model": llm_config.model,
            "runs": args.runs,
            "max_seconds": args.max_seconds,
            "samples": samples,
            "summary": {
                "min_ms": round(min(elapsed_values), 2),
                "p50_ms": round(statistics.median(elapsed_values), 2),
                "p95_ms": round(percentile(elapsed_values, 0.95), 2),
                "max_ms": round(max(elapsed_values), 2),
            },
        }
    finally:
        if fixture and not args.keep_data:
            cleanup_fixture(fixture)


def main() -> int:
    args = parse_args()
    result = run_smoke(args)
    if args.json_out:
        Path(args.json_out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = result["summary"]
    sample_text = ", ".join(f"run{sample['run']}={sample['elapsed_ms']}ms" for sample in result["samples"])
    print(
        "AI_CITATION_LATENCY_SMOKE ok "
        f"provider={result['provider']} model={result['model']} runs={result['runs']} "
        f"min_ms={summary['min_ms']} p50_ms={summary['p50_ms']} "
        f"p95_ms={summary['p95_ms']} max_ms={summary['max_ms']} samples=[{sample_text}]"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"AI_CITATION_LATENCY_SMOKE failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
