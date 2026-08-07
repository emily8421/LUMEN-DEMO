import unittest

from backend.repository.demo_repository import DemoRepository
from backend.service.auth import (
    AuthenticationError,
    MAX_FAILED_LOGINS,
    TokenError,
    authenticate,
    create_demo_token,
    extract_bearer_token,
    hash_password,
    list_active_sessions,
    parse_demo_token,
    refresh_session,
    register,
    resolve_session,
    revoke_session,
    verify_password,
)


class AuthServiceTest(unittest.TestCase):
    # --- demo token（既有兼容）---

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

    # --- RG-011 bcrypt 密码哈希 ---

    def test_hash_and_verify_password(self) -> None:
        hashed = hash_password("correct horse battery staple")
        self.assertTrue(hashed.startswith("$2b$12$"))
        self.assertTrue(verify_password("correct horse battery staple", hashed))
        self.assertFalse(verify_password("wrong-password", hashed))

    def test_hash_password_rejects_too_long(self) -> None:
        with self.assertRaises(ValueError):
            hash_password("x" * 65)

    # --- 注册（REQ-040）---

    def test_register_creates_user_with_personal_space(self) -> None:
        repo = DemoRepository()
        user = register(repo, "new@example.com", "New User", "password123")
        self.assertEqual(user.email, "new@example.com")
        self.assertIsNotNone(user.password_hash)
        memberships = repo.list_memberships()
        personal = [m for m in memberships if m.user_id == user.id]
        self.assertEqual(len(personal), 1)
        self.assertEqual(personal[0].role.name, "ADMIN")

    def test_register_rejects_duplicate_email(self) -> None:
        repo = DemoRepository()
        register(repo, "new@example.com", "New User", "password123")
        with self.assertRaises(AuthenticationError) as ctx:
            register(repo, "new@example.com", "Other", "password123")
        self.assertEqual(ctx.exception.code, 4090)

    def test_register_rejects_short_password(self) -> None:
        repo = DemoRepository()
        with self.assertRaises(AuthenticationError) as ctx:
            register(repo, "a@example.com", "A", "short")
        self.assertEqual(ctx.exception.code, 4220)

    def test_register_normalizes_email(self) -> None:
        repo = DemoRepository()
        register(repo, "Mixed@Example.COM", "N", "password123")
        self.assertIsNotNone(repo.find_user_by_email("mixed@example.com"))

    # --- 登录（REQ-041）---

    def test_login_with_registered_password(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        token, session = authenticate(repo, "u@example.com", "password123")
        self.assertIsNotNone(token)
        user = repo.find_user_by_email("u@example.com")
        self.assertEqual(session.user_id, user.id)
        self.assertIsNotNone(repo.find_session_by_token_hash(session.token_hash))

    def test_login_demo_seed_no_password(self) -> None:
        repo = DemoRepository()
        token, session = authenticate(repo, "alice", "")
        self.assertIsNotNone(token)
        self.assertEqual(session.user_id, 1)

    def test_login_rejects_wrong_password(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        with self.assertRaises(AuthenticationError) as ctx:
            authenticate(repo, "u@example.com", "wrong-pass")
        self.assertEqual(ctx.exception.code, 4010)

    def test_login_failure_locks_after_threshold(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        for _ in range(MAX_FAILED_LOGINS):
            with self.assertRaises(AuthenticationError):
                authenticate(repo, "u@example.com", "wrong-pass")
        user = repo.find_user_by_email("u@example.com")
        self.assertGreaterEqual(user.failed_login_count, MAX_FAILED_LOGINS)
        self.assertNotEqual(user.locked_until, "")
        with self.assertRaises(AuthenticationError) as ctx:
            authenticate(repo, "u@example.com", "password123")
        self.assertEqual(ctx.exception.code, 4030)

    def test_login_success_resets_failures(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        for _ in range(3):
            with self.assertRaises(AuthenticationError):
                authenticate(repo, "u@example.com", "wrong-pass")
        token, _ = authenticate(repo, "u@example.com", "password123")
        self.assertIsNotNone(token)
        user = repo.find_user_by_email("u@example.com")
        self.assertEqual(user.failed_login_count, 0)
        self.assertEqual(user.locked_until, "")

    # --- 会话（REQ-042）---

    def test_resolve_session_roundtrip(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        token, session = authenticate(repo, "u@example.com", "password123")
        resolved = resolve_session(repo, token)
        self.assertEqual(resolved.id, session.id)

    def test_logout_revokes_session(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        token, session = authenticate(repo, "u@example.com", "password123")
        self.assertTrue(revoke_session(repo, session.id, session.user_id))
        self.assertIsNone(resolve_session(repo, token))

    def test_refresh_rotates_session(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        token, session = authenticate(repo, "u@example.com", "password123")
        new_token, new_session = refresh_session(repo, token)
        self.assertNotEqual(new_token, token)
        self.assertNotEqual(new_session.id, session.id)
        self.assertIsNone(resolve_session(repo, token))
        self.assertIsNotNone(resolve_session(repo, new_token))

    def test_multi_device_sessions_list_and_revoke(self) -> None:
        repo = DemoRepository()
        register(repo, "u@example.com", "U", "password123")
        _, s1 = authenticate(repo, "u@example.com", "password123", client_ua="ua-a")
        _, s2 = authenticate(repo, "u@example.com", "password123", client_ua="ua-b")
        active = list_active_sessions(repo, s1.user_id)
        self.assertEqual(len(active), 2)
        self.assertTrue(revoke_session(repo, s1.id, s1.user_id))
        active_after = list_active_sessions(repo, s1.user_id)
        self.assertEqual([s.id for s in active_after], [s2.id])

    def test_demo_repository_is_demo(self) -> None:
        self.assertTrue(DemoRepository().is_demo)


if __name__ == "__main__":
    unittest.main()
