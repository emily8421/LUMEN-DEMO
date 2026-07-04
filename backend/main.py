"""Backend application entrypoint."""

from __future__ import annotations

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import JSONResponse
except ImportError:  # pragma: no cover - allows tests before dependencies are installed
    FastAPI = None
    HTTPException = None
    Request = None
    JSONResponse = None


def create_app():
    if FastAPI is None:
        raise RuntimeError("FastAPI is not installed")

    from backend.api.auth import router as auth_router
    from backend.api.documents import router as documents_router
    from backend.api.spaces import router as spaces_router

    app = FastAPI(title="LUMEN Knowledge Base API")

    @app.exception_handler(HTTPException)
    async def business_http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            content = {"code": exc.detail["code"], "msg": exc.detail.get("msg", "error"), "data": exc.detail.get("data")}
            return JSONResponse(status_code=exc.status_code, content=content)
        return JSONResponse(status_code=exc.status_code, content={"code": exc.status_code, "msg": str(exc.detail), "data": None})

    if auth_router is not None:
        app.include_router(auth_router)
    if spaces_router is not None:
        app.include_router(spaces_router)
    if documents_router is not None:
        app.include_router(documents_router)
    return app


app = create_app() if FastAPI is not None else None

