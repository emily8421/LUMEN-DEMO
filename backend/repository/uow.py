"""Unit of Work — 事务边界（CQ-P1-003）。

contextvar 渐进路线：PgRepository 方法经 ``_session_scope()`` 感知当前事务
session（有则复用、无则自建并自行 commit）；多步用例在 service 层
``with unit_of_work(repository):`` 包裹，共享一个 session 原子提交。

- PgRepository → 真实事务（``UnitOfWork``：enter 开 session、exit commit/rollback）。
- DemoRepository（内存）→ no-op（``DemoUnitOfWork``）：rollback 语义靠 PostgreSQL
  integration 测试验证（既有「demo 测业务、PG 测持久化」分层）。
- nested join：service→service 嵌套（如 import_batch → import_extracted_text
  → create_document）时，内层 UoW 检测到 contextvar 已有 session 则 join
  （不新开、不 commit），最外层 UoW 拥有事务。
"""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Iterator, Protocol, runtime_checkable

from sqlalchemy.orm import Session

from backend.service.db import SessionLocal

_current_session: ContextVar[Session | None] = ContextVar(
    "_lumen_current_session", default=None
)


@contextmanager
def _session_scope() -> Iterator[Session]:
    """PgRepository 方法的 session 取得器（收口所有 commit）。

    - 处于 UoW 事务内（contextvar 有 session）：复用，不 commit 不 close。
    - 否则：自建 SessionLocal，退出时 commit（与改造前逐方法等价）。
    """
    sess = _current_session.get()
    if sess is None:
        with SessionLocal() as sess:
            yield sess
            sess.commit()
    else:
        yield sess


@runtime_checkable
class UnitOfWorkProtocol(Protocol):
    """UoW 双实现契约（结构面；事务 rollback 语义靠 PG integration 验证）。"""

    def __enter__(self) -> "UnitOfWorkProtocol": ...

    def __exit__(self, exc_type, exc, tb) -> None: ...


class UnitOfWork:
    """PG Unit of Work（真实事务，支持 nested join）。"""

    def __init__(self) -> None:
        self._session: Session | None = None
        self._token = None
        self._joined = False

    def __enter__(self) -> "UnitOfWork":
        existing = _current_session.get()
        if existing is not None:
            # 嵌套：join 外层事务，不新开、不 commit、不 close。
            self._joined = True
            self._session = existing
            return self
        self._joined = False
        self._session = SessionLocal()
        self._token = _current_session.set(self._session)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._joined:
            return  # 外层 UoW 管生命周期
        session = self._session
        assert session is not None
        try:
            if exc_type is None:
                session.commit()
            else:
                session.rollback()
        finally:
            session.close()
            _current_session.reset(self._token)
        # 返回 None → 不吞异常，原样冒泡走 main.py ApiError handler


class DemoUnitOfWork:
    """内存 DemoRepository 的 UoW（no-op）：commit/rollback 空操作。"""

    def __enter__(self) -> "DemoUnitOfWork":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None  # no-op；不吞异常


def unit_of_work(repository: object) -> UnitOfWorkProtocol:
    """按仓储类型分流：DemoRepository（is_demo）→ no-op，其余 → 真实事务。"""
    if getattr(repository, "is_demo", False):
        return DemoUnitOfWork()
    return UnitOfWork()
