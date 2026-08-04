"""Real PostgreSQL + embedding performance smoke for batch import (API-029 / Flow-006).

The script seeds an isolated space + user, imports N generated ``.md`` docs through
the real ``PgRepository`` + ``backend.service.imports.import_batch`` in batches
(mimicking the frontend's 50/batch sequential upload), measures per-batch + total
elapsed (including real ``bge-small-zh`` embedding and the O(documents)
``list_documents`` dedup scan that runs once per file), confirms embeddings were
actually written, then removes the fixture.

Default 200 docs / batch 50 is a quick meaningful run; pass ``--documents 1000`` to
stress the full large-vault case. This complements the in-memory multipart smoke
(``docs/09-verification.md`` RISK-P1-008), which validated the Starlette limit fix
but not the real PG + embedding cost.
"""

from __future__ import annotations

import argparse
import json
import secrets
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
from backend.service.db import engine, init_db  # noqa: E402
from backend.service.imports import (  # noqa: E402
    BatchImportFileRequest,
    BatchImportRequest,
    import_batch,
)

try:  # embedding may be unavailable (torch DLL etc.); import_batch degrades to text-only then.
    from backend.service.embedding import embed_texts  # noqa: E402
except Exception:  # pragma: no cover
    embed_texts = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run real PG + embedding batch-import performance smoke.")
    parser.add_argument("--documents", type=int, default=200, help="Number of .md docs to import.")
    parser.add_argument("--batch-size", type=int, default=50, help="Files per import_batch call (matches frontend IMPORT_BATCH_SIZE).")
    parser.add_argument("--preserve-structure", dest="preserve_structure", action="store_true", default=True, help="Create lumen_folders (frontend-realistic).")
    parser.add_argument("--no-preserve-structure", dest="preserve_structure", action="store_false", help="Flat import, no folders.")
    parser.add_argument("--max-seconds", type=float, default=0.0, help="If >0, warn (not fail) when total elapsed exceeds this.")
    parser.add_argument("--json-out", default="", help="Optional path for a JSON result file.")
    parser.add_argument("--keep-data", action="store_true", help="Leave seeded smoke data in PostgreSQL.")
    return parser.parse_args()


def assert_positive(value: int, label: str) -> None:
    if value < 1:
        raise ValueError(f"{label} must be positive.")


def seed_fixture(run_id: str) -> dict[str, Any]:
    init_db()
    with engine.begin() as conn:
        user_id = conn.execute(
            text("INSERT INTO lumen_users (external_id, name) VALUES (:external_id, :name) RETURNING id"),
            {"external_id": f"import-smoke-{run_id}", "name": "Import Smoke"},
        ).scalar_one()
        space_id = conn.execute(
            text("INSERT INTO lumen_spaces (code, name) VALUES (:code, :name) RETURNING id"),
            {"code": f"import-smoke-{run_id}", "name": "Import Smoke Space"},
        ).scalar_one()
        conn.execute(
            text("INSERT INTO lumen_space_members (user_id, space_id, role) VALUES (:user_id, :space_id, 'admin')"),
            {"user_id": user_id, "space_id": space_id},
        )
    return {"run_id": run_id, "user_id": user_id, "space_id": space_id}


def cleanup_fixture(fixture: dict[str, Any]) -> None:
    if not fixture:
        return
    with engine.begin() as conn:
        # Deleting the space cascades docs/chunks/versions/folders/imports/tags/members
        # (all space_id ON DELETE CASCADE); the user is safe to delete afterwards.
        if fixture.get("space_id"):
            conn.execute(text("DELETE FROM lumen_spaces WHERE id = :space_id"), {"space_id": fixture["space_id"]})
        if fixture.get("user_id"):
            conn.execute(text("DELETE FROM lumen_users WHERE id = :user_id"), {"user_id": fixture["user_id"]})


def make_file_request(index: int, run_id: str, preserve_structure: bool) -> BatchImportFileRequest:
    n = f"{index:04d}"
    filename = f"doc-{n}.md"
    rel = f"smoke-{run_id}/{filename}" if preserve_structure else filename
    content = (
        f"# PG import smoke {run_id} {n}\n\n"
        f"关键词 pg-import-smoke {run_id} 第 {n} 篇，用于压测批量导入 + 真实 embedding。\n"
    ).encode("utf-8")
    return BatchImportFileRequest(filename=filename, content=content, relative_path=rel)


def run_smoke(args: argparse.Namespace) -> dict[str, Any]:
    assert_positive(args.documents, "documents")
    assert_positive(args.batch_size, "batch-size")
    run_id = datetime.now(UTC).strftime("%Y%m%d%H%M%S") + "-" + secrets.token_hex(3)
    fixture: dict[str, Any] = {}
    try:
        fixture = seed_fixture(run_id)
        repository = PgRepository()

        # Warm up the embedding model so the timed loop reflects steady-state perf.
        warmup_ms: float | None = None
        if embed_texts is not None:
            try:
                t = time.perf_counter()
                embed_texts(["warmup"])
                warmup_ms = round((time.perf_counter() - t) * 1000, 2)
            except Exception:
                warmup_ms = None

        agg = {"done": 0, "failed": 0, "skipped": 0}
        per_batch: list[dict[str, Any]] = []
        first_doc_id: int | None = None
        total_start = time.perf_counter()
        for start in range(0, args.documents, args.batch_size):
            indexes = range(start, min(start + args.batch_size, args.documents))
            files = [make_file_request(i, run_id, args.preserve_structure) for i in indexes]
            b_start = time.perf_counter()
            result = import_batch(
                repository,
                user_id=fixture["user_id"],
                current_space_id=fixture["space_id"],
                request=BatchImportRequest(
                    files=files,
                    permission=DocumentPermission.TEAM,
                    conflict_policy="skip",
                    preserve_structure=args.preserve_structure,
                ),
            )
            b_elapsed = time.perf_counter() - b_start
            agg["done"] += result.success_count
            agg["failed"] += result.failed_count
            agg["skipped"] += result.skipped_count
            if first_doc_id is None:
                first_doc_id = next((it.parsed_doc_id for it in result.items if it.parsed_doc_id), None)
            per_batch.append(
                {
                    "batch": len(per_batch) + 1,
                    "files": len(files),
                    "done": result.success_count,
                    "failed": result.failed_count,
                    "skipped": result.skipped_count,
                    "elapsed_ms": round(b_elapsed * 1000, 2),
                }
            )
        total_elapsed = time.perf_counter() - total_start

        # Did embedding actually run? Sample one chunk of the first imported doc.
        embedding_written = False
        if first_doc_id is not None:
            with engine.connect() as conn:
                row = conn.execute(
                    text("SELECT embedding IS NOT NULL FROM lumen_chunks WHERE document_id = :doc_id LIMIT 1"),
                    {"doc_id": first_doc_id},
                ).first()
                embedding_written = bool(row and row[0])

        if agg["done"] + agg["skipped"] != args.documents:
            raise AssertionError(
                f"Import counts mismatch: done={agg['done']} skipped={agg['skipped']} != documents={args.documents}"
            )
        if agg["failed"] != 0:
            raise AssertionError(f"Unexpected failed imports: {agg['failed']}")

        budget_warn = args.max_seconds > 0 and total_elapsed > args.max_seconds

        return {
            "ok": True,
            "checked_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "run_id": run_id,
            "documents": args.documents,
            "batch_size": args.batch_size,
            "batches": len(per_batch),
            "preserve_structure": args.preserve_structure,
            "embedding_warmup_ms": warmup_ms,
            "embedding_written": embedding_written,
            "done": agg["done"],
            "skipped": agg["skipped"],
            "failed": agg["failed"],
            "total_elapsed_ms": round(total_elapsed * 1000, 2),
            "ms_per_doc": round(total_elapsed * 1000 / max(agg["done"], 1), 2),
            "first_batch_ms": per_batch[0]["elapsed_ms"] if per_batch else None,
            "last_batch_ms": per_batch[-1]["elapsed_ms"] if per_batch else None,
            "budget_exceeded": budget_warn,
            "per_batch": per_batch,
        }
    finally:
        if fixture and not args.keep_data:
            cleanup_fixture(fixture)


def main() -> int:
    args = parse_args()
    result = run_smoke(args)
    if args.json_out:
        Path(args.json_out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    flag = "WARN budget_exceeded" if result["budget_exceeded"] else "ok"
    print(
        f"IMPORT_PG_PERF_SMOKE {flag} "
        f"documents={result['documents']} batch={result['batch_size']} batches={result['batches']} "
        f"done={result['done']} skip={result['skipped']} fail={result['failed']} "
        f"embedding_written={result['embedding_written']} warmup_ms={result['embedding_warmup_ms']} "
        f"total_ms={result['total_elapsed_ms']} ms/doc={result['ms_per_doc']} "
        f"first_batch_ms={result['first_batch_ms']} last_batch_ms={result['last_batch_ms']} "
        f"preserve_structure={result['preserve_structure']}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"IMPORT_PG_PERF_SMOKE failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
