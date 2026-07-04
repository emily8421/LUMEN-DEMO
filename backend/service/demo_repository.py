"""In-memory demo repository used until PostgreSQL integration is wired."""

from __future__ import annotations

from backend.model.entities import Space, SpaceMember, SpaceRole, User


class DemoRepository:
    def __init__(self) -> None:
        self.users = [
            User(id=1, external_id="alice", name="Alice"),
            User(id=2, external_id="kira", name="Kira"),
            User(id=3, external_id="brightlite-member", name="BrightLite Member"),
        ]
        self.spaces = [
            Space(id=10, code="nova-internal", name="Nova Internal"),
            Space(id=20, code="brightlite-team", name="BrightLite Team"),
        ]
        self.memberships = [
            SpaceMember(user_id=1, space_id=10, role=SpaceRole.ADMIN),
            SpaceMember(user_id=1, space_id=20, role=SpaceRole.ADMIN),
            SpaceMember(user_id=2, space_id=10, role=SpaceRole.MEMBER),
            SpaceMember(user_id=3, space_id=20, role=SpaceRole.MEMBER),
        ]

    def find_user_by_external_id(self, external_id: str) -> User | None:
        return next((user for user in self.users if user.external_id == external_id), None)

    def list_memberships(self) -> list[SpaceMember]:
        return list(self.memberships)

    def list_spaces(self) -> list[Space]:
        return list(self.spaces)

    def first_space_id_for_user(self, user_id: int) -> int | None:
        membership = next(
            (membership for membership in self.memberships if membership.user_id == user_id),
            None,
        )
        return None if membership is None else membership.space_id


repository = DemoRepository()
