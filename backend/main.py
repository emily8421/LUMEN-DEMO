"""Backend application entrypoint."""

from __future__ import annotations

import os

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import JSONResponse
except ImportError:  # pragma: no cover - allows tests before dependencies are installed
    FastAPI = None
    HTTPException = None
    Request = None
    JSONResponse = None


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(_app):
    """启动时初始化 PG + pgvector（task-008 T1）。

    task-008 T5 起，单例 ``repository`` 切到 PgRepository，后端运行时强依赖
    PostgreSQL（不再降级到内存 demo）。init 失败时仅记录、不崩溃启动；此时 API
    查询会在连接时报错，而非走内存兜底。生产/demo 均需 lumen-pg 容器 healthy。
    """
    # Sprint-26 护栏（accounts-auth §7/§10）：生产环境禁用 demo 仓储，fail-fast
    from backend.repository import repository
    from backend.service.auth import is_demo_repository

    if os.environ.get("LUMEN_ENV", "").lower() == "production" and is_demo_repository(repository):
        raise RuntimeError("[AUTH] LUMEN_ENV=production must not use the demo repository")
    try:
        from backend.service.db import init_db

        init_db()
        # Sprint-12②：seed 文档自索引回填（migrations/005 直接 INSERT 不经服务层）
        from backend.repository import repository
        from backend.service.document import ensure_documents_indexed

        indexed = ensure_documents_indexed(repository)
        if indexed:
            print(f"[seed] indexed {indexed} previously unindexed document(s)")
    except Exception as exc:  # pragma: no cover - 依赖外部 PG 容器
        print(f"[db] init skipped: {exc} (PG required since T5; queries will error)")
    yield


def create_app():
    if FastAPI is None:
        raise RuntimeError("FastAPI is not installed")

    from backend.api.admin import router as admin_router
    from backend.api.auth import router as auth_router
    from backend.api.doc_links import router as doc_links_router
    from backend.api.tags import router as tags_router
    from backend.api.quick_entry import router as quick_entry_router
    from backend.api.documents import router as documents_router
    from backend.api.export import router as export_router
    from backend.api.folders import router as folders_router
    from backend.api.imports import router as imports_router
    from backend.api.rag import router as rag_router
    from backend.api.search import router as search_router
    from backend.api.spaces import router as spaces_router
    from backend.api.space_members import router as space_members_router
    from backend.api.timeline import router as timeline_router
    from backend.api.terms import router as terms_router
    from backend.api.users import router as users_router

    app = FastAPI(title="LUMEN Knowledge Base API", lifespan=lifespan)

    @app.exception_handler(HTTPException)
    async def business_http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            content = {"code": exc.detail["code"], "msg": exc.detail.get("msg", "error"), "data": exc.detail.get("data")}
            return JSONResponse(status_code=exc.status_code, content=content)
        return JSONResponse(status_code=exc.status_code, content={"code": exc.status_code, "msg": str(exc.detail), "data": None})

    if auth_router is not None:
        app.include_router(auth_router)
    if admin_router is not None:
        app.include_router(admin_router)
    if spaces_router is not None:
        app.include_router(spaces_router)
    if space_members_router is not None:
        app.include_router(space_members_router)
    if documents_router is not None:
        app.include_router(documents_router)
    if imports_router is not None:
        app.include_router(imports_router)
    if doc_links_router is not None:
        app.include_router(doc_links_router)
    if tags_router is not None:
        app.include_router(tags_router)
    if quick_entry_router is not None:
        app.include_router(quick_entry_router)
    if export_router is not None:
        app.include_router(export_router)
    if folders_router is not None:
        app.include_router(folders_router)
    if search_router is not None:
        app.include_router(search_router)
    if timeline_router is not None:
        app.include_router(timeline_router)
    if rag_router is not None:
        app.include_router(rag_router)
    if terms_router is not None:
        app.include_router(terms_router)
    if users_router is not None:
        app.include_router(users_router)
    return app


app = create_app() if FastAPI is not None else None

