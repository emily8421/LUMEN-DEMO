"""Repository 契约测试（CQ-P1-002 Slice A）。

守护 ``PgRepository``（生产 PG）/ ``DemoRepository``（测试内存 fake）双实现满足
``RepositoryProtocol``，且公共方法面零漂移——取代旧 ``pg_repository.py`` docstring
所述 "same interface, duck-typed" 的人工对照。

覆盖：
- 双实现 ``isinstance(repo, RepositoryProtocol)`` 通过（``@runtime_checkable``）；
- ``PgRepository`` / ``DemoRepository`` 公共方法名集合一致（发现双实现漂移）；
- ``RepositoryProtocol`` 声明的方法面 = ``PgRepository`` 公共方法（发现契约漂移：
  PgRepository 加新方法忘了写进 Protocol，或反之）。

注：``runtime_checkable`` isinstance 只检查方法名存在，不查签名；签名一致性由
``RepositoryProtocol`` 的显式声明（机器提取自 PgRepository）+ 静态工具（mypy/pyright/IDE）守护。
"""

from __future__ import annotations

import inspect

from backend.repository.demo_repository import DemoRepository
from backend.repository.pg_repository import PgRepository
from backend.repository.protocol import RepositoryProtocol


def _public_method_names(obj: type) -> set[str]:
    """对象的公共方法名集合（排除 _ 开头的私有 / dunder）。"""
    return {
        name
        for name, _member in inspect.getmembers(obj, predicate=inspect.isfunction)
        if not name.startswith("_")
    }


def test_pg_repository_satisfies_protocol():
    """PgRepository 实例满足 RepositoryProtocol（runtime_checkable）。"""
    assert isinstance(PgRepository(), RepositoryProtocol)


def test_demo_repository_satisfies_protocol():
    """DemoRepository 实例满足 RepositoryProtocol（runtime_checkable）。"""
    assert isinstance(DemoRepository(), RepositoryProtocol)


def test_pg_and_demo_public_methods_match():
    """PgRepository / DemoRepository 公共方法面零漂移（双实现一致性机器守护）。"""
    pg = _public_method_names(PgRepository)
    demo = _public_method_names(DemoRepository)
    assert pg == demo, (
        f"pg/demo method drift: pg_only={sorted(pg - demo)} demo_only={sorted(demo - pg)}"
    )


def test_protocol_mirrors_pg_public_methods():
    """RepositoryProtocol 声明的方法面 == PgRepository 公共方法（契约不漂移）。"""
    protocol = _public_method_names(RepositoryProtocol)
    pg = _public_method_names(PgRepository)
    assert protocol == pg, (
        f"protocol/pg drift: protocol_only={sorted(protocol - pg)} pg_only={sorted(pg - protocol)}"
    )
