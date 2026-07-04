import unittest

from backend.model.entities import Space, SpaceMember, SpaceRole
from backend.service.space import SpaceAccessError, list_user_spaces, switch_space


class SpaceServiceTest(unittest.TestCase):
    def test_list_user_spaces_only_returns_memberships(self) -> None:
        spaces = [
            Space(id=10, code="nova-internal", name="Nova Internal"),
            Space(id=20, code="brightlite-team", name="BrightLite Team"),
        ]
        memberships = [SpaceMember(user_id=1, space_id=20, role=SpaceRole.MEMBER)]

        result = list_user_spaces(user_id=1, spaces=spaces, memberships=memberships)

        self.assertEqual([space.code for space in result], ["brightlite-team"])

    def test_switch_space_rejects_non_member_space(self) -> None:
        memberships = [SpaceMember(user_id=1, space_id=20, role=SpaceRole.MEMBER)]

        with self.assertRaises(SpaceAccessError):
            switch_space(user_id=1, target_space_id=10, memberships=memberships)

    def test_switch_space_returns_target_space_for_member(self) -> None:
        memberships = [SpaceMember(user_id=1, space_id=20, role=SpaceRole.MEMBER)]

        self.assertEqual(switch_space(user_id=1, target_space_id=20, memberships=memberships), 20)


if __name__ == "__main__":
    unittest.main()
