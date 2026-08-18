"""FastAPI router for REQ-018 模式 B 增强·跨设备 vault 挂载元数据（Wave 3，API-059）。

GET /api/vault-mounts  —— 拉取本人全部设备的挂载清单（设备 B 登录可见设备 A 挂载）。
POST /api/vault-mounts —— 上报挂载事件（body auth_status：granted=挂载成功（缺省）/
                           revoked=卸载软撤销）。07 预留契约仅 GET/POST，撤销走 POST
                           上报 revoked，仿 sessions.revoked_at 软撤销先例。

仅登录本人（get_current_user）；无空间维度——纯个人元数据。仅元数据同步，
不涉及句柄 / 路径 / 正文上传（RG-009 隐私天花板，TC-P2-VAULT-004 口径）。

错误处理：VaultMountError（ApiError 子类）冒泡 main.py handler 统一转 envelope。
revoked 上报对应行不存在时：service 返回 None → 本层返回最近一次同键上报行不存在
的幂等成功（data=null），不因服务端无行打断本地卸载流程。
"""

from __future__ import annotations

from backend.model.schemas import ApiEnvelope, VaultMountView
from backend.repository import repository
from backend.service.auth_context import TokenContext, get_current_user
from backend.service.vault_mounts import list_vault_mounts, report_vault_mount

from fastapi import APIRouter, Depends
from pydantic import BaseModel


router = APIRouter(prefix="/api/vault-mounts", tags=["vault-mounts"])

class VaultMountReportRequest(BaseModel):
    """上报体：设备 A 挂载成功（auth_status 缺省 granted）或卸载（revoked）。"""

    device_id: str
    mount_name: str
    source_type: str
    auth_status: str = "granted"


def _mount_payload(mount) -> dict[str, object]:
    return {
        "id": mount.id,
        "device_id": mount.device_id,
        "mount_name": mount.mount_name,
        "source_type": mount.source_type,
        "auth_status": mount.auth_status,
        "last_synced_at": mount.last_synced_at,
        "created_at": mount.created_at,
        "updated_at": mount.updated_at,
    }

@router.get("", response_model=ApiEnvelope[list[VaultMountView]])
def list_vault_mounts_endpoint(
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    rows = list_vault_mounts(repository, ctx.user_id)
    return {"code": 0, "msg": "ok", "data": [_mount_payload(row) for row in rows]}

@router.post("", response_model=ApiEnvelope[VaultMountView | None])
def report_vault_mount_endpoint(
    request: VaultMountReportRequest,
    ctx: TokenContext = Depends(get_current_user),
) -> dict[str, object]:
    mount = report_vault_mount(
        repository,
        ctx.user_id,
        request.device_id,
        request.mount_name,
        request.source_type,
        request.auth_status,
    )
    return {"code": 0, "msg": "ok", "data": _mount_payload(mount) if mount else None}
