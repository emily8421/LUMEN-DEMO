import unittest

from backend.service.auth import TokenError, create_demo_token, extract_bearer_token, parse_demo_token


class AuthServiceTest(unittest.TestCase):
    def test_create_and_parse_demo_token(self) -> None:
        token = create_demo_token(user_id=1, current_space_id=20, signing_key="local-test-key", ttl_seconds=60)

        payload = parse_demo_token(token, signing_key="local-test-key", now=0)

        self.assertEqual(payload.user_id, 1)
        self.assertEqual(payload.current_space_id, 20)
        self.assertGreater(payload.exp, 0)

    def test_parse_demo_token_rejects_tampering(self) -> None:
        token = create_demo_token(user_id=1, current_space_id=20, signing_key="local-test-key", ttl_seconds=60)
        tampered = token.replace(".", "x.", 1)

        with self.assertRaises(TokenError):
            parse_demo_token(tampered, signing_key="local-test-key", now=0)

    def test_extract_bearer_token(self) -> None:
        self.assertEqual(extract_bearer_token("Bearer abc"), "abc")

    def test_extract_bearer_token_rejects_invalid_header(self) -> None:
        with self.assertRaises(TokenError):
            extract_bearer_token("abc")


if __name__ == "__main__":
    unittest.main()
