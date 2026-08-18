"""REQ-018 模式 B 增强·跨设备 vault 挂载元数据（Wave 3 / TC-P2-VAULT-004，OI-109）。

仅元数据同步：挂载成功上报 granted / 卸载上报 revoked / 登录拉取跨设备挂载清单。
隐私天花板（RG-009 / 06 §2）：服务端只存 用户/设备/挂载名/来源类型/授权状态，
不存 directory handle、绝对路径、文件正文；挂载内容不进服务端 RAG。

权限口径（07 §3 API-059）：仅登录本人（owner 过滤），无空间维度——纯个人元数据，
不属于任何团队空间。上报按自然键 (user_id, device_id, mount_name) upsert：
revoked 上报不新建行（本地未见服务端行的边缘场景静默幂等，不打断本地卸载）。
"""

from __future__ import annotations

import logging

from backend.model.entities import VaultMount
from backend.model.error_codes import ApiError, ErrorCode
from backend.repository.protocol import RepositoryProtocol

logger = logging.getLogger(__name__)


class VaultMountError(ApiError):
    """vault 挂载元数据域统一异常（4220 参数非法）。"""

    def __init__(self, code: int, message: str, status_code: int | None = None) -> None:
        super().__init__(code, message, status_code)


VALID_SOURCE_TYPES = ("obsidian", "markdown_folder")
VALID_AUTH_STATUS = ("granted", "revoked")
MAX_MOUNT_NAME_LENGTH = 255
MAX_DEVICE_ID_LENGTH = 128


def report_vault_mount(
    repository: RepositoryProtocol,
    user_id: int,
    device_id: str,
    mount_name: str,
    source_type: str,
    auth_status: str = "granted",
) -> VaultMount | None:
    """上报挂载事件（API-059 POST）。

    - granted：挂载成功，按自然键 upsert（重复挂载刷新 last_synced_at），返回行。
    - revoked：卸载，软撤销既有行（行保留可审计，仿 sessions.revoked 先例）；
      对应行不存在时返回 None（幂等，api 层静默——不因服务端无行打断本地卸载）。

    校验失败 4220：device_id / mount_name 空、source_type / auth_status 非法、长度超限。
    """
    device = (device_id or "").strip()
    name = (mount_name or "").strip()
    if not device:
        raise VaultMountError(ErrorCode.VALIDATION_FAILED, "device_id is required")
    if len(device) > MAX_DEVICE_ID_LENGTH:
        raise VaultMountError(ErrorCode.VALIDATION_FAILED, "device_id too long")
    if not name:
        raise VaultMountError(ErrorCode.VALIDATION_FAILED, "mount_name is required")
    if len(name) > MAX_MOUNT_NAME_LENGTH:
        raise VaultMountError(ErrorCode.VALIDATION_FAILED, "mount_name too long")
    if source_type not in VALID_SOURCE_TYPES:
        raise VaultMountError(ErrorCode.VALIDATION_FAILED, "invalid source_type")
    if auth_status not in VALID_AUTH_STATUS:
        raise VaultMountError(ErrorCode.VALIDATION_FAILED, "invalid auth_status")

    if auth_status == "granted":
        return repository.upsert_vault_mount(
            user_id=user_id,
            device_id=device,
            mount_name=name,
            source_type=source_type,
            auth_status="granted",
        )

    # revoked：定位本人同自然键行软撤销；无行（未上报过 granted / 已在其他端清）→ None
    existing = [
        m
        for m in repository.list_vault_mounts(user_id)
        if m.device_id == device and m.mount_name == name
    ]
    if not existing:
        logger.warning(
            "vault mount revoke reported for unknown mount (user %s); ignored",
            user_id,
        )
        return None
    return repository.upsert_vault_mount(
        user_id=user_id,
        device_id=device,
        mount_name=name,
        source_type=source_type,
        auth_status="revoked",
    )


def list_vault_mounts(repository: RepositoryProtocol, user_id: int) -> list[VaultMount]:
    """拉取本人全部设备的挂载清单（API-059 GET）：含 revoked 行（软撤销保留审计，
    前端按 auth_status 过滤展示）。按 updated_at 倒序。"""
    return repository.list_vault_mounts(user_id)
