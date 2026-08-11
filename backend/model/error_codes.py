"""统一错误响应契约（CQ-P1-005 / NFR-007，Sprint-32 Slice A）。

权威业务码表见 ``docs/07-api-spec.md`` §1；本文件为其提供单一事实源：

- :class:`ErrorCode` —— 业务码枚举（``code`` 永远是业务码，不与 HTTP 码混用）；
- :data:`CODE_TO_HTTP` —— ``code → HTTP status`` 集中映射（收口散落于
  ``api/auth.py`` / ``admin.py`` / ``space_members.py`` / ``users.py`` 的 ``_status_for``）；
- :class:`ApiError` —— 统一领域异常基类，携带 ``code`` + 固定用户 ``message`` +
  由 ``code`` 推导的 ``status_code``；``backend/main.py`` 注册的 handler 统一转
  envelope ``{code,msg,data}``，api 层无需逐处手写 ``HTTPException(detail={"code":..., "msg":str(exc)})``。

现有 ~40 个领域异常（``service/*.py`` 的 ``*Error``）将在 Slice B 逐步迁移继承
``ApiError``；本文件为契约地基，先行落地集中码表 + 兜底映射 + 基类。

禁 ``str(exc)`` 直传：异常自身持有稳定 ``message``，内部细节仅进日志（NFR-007）。
"""

from __future__ import annotations

from enum import IntEnum


class ErrorCode(IntEnum):
    """业务码（权威表见 ``docs/07-api-spec.md`` §1）。"""

    UNAUTHENTICATED = 4001      # 未登录 / token 无效
    FORBIDDEN = 4003            # 无权限
    NOT_FOUND = 4004            # 资源不存在
    INVALID_CREDENTIAL = 4010   # 凭证错误 / session 无效（统一防枚举）
    ACCOUNT_LOCKED = 4030       # 账号锁定 / 禁用
    CONFLICT = 4090             # 业务冲突
    VALIDATION_FAILED = 4220    # 参数校验失败
    INTERNAL = 5000             # 服务端错误（兜底）
    SERVICE_UNAVAILABLE = 5030  # 外部 AI / OCR 服务不可用


#: ``code → HTTP status`` 集中映射（单一事实源；Slice B 收口散落的 ``_status_for``）。
CODE_TO_HTTP: dict[int, int] = {
    ErrorCode.UNAUTHENTICATED: 401,
    ErrorCode.FORBIDDEN: 403,
    ErrorCode.NOT_FOUND: 404,
    ErrorCode.INVALID_CREDENTIAL: 401,
    ErrorCode.ACCOUNT_LOCKED: 403,
    ErrorCode.CONFLICT: 409,
    ErrorCode.VALIDATION_FAILED: 422,
    ErrorCode.INTERNAL: 500,
    ErrorCode.SERVICE_UNAVAILABLE: 503,
}


#: ``HTTP status → code`` 反向映射（CQ-P1-005 Slice B-6）。
#:
#: 用于 ``backend/main.py`` HTTPException handler 的 else 分支收口——当
#: HTTPException 不带业务 ``code``（仅 FastAPI / Starlette 内置 404 / 405 等）时，
#: 把 HTTP 码反向映射到无歧义的业务码，消除 ``code`` 字段二义（旧实现把 HTTP 码
#: 当 ``code`` 返回，与 ``docs/07-api-spec.md`` §1「HTTP 码与业务码分离」相悖）。
#: 多对一反向（如 401 既可 4001 也可 4010）取最通用的语义，不取带防枚举 / 锁定
#: 等特殊语义的码；未知 HTTP 码由调用方兜底到 :attr:`ErrorCode.INTERNAL`。
HTTP_TO_CODE: dict[int, int] = {
    400: ErrorCode.VALIDATION_FAILED,
    401: ErrorCode.UNAUTHENTICATED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    405: ErrorCode.NOT_FOUND,  # 方法不允许归资源定位失败大类（B-6 决策 2026-08-11）
    409: ErrorCode.CONFLICT,
    500: ErrorCode.INTERNAL,
    502: ErrorCode.SERVICE_UNAVAILABLE,
    503: ErrorCode.SERVICE_UNAVAILABLE,
    504: ErrorCode.SERVICE_UNAVAILABLE,
}


class ApiError(Exception):
    """统一领域异常基类（CQ-P1-005 / NFR-007）。

    ``code`` 为业务码（4 位，单一含义），``message`` 为固定用户文案（禁 ``str(exc)``
    直传），``status_code`` 由 ``code`` 经 :data:`CODE_TO_HTTP` 推导，未知 ``code``
    保守降级为 400。显式传 ``status_code`` 可覆盖推导值。
    """

    code: int
    message: str
    status_code: int

    def __init__(self, code: int, message: str, status_code: int | None = None) -> None:
        self.code = int(code)
        self.message = message
        if status_code is None:
            status_code = CODE_TO_HTTP.get(self.code, 400)
        self.status_code = status_code
        super().__init__(message)

    def __repr__(self) -> str:
        return f"{type(self).__name__}(code={self.code}, status={self.status_code})"
