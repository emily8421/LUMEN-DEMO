"""CQ-P2-003 配置集中 + secret 校验单测。

env 注入经 ``monkeypatch.setenv`` 后构造 ``Settings()``（走 pydantic-settings
env 读取路径）；测试不依赖 ``get_settings()``（lru_cache 单例），避免跨用例
缓存污染。
"""

from __future__ import annotations

import pytest

from backend.config import Settings, _WEAK_DEFAULT_SIGNING_KEY, validate_runtime_secrets


class TestSettingsEnv:
    def test_reads_env(self, monkeypatch):
        monkeypatch.setenv("LUMEN_ENV", "production")
        monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@h:5432/db")
        monkeypatch.setenv("LUMEN_DEMO_TOKEN_KEY", "strong-key")
        s = Settings()
        assert s.lumen_env == "production"
        assert s.database_url == "postgresql://u:p@h:5432/db"
        assert s.demo_token_key == "strong-key"

    def test_defaults_when_missing(self, monkeypatch):
        monkeypatch.delenv("LUMEN_ENV", raising=False)
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.delenv("LUMEN_DEMO_TOKEN_KEY", raising=False)
        s = Settings()
        assert s.lumen_env == ""
        assert s.database_url == "postgresql://lumen:lumen@localhost:15432/lumen"
        assert s.demo_token_key == _WEAK_DEFAULT_SIGNING_KEY


class TestValidateRuntimeSecrets:
    def test_production_weak_default_rejected(self, monkeypatch):
        monkeypatch.setenv("LUMEN_ENV", "production")
        monkeypatch.delenv("LUMEN_DEMO_TOKEN_KEY", raising=False)  # 弱默认
        with pytest.raises(RuntimeError, match="LUMEN_DEMO_TOKEN_KEY"):
            validate_runtime_secrets(Settings())

    def test_production_empty_rejected(self, monkeypatch):
        monkeypatch.setenv("LUMEN_ENV", "production")
        monkeypatch.setenv("LUMEN_DEMO_TOKEN_KEY", "")
        with pytest.raises(RuntimeError, match="LUMEN_DEMO_TOKEN_KEY"):
            validate_runtime_secrets(Settings())

    def test_production_strong_key_ok(self, monkeypatch):
        monkeypatch.setenv("LUMEN_ENV", "production")
        monkeypatch.setenv("LUMEN_DEMO_TOKEN_KEY", "strong-key")
        validate_runtime_secrets(Settings())  # 不抛

    @pytest.mark.parametrize("env", ["test", "development", ""])
    def test_non_production_exempt(self, monkeypatch, env):
        monkeypatch.setenv("LUMEN_ENV", env)
        monkeypatch.delenv("LUMEN_DEMO_TOKEN_KEY", raising=False)  # 弱默认也豁免
        validate_runtime_secrets(Settings())  # 不抛
