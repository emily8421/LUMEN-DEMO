import importlib.util
import unittest


@unittest.skipIf(importlib.util.find_spec("fastapi") is None, "FastAPI is not installed")
class ApiRouteTest(unittest.TestCase):
    def test_login_list_spaces_and_switch_space(self) -> None:
        from backend.api.auth import LoginRequest, login
        from backend.api.spaces import SwitchSpaceRequest, list_spaces, switch_space_endpoint

        login_response = login(LoginRequest(external_id="alice", current_space_id=10))
        token = login_response["data"]["token"]
        authorization = f"Bearer {token}"

        spaces_response = list_spaces(authorization=authorization)
        switch_response = switch_space_endpoint(
            SwitchSpaceRequest(space_id=20),
            authorization=authorization,
        )

        self.assertEqual(login_response["code"], 0)
        self.assertEqual([space["code"] for space in spaces_response["data"]], ["nova-internal", "brightlite-team"])
        self.assertEqual(switch_response["data"]["current_space_id"], 20)
        self.assertIn("token", switch_response["data"])


if __name__ == "__main__":
    unittest.main()
