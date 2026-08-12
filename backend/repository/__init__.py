"""Persistence layer (PostgreSQL + pgvector).

Production runtime singleton ``repository`` is imported by API/service layers.
``DemoRepository`` (in-memory fake for unit tests) lives in ``demo_repository.py``.
"""

from backend.repository.pg_repository import PgRepository
from backend.repository.protocol import RepositoryProtocol

repository: RepositoryProtocol = PgRepository()
