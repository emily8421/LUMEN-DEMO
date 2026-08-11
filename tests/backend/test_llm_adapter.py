import os
import unittest
from unittest import mock

from backend.service.llm_adapter import load_config, list_configs


class LlmAdapterMultiConfigTest(unittest.TestCase):
    """2026-08-07 多配置切换：LLM_PROVIDERS 命名配置 + 旧单配置兼容 + deepseek provider。"""

    def test_named_configs_first_is_default(self) -> None:
        env = {
            "LLM_PROVIDERS": "glm_a,gpt",
            "LLM_GLM_A_PROVIDER": "glm",
            "LLM_GLM_A_BASE_URL": "http://a:7777/v1",
            "LLM_GLM_A_MODEL": "glm5.2",
            "LLM_GLM_A_API_KEY": "key-a",
            "LLM_GPT_PROVIDER": "gpt",
            "LLM_GPT_BASE_URL": "http://b:7777/v1",
            "LLM_GPT_MODEL": "gpt5.5",
            "LLM_GPT_API_KEY": "key-b",
        }
        with mock.patch.dict(os.environ, env, clear=True):
            print(f"DBG named: LLM_PROVIDERS={os.environ.get('LLM_PROVIDERS')!r} LLM_PROVIDER={os.environ.get('LLM_PROVIDER')!r} keys={sorted(k for k in os.environ if k.startswith('LLM'))}", flush=True)
            default = load_config()
            self.assertEqual(default.name, "glm_a")
            self.assertEqual(default.provider, "glm")
            self.assertEqual(default.base_url, "http://a:7777/v1")
            self.assertEqual(default.model, "glm5.2")
            self.assertTrue(default.enabled)

            gpt = load_config("gpt")
            self.assertEqual(gpt.name, "gpt")
            self.assertEqual(gpt.model, "gpt5.5")
            self.assertTrue(gpt.enabled)

            names = {item["name"] for item in list_configs()}
            self.assertEqual(names, {"glm_a", "gpt"})

    def test_legacy_single_config_becomes_default(self) -> None:
        env = {
            "LLM_PROVIDER": "glm",
            "LLM_BASE_URL": "http://old:7777/v1",
            "LLM_MODEL": "glm-5.2",
            "LLM_API_KEY": "key-old",
        }
        with mock.patch.dict(os.environ, env, clear=True):
            cfg = load_config()
            self.assertEqual(cfg.name, "default")
            self.assertEqual(cfg.base_url, "http://old:7777/v1")
            self.assertTrue(cfg.enabled)
            self.assertEqual(len(list_configs()), 1)

    def test_inline_comment_in_providers_is_stripped(self) -> None:
        env = {
            "LLM_PROVIDERS": "glm_a,gpt   # 逗号分隔配置名，第一个为默认",
            "LLM_GLM_A_PROVIDER": "glm",
            "LLM_GLM_A_API_KEY": "key-a",
            "LLM_GPT_PROVIDER": "gpt",
            "LLM_GPT_API_KEY": "key-b",
        }
        with mock.patch.dict(os.environ, env, clear=True):
            print(f"DBG inline: LLM_PROVIDERS={os.environ.get('LLM_PROVIDERS')!r} keys={sorted(k for k in os.environ if k.startswith('LLM'))}", flush=True)
            names = {item["name"] for item in list_configs()}
            self.assertEqual(names, {"glm_a", "gpt"})

    def test_deepseek_provider_is_enabled_and_meta_omits_api_key(self) -> None:
        env = {
            "LLM_PROVIDERS": "deepseek",
            "LLM_DEEPSEEK_PROVIDER": "deepseek",
            "LLM_DEEPSEEK_BASE_URL": "https://api.deepseek.com/v1",
            "LLM_DEEPSEEK_MODEL": "deepseek-v4-flash",
            "LLM_DEEPSEEK_API_KEY": "secret-key",
        }
        with mock.patch.dict(os.environ, env, clear=True):
            print(f"DBG deepseek: LLM_PROVIDERS={os.environ.get('LLM_PROVIDERS')!r} LLM_DEEPSEEK_PROVIDER={os.environ.get('LLM_DEEPSEEK_PROVIDER')!r} keys={sorted(k for k in os.environ if k.startswith('LLM'))}", flush=True)
            cfg = load_config()
            self.assertEqual(cfg.provider, "deepseek")
            self.assertTrue(cfg.enabled)

            meta = list_configs()[0]
            self.assertNotIn("api_key", meta)
            self.assertEqual(meta["name"], "deepseek")
            self.assertEqual(meta["model"], "deepseek-v4-flash")

    def test_missing_config_returns_mock_and_empty_list(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True):
            cfg = load_config("nope")
            self.assertEqual(cfg.provider, "mock")
            self.assertFalse(cfg.enabled)
            self.assertEqual(list_configs(), [])


if __name__ == "__main__":
    unittest.main()
