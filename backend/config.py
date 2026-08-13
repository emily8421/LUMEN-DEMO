"""集中配置（CQ-P2-003 配置集中 + secret 校验）。

静态 env 读取收敛到本模块（pydantic-settings），提供类型化字段与单例
``get_settings()``。显式豁免（不收敛，理由见 docs/05 §4.2.4）：
- ``llm_adapter.py`` 的 ``LLM_<NAME>_*`` 动态命名配置：key 运行时拼接，
  不适合静态 Settings；模块内读取逻辑已自洽。
- ``embedding.py`` 的 ``HF_HUB_DISABLE_XET`` setdefault：huggingface_hub
  导入前的环境约束注入，非「配置读取」。
"""

from __future__ import annotations

import logging
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

_WEAK_DEFAULT_SIGNING_KEY = "local-demo-signing-key"
_DEFAULT_DATABASE_URL = "postgresql://lumen:lumen@localhost:15432/lumen"


class Settings(BaseSettings):
    """后端集中配置（env 读取，字段 ↔ 环境变量见各 alias）。"""

    model_config = SettingsConfigDict(extra="ignore")

    # 运行环境（test / development / production / 空 = demo 或本地默认）
    lumen_env: str = Field(default="", validation_alias="LUMEN_ENV")

    # PostgreSQL 连接串（默认 docker/compose.yml 起的 lumen-pg 容器）
    database_url: str = Field(default=_DEFAULT_DATABASE_URL, validation_alias="DATABASE_URL")

    # 会话签名 key（REQ-040 账号体系 / task-038）；生产必须显式设置强 key
    demo_token_key: str = Field(default=_WEAK_DEFAULT_SIGNING_KEY, validation_alias="LUMEN_DEMO_TOKEN_KEY")


@lru_cache
def get_settings() -> Settings:
    """模块级单例；env 在首次调用时读取，之后缓存。"""
    return Settings()


def validate_runtime_secrets(settings: Settings) -> None:
    """生产环境 fail-closed：拒绝弱默认 signing key（CQ-P2-003）。

    豁免（受控替代，理由见 docs/05 §4.2.4 / implementation-lifecycle §6.2）：
    ``LUMEN_ENV`` 非 production——test 需稳定 key 构造 token；本地开发 / demo 为
    受控环境，非对外暴露面。仅 ``LUMEN_ENV=production`` 强制要求强 key，补
    ``main.py`` 既有生产护栏（只挡 demo 仓储、不挡弱 key）的安全缺口。
    """
    if settings.lumen_env.lower() == "production" and settings.demo_token_key in (
        "",
        _WEAK_DEFAULT_SIGNING_KEY,
    ):
        raise RuntimeError(
            "[AUTH] LUMEN_ENV=production requires a strong LUMEN_DEMO_TOKEN_KEY "
            "(weak default rejected; see docs/05 §4.2.4 CQ-P2-003)"
        )
