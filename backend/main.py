"""Backend application entrypoint."""

from __future__ import annotations

try:
    from fastapi import FastAPI
except ImportError:  # pragma: no cover - allows tests before dependencies are installed
    FastAPI = None


def create_app():
    if FastAPI is None:
        raise RuntimeError("FastAPI is not installed")

    from backend.api.auth import router as auth_router
    from backend.api.spaces import router as spaces_router

    app = FastAPI(title="LUMEN Knowledge Base API")
    if auth_router is not None:
        app.include_router(auth_router)
    if spaces_router is not None:
        app.include_router(spaces_router)
    return app


app = create_app() if FastAPI is not None else None
