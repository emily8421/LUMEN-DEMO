// REQ-018 模式 B 增强·跨设备 vault 挂载元数据（Wave 3 / API-059，TC-P2-VAULT-004）。
// 仅元数据同步：挂载成功上报 granted / 卸载上报 revoked / 登录拉取跨设备清单。
// 不涉及句柄 / 路径 / 正文上传（RG-009 隐私红线）。

import type { components } from './generated';
import { request } from './client';

/** VaultMountView —— 生成类型直接 alias（字段零差异，无 union 需 narrow）。 */
export type VaultMountView = components['schemas']['VaultMountView'];

/** 挂载来源类型。 */
export type VaultMountSourceType = 'obsidian' | 'markdown_folder';

/** 上报体（API-059 POST）：granted=挂载成功（缺省）/ revoked=卸载软撤销。 */
export type VaultMountReportPayload = {
  device_id: string;
  mount_name: string;
  source_type: VaultMountSourceType;
  auth_status?: 'granted' | 'revoked';
};

/** 拉取本人全部设备的挂载清单（API-059 GET）：含 revoked 行（调用方过滤展示）。 */
export async function listVaultMounts(token: string): Promise<VaultMountView[]> {
  return request<VaultMountView[]>('/api/vault-mounts', { token });
}

/** 上报挂载事件（API-059 POST）。revoked 无对应行时后端幂等返回 data=null。 */
export async function reportVaultMount(
  token: string,
  payload: VaultMountReportPayload,
): Promise<VaultMountView | null> {
  return request<VaultMountView | null>('/api/vault-mounts', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

/**
 * 本机设备标识（06 §2 device_id 两选项取「自生 device token」：浏览器 UA 在
 * 同配置设备间会重复，token 不会）。localStorage 持久 UUID，零依赖（crypto.randomUUID）。
 */
export function getDeviceToken(): string {
  const KEY = 'lumen-device-token';
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem(KEY, token);
  return token;
}
