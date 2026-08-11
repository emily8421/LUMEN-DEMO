"""LLM adapter: OpenAI-compatible chat with multi-provider support.

Reads provider config from environment variables. When the selected provider is not
``mock`` and an API key is set, :func:`chat` calls the configured OpenAI-compatible
endpoint (GLM/GPT transit, DeepSeek, or local ollama). Otherwise the caller
(``rag.answer_question``) falls back to the degraded no-LLM answer, so the project
keeps working without any LLM configured.

Multiple named configurations (2026-08-07, AI 抽屉「基于知识库」多通道切换):
- ``LLM_PROVIDERS=name1,name2``  lists named configs (first is default).
- Each config uses ``LLM_<NAME>_PROVIDER / _BASE_URL / _MODEL / _API_KEY``.
- Legacy single config (``LLM_PROVIDER / LLM_BASE_URL / LLM_MODEL / LLM_API_KEY``)
  is kept as the ``default`` config and merges into the list.
- :func:`list_configs` returns meta (no api_key) for the frontend switcher.

Provider defaults — base_url/model are non-secret and live in code; the API key
MUST come from the environment (never hardcoded):

- ``glm``     : http://47.107.134.2:7777/v1  model ``glm-5.2``
- ``gpt``     : http://47.107.134.2:7777/v1  model ``gpt5.5``
- ``deepseek``: https://api.deepseek.com/v1   model ``deepseek-v4-flash``
- ``local``   : http://localhost:11434/v1     model ``qwen2.5:3b``  (ollama)
- ``mock``    : no LLM call (degraded)

Security: ``LLM_BASE_URL`` / ``LLM_MODEL`` env vars override the defaults;
``LLM_API_KEY`` is read from env only. The transit endpoint is plain HTTP — keys
and content travel in cleartext, and the transit operator can see the data; use
fictional/demo data only and keep real team documents out unless explicitly
accepted (see ``ai/project-rules.md`` §2.5, ``docs/06-db-design.md`` §5).
"""

from __future__ import annotations

import os
from dataclasses import dataclass

MOCK_PROVIDER = "mock"
_DEFAULT_NAME = "default"

_PROVIDER_DEFAULTS: dict[str, dict[str, str]] = {
    "glm": {"base_url": "http://47.107.134.2:7777/v1", "model": "glm-5.2"},
    "gpt": {"base_url": "http://47.107.134.2:7777/v1", "model": "gpt5.5"},
    "deepseek": {"base_url": "https://api.deepseek.com/v1", "model": "deepseek-v4-flash"},
    "local": {"base_url": "http://localhost:11434/v1", "model": "qwen2.5:3b"},
}


def _strip_inline_comment(value: str) -> str:
    """去掉行内 ``#`` 注释（如 ``LLM_PROVIDERS=glm_a,gpt  # 注释``）。"""
    return value.split("#", 1)[0].strip()


def _empty_config() -> "LlmConfig":
    return LlmConfig(provider=MOCK_PROVIDER, base_url="", api_key="", model="", name=_DEFAULT_NAME)


@dataclass(frozen=True)
class LlmConfig:
    """Resolved LLM configuration; ``enabled`` gates whether ``chat`` is called."""

    provider: str
    base_url: str
    api_key: str
    model: str
    name: str = ""

    @property
    def enabled(self) -> bool:
        return self.provider in _PROVIDER_DEFAULTS and bool(self.api_key)


def _build_config(name: str, provider: str) -> LlmConfig:
    """按命名配置名读取 ``LLM_<NAME>_*``（``default`` 用无前缀 ``LLM_*`` 兼容旧配置）。"""
    prefix = "LLM_" if name == _DEFAULT_NAME else f"LLM_{name.upper()}_"
    defaults = _PROVIDER_DEFAULTS.get(provider, {})
    base_url = os.getenv(f"{prefix}BASE_URL", "").strip() or defaults.get("base_url", "")
    model = os.getenv(f"{prefix}MODEL", "").strip() or defaults.get("model", "")
    api_key = os.getenv(f"{prefix}API_KEY", "").strip()
    return LlmConfig(provider=provider, base_url=base_url, api_key=api_key, model=model, name=name)


def _read_env_configs() -> dict[str, LlmConfig]:
    """读取全部命名配置 + 兼容旧单配置（``default``）。返回 name → LlmConfig。"""
    result: dict[str, LlmConfig] = {}
    legacy_provider = os.getenv("LLM_PROVIDER", "").strip().lower()
    if legacy_provider and legacy_provider != MOCK_PROVIDER:
        result[_DEFAULT_NAME] = _build_config(_DEFAULT_NAME, legacy_provider)
    providers_value = _strip_inline_comment(os.getenv("LLM_PROVIDERS", "")).strip()
    for name in (item.strip() for item in providers_value.split(",") if item.strip()):
        provider = os.getenv(f"LLM_{name.upper()}_PROVIDER", "").strip().lower()
        if not provider or provider == MOCK_PROVIDER:
            continue
        result[name] = _build_config(name, provider)
    return result


def load_config(name: str | None = None) -> LlmConfig:
    """Build LLM config from env vars; unknown/missing provider falls back to mock.

    ``name`` selects a named config from ``LLM_PROVIDERS`` (or ``default`` legacy);
    ``None`` picks the first named config, else the legacy ``default``.
    """
    configs = _read_env_configs()
    if name:
        return configs.get(name, _empty_config())
    if not configs:
        return _empty_config()
    # 默认 = LLM_PROVIDERS 第一个命名配置；否则 legacy default。
    providers_value = _strip_inline_comment(os.getenv("LLM_PROVIDERS", "")).strip()
    first_name = next((item.strip() for item in providers_value.split(",") if item.strip()), None)
    if first_name and first_name in configs:
        return configs[first_name]
    return configs.get(_DEFAULT_NAME, next(iter(configs.values())))


def list_configs() -> list[dict[str, object]]:
    """返回可用配置的脱敏元信息（不含 api_key），供前端切换下拉使用。"""
    return [
        {
            "name": config.name,
            "provider": config.provider,
            "model": config.model,
            "base_url": config.base_url,
            "enabled": config.enabled,
        }
        for config in _read_env_configs().values()
    ]


def chat(system_prompt: str, user_prompt: str, config: LlmConfig | None = None) -> str:
    """Call the configured OpenAI-compatible LLM and return the answer text.

    Raises on any failure (missing config, network, API error); the caller is
    responsible for falling back to the degraded answer. ``openai`` is imported
    lazily so the degraded path works even if the package is not installed.
    """
    cfg = config or load_config()
    if not cfg.enabled:
        raise RuntimeError("LLM not configured (provider=mock or missing LLM_API_KEY)")

    from openai import OpenAI  # lazy import; optional for the degraded path

    client = OpenAI(base_url=cfg.base_url, api_key=cfg.api_key)
    response = client.chat.completions.create(
        model=cfg.model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )
    return (response.choices[0].message.content or "").strip()
