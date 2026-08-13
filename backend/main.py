"""Backend application entrypoint."""

from __future__ import annotations

import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from backend.config import get_settings, validate_runtime_secrets

logger = logging.getLogger("lumen")


@asynccontextmanager
async def lifespan(_app):
    """启动时初始化 PG + pgvector（task-008 T1）。

    task-008 T5 起，单例 ``repository`` 切到 PgRepository，后端运行时强依赖
    PostgreSQL（不再降级到内存 demo）。CQ-P1-001 起 fail-fast：PG 模式（非 demo
    仓储）``init_db`` / ``ensure_documents_indexed`` 失败时记录后 re-raise 拒绝
    启动，避免带病运行；demo 仓储模式保留容忍降级（仅记录），供本地无 PG 环境启动。
    """
    # Sprint-26 护栏（accounts-auth §7/§10）：生产环境禁用 demo 仓储，fail-fast
    from backend.repository import repository
    from backend.service.auth import is_demo_repository

    # CQ-P2-003：生产环境 fail-closed 校验弱默认 signing key
    validate_runtime_secrets(get_settings())
    if get_settings().lumen_env.lower() == "production" and is_demo_repository(repository):
        raise RuntimeError("[AUTH] LUMEN_ENV=production must not use the demo repository")
    try:
        from backend.service.db import init_db

        init_db()
        # Sprint-12②：seed 文档自索引回填（migrations/005 直接 INSERT 不经服务层）
        from backend.repository import repository
        from backend.service.document import ensure_documents_indexed

        indexed = ensure_documents_indexed(repository)
        if indexed:
            logger.info("seed indexed %d previously unindexed document(s)", indexed)
    except Exception as exc:  # pragma: no cover - 依赖外部 PG 容器
        if is_demo_repository(repository):
            # demo 仓储模式：容忍降级（本地无 PG 仍可启动，查询走内存兜底）
            logger.warning("db init skipped in demo mode: %s", exc)
        else:
            # PG 模式：强依赖 PG，init 失败 fail-fast 拒绝启动（CQ-P1-001）
            logger.error("db init failed in PG mode, refusing to start", exc_info=True)
            raise
    yield


def create_app():
    from backend.api.admin import router as admin_router
    from backend.api.auth import router as auth_router
    from backend.api.health import router as health_router
    from backend.api.doc_links import router as doc_links_router
    from backend.api.tags import router as tags_router
    from backend.api.quick_entry import router as quick_entry_router
    from backend.api.documents import router as documents_router
    from backend.api.export import router as export_router
    from backend.api.folders import router as folders_router
    from backend.api.imports import router as imports_router
    from backend.api.rag import config_router as llm_configs_router
    from backend.api.rag import router as rag_router
    from backend.api.search import router as search_router
    from backend.api.spaces import router as spaces_router
    from backend.api.space_members import router as space_members_router
    from backend.api.timeline import router as timeline_router
    from backend.api.term_categories import router as term_categories_router
    from backend.api.terms import router as terms_router
    from backend.api.users import router as users_router

    app = FastAPI(title="LUMEN Knowledge Base API", lifespan=lifespan)

    @app.exception_handler(HTTPException)
    async def business_http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            content = {"code": exc.detail["code"], "msg": exc.detail.get("msg", "error"), "data": exc.detail.get("data")}
            return JSONResponse(status_code=exc.status_code, content=content)
        # CQ-P1-005 Slice B-6：else 分支（HTTPException 不带业务 code，仅 FastAPI /
        # Starlette 内置 404 / 405 等）收口——code 反向映射到业务码消除二义（旧实现
        # 把 HTTP 码当 code 返回），msg 固定文案禁 str(exc)（NFR-007），原始 detail
        # 仅进 warning 日志不外泄。HTTP status_code 保持原值，HTTP 层行为不变。
        code = int(HTTP_TO_CODE.get(exc.status_code, ErrorCode.INTERNAL))
        logger.warning(
            "unclassified HTTPException %d on %s %s: %r",
            exc.status_code,
            request.method,
            request.url.path,
            exc.detail,
        )
        return JSONResponse(status_code=exc.status_code, content={"code": code, "msg": "request failed", "data": None})

    # CQ-P1-005 / NFR-007（Sprint-32 Slice A）：统一错误响应契约地基。
    # ApiError 领域异常 → envelope；未捕获 Exception → 兜底 5000 envelope（不回传堆栈）。
    # 现有 ~40 领域异常将在 Slice B 迁移继承 ApiError；本处为契约注册先行。
    from backend.model.error_codes import HTTP_TO_CODE, ApiError, ErrorCode

    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "msg": exc.message, "data": None},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(
            "unhandled exception on %s %s: %r",
            request.method,
            request.url.path,
            exc,
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={"code": int(ErrorCode.INTERNAL), "msg": "internal error", "data": None},
        )

    if auth_router is not None:
        app.include_router(auth_router)
    if health_router is not None:
        app.include_router(health_router)
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
    if llm_configs_router is not None:
        app.include_router(llm_configs_router)
    if term_categories_router is not None:
        app.include_router(term_categories_router)
    if terms_router is not None:
        app.include_router(terms_router)
    if users_router is not None:
        app.include_router(users_router)
    return app


app = create_app() if FastAPI is not None else None

