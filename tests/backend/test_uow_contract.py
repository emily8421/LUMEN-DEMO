"""UoW 双实现 contract（CQ-P1-003 Slice A）。

守护 UnitOfWork / DemoUnitOfWork 的结构契约（context-manager 协议 + 工厂分流）。
事务 rollback 的真语义见 test_uow_rollback.py（PG integration, Slice C）——
demo 单测层不验证 rollback（DemoUnitOfWork 为 no-op，符合既有测试分层）。
"""

from backend.repository.uow import (
    DemoUnitOfWork,
    UnitOfWork,
    unit_of_work,
)
from backend.repository.demo_repository import DemoRepository
from backend.repository.pg_repository import PgRepository


def test_pg_uow_is_context_manager():
    with UnitOfWork() as uow:
        assert uow is not None


def test_demo_uow_is_context_manager_noop():
    with DemoUnitOfWork() as uow:
        assert uow is not None


def test_factory_returns_demo_uow_for_demo_repository():
    assert isinstance(unit_of_work(DemoRepository()), DemoUnitOfWork)


def test_factory_returns_pg_uow_for_pg_repository():
    assert isinstance(unit_of_work(PgRepository()), UnitOfWork)


def test_both_uows_declare_enter_exit():
    for impl in (UnitOfWork, DemoUnitOfWork):
        assert callable(getattr(impl, "__enter__", None))
        assert callable(getattr(impl, "__exit__", None))
