"""Real PostgreSQL search + RAG smoke.

Goal: prove that after importing ``.md`` docs into the real ``PgRepository``, the
search and RAG service paths actually surface results (the in-memory demo returns
``[]`` from ``recall_chunks`` because it has no embeddings — this script uses real
pgvector + ``bge-small-zh``).

Chain exercised (all via direct service calls, no HTTP / no token):
- import_batch  ->  replaces chunks + writes embedding + builds ts_vector in one step
- search_documents  ->  4-way hybrid (substring + PG full-text + pgvector recall + title)
- answer_question   ->  RAG: candidate chunks -> sources -> LLM (silent degrade)

Isolation mirrors ``scripts/smoke-import-pg-performance.py``: seed an isolated
user + space, ``try/finally`` cleanup (``--keep-data`` to retain). Non-formal
verification script; results are for human review.

Verdict (confirmed scope):
- ok  = imported all docs + embeddings written + keyword search hits + RAG sources
- WARN (still ok exit) = semantic recall empty OR LLM degraded (search is the core ask)
- FAIL = embeddings missing OR keyword search empty OR RAG sources empty OR import failed
"""

from __future__ import annotations

import argparse
import json
import os
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


def _load_env_file(path: Path) -> None:
    """Load a .env file into os.environ without overriding already-set vars."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


_load_env_file(REPO_ROOT / ".env")

from backend.model.entities import DocumentPermission  # noqa: E402
from backend.repository.pg_repository import PgRepository  # noqa: E402
from backend.service import llm_adapter  # noqa: E402
from backend.service.db import engine, init_db  # noqa: E402
from backend.service.imports import (  # noqa: E402
    BatchImportFileRequest,
    BatchImportRequest,
    import_batch,
)
from backend.service.rag import answer_question  # noqa: E402
from backend.service.search import search_documents  # noqa: E402

try:  # embedding may be unavailable (torch DLL etc.); recall path degrades to [] then.
    from backend.service.embedding import embed_texts  # noqa: E402
except Exception:  # pragma: no cover
    embed_texts = None


# Unique marker so results cannot collide with the 2 pre-existing docs in the demo DB.
KEYWORD_TOKEN = "LUMENRAGSMOKE"

# Three docs on one theme (quantum computing). Each stays under one chunk
# (MAX_CHUNK_CHARS=900) so the marker is not split across chunks.
DOCS: list[tuple[str, str]] = [
    (
        "qubit-superposition.md",
        "# 量子比特与叠加态\n\n"
        f"{KEYWORD_TOKEN} 标记。量子比特（qubit）是量子计算的基本信息载体。与经典比特只能处于 0 或 1 不同，"
        "量子比特可以处于 0 和 1 的叠加态，即同时以一定概率处于两种状态。这种叠加特性使量子计算机能够在一个"
        "计算步骤中并行处理大量状态，从而在特定问题上展现出超越经典计算机的潜力。\n",
    ),
    (
        "entanglement.md",
        "# 量子纠缠\n\n"
        f"{KEYWORD_TOKEN} 标记。量子纠缠是多个量子比特之间形成的一种强关联。当两个量子比特相互纠缠后，"
        "无论它们相距多远，对其中一个的测量会瞬时影响另一个的状态。量子纠缠是量子通信、量子隐形传态和"
        "量子纠错的核心资源，也是量子计算实现并行加速的基础机制之一。\n",
    ),
    (
        "quantum-applications.md",
        "# 量子计算的应用前景\n\n"
        f"{KEYWORD_TOKEN} 标记。借助量子比特的叠加与纠缠特性，量子计算机有望在多个领域突破经典计算的瓶颈，"
        "例如利用 Shor 算法进行大整数分解从而威胁当前公钥密码、利用 Grover 算法加速无结构数据库搜索、"
        "模拟复杂分子以加速药物研发，以及在金融组合优化与人工智能训练中提供加速能力。\n",
    ),
]

KEYWORD_QUERY = KEYWORD_TOKEN
DEFAULT_SEMANTIC_QUERY = "利用叠加与纠缠进行高速并行计算的颠覆性技术"
DEFAULT_RAG_QUESTION = f"{KEYWORD_TOKEN} 在这几篇资料里大致指什么主题？请简述。"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run real PG search + RAG smoke.")
    parser.add_argument("--semantic-query", default=DEFAULT_SEMANTIC_QUERY,
                        help="Paraphrase query to exercise vector recall (no --keep-data).")
    parser.add_argument("--question", default=DEFAULT_RAG_QUESTION, help="RAG question.")
    parser.add_argument("--json-out", default="", help="Optional path for a JSON result file.")
    parser.add_argument("--keep-data", action="store_true", help="Leave seeded smoke data in PostgreSQL.")
    return parser.parse_args()


def seed_fixture(run_id: str) -> dict[str, Any]:
    init_db()
    with engine.begin() as conn:
        user_id = conn.execute(
            text("INSERT INTO lumen_users (external_id, name) VALUES (:external_id, :name) RETURNING id"),
            {"external_id": f"search-smoke-{run_id}", "name": "Search Rag Smoke"},
        ).scalar_one()
        space_id = conn.execute(
            text("INSERT INTO lumen_spaces (code, name) VALUES (:code, :name) RETURNING id"),
            {"code": f"search-smoke-{run_id}", "name": "Search Rag Smoke Space"},
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


def run_smoke(args: argparse.Namespace) -> dict[str, Any]:
    run_id = datetime.now(UTC).strftime("%Y%m%d%H%M%S") + "-" + secrets.token_hex(3)
    fixture: dict[str, Any] = {}
    try:
        fixture = seed_fixture(run_id)
        repository = PgRepository()

        warmup_ms: float | None = None
        if embed_texts is not None:
            try:
                t = time.perf_counter()
                embed_texts(["warmup"])
                warmup_ms = round((time.perf_counter() - t) * 1000, 2)
            except Exception:
                warmup_ms = None

        files = [
            BatchImportFileRequest(filename=fn, content=body.encode("utf-8"), relative_path=fn)
            for fn, body in DOCS
        ]
        t0 = time.perf_counter()
        result = import_batch(
            repository,
            user_id=fixture["user_id"],
            current_space_id=fixture["space_id"],
            request=BatchImportRequest(
                files=files,
                permission=DocumentPermission.TEAM,
                conflict_policy="skip",
                preserve_structure=False,
            ),
        )
        import_ms = round((time.perf_counter() - t0) * 1000, 2)
        done = result.success_count
        failed = result.failed_count
        skipped = result.skipped_count

        # Did embeddings actually land on every chunk of the imported docs?
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    "SELECT count(*) FILTER (WHERE embedding IS NOT NULL) AS with_emb, "
                    "count(*) AS total FROM lumen_chunks "
                    "WHERE document_id IN (SELECT id FROM lumen_documents WHERE space_id = :sid)"
                ),
                {"sid": fixture["space_id"]},
            ).first()
        chunk_total = int(row[1]) if row else 0
        embedding_with = int(row[0]) if row else 0
        embedding_written = chunk_total > 0 and embedding_with == chunk_total

        # Keyword search: substring + full-text path must fire.
        kw_page = search_documents(repository, fixture["user_id"], fixture["space_id"], query=KEYWORD_QUERY)
        keyword_hits = kw_page.total
        keyword_titles = [it.title for it in kw_page.items[:5]]

        # Semantic search: paraphrase, exercises the pgvector recall path.
        sem_page = search_documents(repository, fixture["user_id"], fixture["space_id"], query=args.semantic_query)
        semantic_hits = sem_page.total
        semantic_titles = [it.title for it in sem_page.items[:5]]

        # RAG: sources come from candidate chunks (keyword + vector); LLM adds the answer.
        t1 = time.perf_counter()
        answer = answer_question(repository, fixture["user_id"], fixture["space_id"], question=args.question)
        rag_ms = round((time.perf_counter() - t1) * 1000, 2)
        rag_sources = len(answer.sources)
        answer_text = answer.answer or ""
        llm_real = bool(answer_text) and not answer_text.startswith("降级模式")

        try:
            llm_enabled = llm_adapter.load_config().enabled
        except Exception:
            llm_enabled = False

        core_ok = (
            done == len(DOCS)
            and failed == 0
            and embedding_written
            and keyword_hits > 0
            and rag_sources > 0
        )
        warn = (not semantic_hits) or (not llm_real)

        if not core_ok:
            flag = "FAIL"
        elif warn:
            flag = "WARN"
        else:
            flag = "ok"

        return {
            "ok": core_ok,
            "flag": flag,
            "checked_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "run_id": run_id,
            "import": {"done": done, "failed": failed, "skipped": skipped, "elapsed_ms": import_ms},
            "embedding": {
                "warmup_ms": warmup_ms,
                "chunks": chunk_total,
                "with_embedding": embedding_with,
                "written": embedding_written,
            },
            "keyword": {"query": KEYWORD_QUERY, "hits": keyword_hits, "titles": keyword_titles},
            "semantic": {"query": args.semantic_query, "hits": semantic_hits, "titles": semantic_titles},
            "rag": {
                "question": args.question,
                "sources": rag_sources,
                "llm_enabled": llm_enabled,
                "llm_real": llm_real,
                "elapsed_ms": rag_ms,
                "answer_preview": answer_text[:300],
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
    print(
        f"SEARCH_RAG_PG_SMOKE {result['flag']} "
        f"done={result['import']['done']} failed={result['import']['failed']} "
        f"chunks={result['embedding']['chunks']} emb_written={result['embedding']['written']} "
        f"keyword_hits={result['keyword']['hits']} semantic_hits={result['semantic']['hits']} "
        f"rag_sources={result['rag']['sources']} llm_enabled={result['rag']['llm_enabled']} "
        f"llm_real={result['rag']['llm_real']} "
        f"import_ms={result['import']['elapsed_ms']} rag_ms={result['rag']['elapsed_ms']}"
    )
    # WARN keeps exit 0: search (the core ask) passed; LLM/semantic are advisory.
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # pragma: no cover
        print(f"SEARCH_RAG_PG_SMOKE failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
