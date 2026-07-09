"""LLM adapter: OpenAI-compatible chat with multi-provider support.

Reads provider config from environment variables. When the provider is not
``mock`` and an API key is set, :func:`chat` calls the configured
OpenAI-compatible endpoint (GLM/GPT transit, or local ollama). Otherwise the
caller (``rag.answer_question``) falls back to the degraded no-LLM answer, so
the project keeps working without any LLM configured.

Provider defaults — base_url/model are non-secret and live in code; the API key
MUST come from the environment (never hardcoded):

- ``glm``  : http://47.107.134.2:7777/v1  model ``glm-5.2``
- ``gpt``  : http://47.107.134.2:7777/v1  model ``gpt5.5``
- ``local``: http://localhost:11434/v1     model ``qwen2.5:3b``  (ollama)
- ``mock`` : no LLM call (degraded)

Security: ``LLM_BASE_URL`` / ``LLM_MODEL`` env vars override the defaults;
``LLM_API_KEY`` is read from env only. The transit endpoint is plain HTTP — keys
and content travel in cleartext, and the transit operator can see the data; use
fictional/demo data only and keep real team documents out unless explicitly
accepted (see ``ai/project-rules.md`` §2.5, ``docs/06-db-design.md`` §5).
"""

from __future__ import annotations

import os
from dataclasses import dataclass


_PROVIDER_DEFAULTS: dict[str, dict[str, str]] = {
    "glm": {"base_url": "http://47.107.134.2:7777/v1", "model": "glm-5.2"},
    "gpt": {"base_url": "http://47.107.134.2:7777/v1", "model": "gpt5.5"},
    "local": {"base_url": "http://localhost:11434/v1", "model": "qwen2.5:3b"},
}

MOCK_PROVIDER = "mock"


@dataclass(frozen=True)
class LlmConfig:
    """Resolved LLM configuration; ``enabled`` gates whether ``chat`` is called."""

    provider: str
    base_url: str
    api_key: str
    model: str

    @property
    def enabled(self) -> bool:
        return self.provider in _PROVIDER_DEFAULTS and bool(self.api_key)


def load_config() -> LlmConfig:
    """Build LLM config from env vars; unknown/missing provider falls back to mock."""
    provider = os.getenv("LLM_PROVIDER", MOCK_PROVIDER).strip().lower()
    if provider not in _PROVIDER_DEFAULTS:
        return LlmConfig(provider=MOCK_PROVIDER, base_url="", api_key="", model="")
    defaults = _PROVIDER_DEFAULTS[provider]
    return LlmConfig(
        provider=provider,
        base_url=os.getenv("LLM_BASE_URL", defaults["base_url"]).strip(),
        api_key=os.getenv("LLM_API_KEY", "").strip(),
        model=os.getenv("LLM_MODEL", defaults["model"]).strip(),
    )


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
