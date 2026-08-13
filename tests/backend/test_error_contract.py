"""CQ-P1-005 / NFR-007（Sprint-32 Slice A）错误响应契约单测。

覆盖：
- :class:`ErrorCode` / :data:`CODE_TO_HTTP` 映射完整性（对照 ``docs/07-api-spec.md`` §1）；
- :class:`ApiError` 构造（``status_code`` 由 ``code`` 推导 / 显式覆盖 / 未知码降级）；
- ``backend/main.py`` 三 handler（HTTPException / ApiError / 兜底 Exception）的 HTTP
  层 envelope 输出（TestClient 断言，补 ``docs/05-tech-spec.md`` §4.2.4「envelope
  序列化层无回归保护」）。
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from backend.model.error_codes import CODE_TO_HTTP, HTTP_TO_CODE, ApiError, ErrorCode

_logger = logging.getLogger("lumen-test")


def _build_app() -> FastAPI:
    """最小 app，复刻 ``backend/main.py`` 的三 handler 注册（不依赖 PG lifespan）。"""
    app = FastAPI()

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc: HTTPException):  # noqa: ANN001
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            content = {
                "code": exc.detail["code"],
                "msg": exc.detail.get("msg", "error"),
                "data": exc.detail.get("data"),
            }
            return JSONResponse(status_code=exc.status_code, content=content)
        # CQ-P1-005 Slice B-6：else 分支收口（与 backend/main.py 同步）。
        code = int(HTTP_TO_CODE.get(exc.status_code, ErrorCode.INTERNAL))
        _logger.warning("unclassified HTTPException %d: %r", exc.status_code, exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": code, "msg": "request failed", "data": None},
        )

    @app.exception_handler(ApiError)
    async def api_error_handler(request, exc: ApiError):  # noqa: ANN001
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.code, "msg": exc.message, "data": None},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc: Exception):  # noqa: ANN001
        _logger.error("unhandled exception: %r", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"code": int(ErrorCode.INTERNAL), "msg": "internal error", "data": None},
        )

    @app.get("/raise/api-error")
    def raise_api_error():
        raise ApiError(ErrorCode.FORBIDDEN, "space access denied")

    @app.get("/raise/unhandled")
    def raise_unhandled():
        raise RuntimeError("boom")

    @app.get("/raise/http-with-code")
    def raise_http_with_code():
        raise HTTPException(status_code=404, detail={"code": 4004, "msg": "not found"})

    @app.get("/raise/http-no-code")
    def raise_http_no_code():
        # 模拟 FastAPI / Starlette 内置 HTTPException（不带业务 code，走 else 分支）。
        raise HTTPException(status_code=404, detail="Not Found")

    @app.get("/raise/http-no-code-405")
    def raise_http_no_code_405():
        raise HTTPException(status_code=405, detail="Method Not Allowed")

    @app.get("/raise/http-no-code-418")
    def raise_http_no_code_418():
        # 未知 HTTP 码，验证兜底到 INTERNAL。
        raise HTTPException(status_code=418, detail="I'm a teapot")

    return app


client = TestClient(_build_app(), raise_server_exceptions=False)


def test_error_code_matches_authoritative_set():
    """ErrorCode 覆盖 ``docs/07-api-spec.md`` §1 权威业务码全集。"""
    expected = {4001, 4003, 4004, 4010, 4030, 4090, 4220, 5000, 5030, 5031}
    assert {int(c) for c in ErrorCode} == expected


def test_code_to_http_complete_and_sensible():
    """每个 code 都有映射，且落在合法 HTTP 区间；关键语义对齐。"""
    for code in ErrorCode:
        assert code in CODE_TO_HTTP
        assert 100 <= CODE_TO_HTTP[code] < 600
    assert CODE_TO_HTTP[ErrorCode.UNAUTHENTICATED] == 401
    assert CODE_TO_HTTP[ErrorCode.FORBIDDEN] == 403
    assert CODE_TO_HTTP[ErrorCode.NOT_FOUND] == 404
    assert CODE_TO_HTTP[ErrorCode.INVALID_CREDENTIAL] == 401
    assert CODE_TO_HTTP[ErrorCode.ACCOUNT_LOCKED] == 403
    assert CODE_TO_HTTP[ErrorCode.CONFLICT] == 409
    assert CODE_TO_HTTP[ErrorCode.VALIDATION_FAILED] == 422
    assert CODE_TO_HTTP[ErrorCode.INTERNAL] == 500
    assert CODE_TO_HTTP[ErrorCode.SERVICE_UNAVAILABLE] == 503
    assert CODE_TO_HTTP[ErrorCode.DB_NOT_READY] == 503


def test_api_error_status_derived_from_code():
    err = ApiError(ErrorCode.FORBIDDEN, "space access denied")
    assert err.code == 4003
    assert err.message == "space access denied"
    assert err.status_code == 403


def test_api_error_explicit_status_overrides():
    err = ApiError(ErrorCode.UNAUTHENTICATED, "x", status_code=410)
    assert err.status_code == 410


def test_api_error_unknown_code_defaults_to_400():
    err = ApiError(9999, "weird")
    assert err.code == 9999
    assert err.status_code == 400


def test_api_error_handler_returns_envelope():
    resp = client.get("/raise/api-error")
    assert resp.status_code == 403
    assert resp.json() == {"code": 4003, "msg": "space access denied", "data": None}


def test_unhandled_exception_returns_envelope_without_leak():
    """未捕获异常走兜底 handler：返回 5000 envelope，不回传堆栈 / 内部细节。"""
    resp = client.get("/raise/unhandled")
    assert resp.status_code == 500
    assert resp.json() == {"code": 5000, "msg": "internal error", "data": None}
    assert "boom" not in resp.text
    assert "RuntimeError" not in resp.text


def test_http_exception_with_code_still_envelope():
    """既有 HTTPException(detail={"code":...}) 契约不被新 handler 破坏。"""
    resp = client.get("/raise/http-with-code")
    assert resp.status_code == 404
    assert resp.json() == {"code": 4004, "msg": "not found", "data": None}


def test_http_exception_without_code_maps_to_business_code():
    """B-6：不带业务 code 的 HTTPException（FastAPI / Starlette 内置）走 else 分支，
    code 反向映射到业务码（404→4004，非 HTTP 码 404），msg 固定文案，原始 detail 不外泄。"""
    resp = client.get("/raise/http-no-code")
    assert resp.status_code == 404
    body = resp.json()
    assert body == {"code": 4004, "msg": "request failed", "data": None}
    assert "Not Found" not in resp.text  # NFR-007：原始 detail 不泄露


def test_http_exception_405_maps_to_not_found():
    """B-6 决策：405 Method Not Allowed 反向映射到 4004 NOT_FOUND。"""
    resp = client.get("/raise/http-no-code-405")
    assert resp.status_code == 405
    assert resp.json()["code"] == 4004


def test_http_exception_unknown_status_falls_back_to_internal():
    """B-6：未知 HTTP 码（418）兜底到 5000 INTERNAL。"""
    resp = client.get("/raise/http-no-code-418")
    assert resp.status_code == 418
    assert resp.json()["code"] == 5000
