// 跨设备 vault 挂载元数据同步 hook（REQ-018 模式 B增强 / Wave 3，TC-P2-VAULT-004）。
//
// 职责（仅元数据，红线：句柄 / 路径 / 正文永不离开本机 IndexedDB）：
//   - 登录（token 变化）→ GET /api/vault-mounts 拉取全部设备的挂载清单（远程列表展示）
//   - 本机挂载成功 → POST granted（按自然键 upsert，重复挂载刷新）
//   - 本机卸载     → POST revoked（软撤销；无对应行时后端幂等）
//
// 失败策略（本地优先）：同步失败不阻塞 / 不打断本地挂载流程，console.warn 降级
// （跨设备列表为增强能力，本地挂载 / 搜索 / 编辑是主体功能）。
//
// 挂载点：LocalMountPane 自管理（不动 useAppState / useLocalVaultMount——两者分别在
// file-size ratchet 基线 339 / 阈值 250 上，无余量）。

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDeviceToken,
  listVaultMounts,
  reportVaultMount,
  type VaultMountSourceType,
  type VaultMountView,
} from '../../api/vaultMounts';

/** 推断挂载来源类型：目录名含 .obsidian 视为 obsidian vault，其余按 markdown 文件夹。 */
function inferSourceType(mountName: string): VaultMountSourceType {
  return mountName.toLowerCase().includes('obsidian') ? 'obsidian' : 'markdown_folder';
}

export function useVaultMountSync(token: string | undefined) {
  const [remoteMounts, setRemoteMounts] = useState<VaultMountView[]>([]);
  const deviceToken = useRef<string>('');
  if (!deviceToken.current) {
    deviceToken.current = getDeviceToken();
  }

  // 登录（token 变化）→ 拉取跨设备清单；登出（token=undefined）→ 清空。
  useEffect(() => {
    if (!token) {
      setRemoteMounts([]);
      return;
    }
    let cancelled = false;
    void listVaultMounts(token)
      .then((rows) => {
        if (!cancelled) setRemoteMounts(rows);
      })
      .catch((error: unknown) => {
        console.warn('[vault-mounts] 跨设备挂载清单拉取失败（不影响本地挂载）', error);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  /** 本机挂载成功 → 上报 granted（失败仅告警，不阻塞）。 */
  const reportGranted = useCallback(
    (mountName: string) => {
      if (!token) return;
      void reportVaultMount(token, {
        device_id: deviceToken.current,
        mount_name: mountName,
        source_type: inferSourceType(mountName),
      }).catch((error: unknown) => {
        console.warn('[vault-mounts] 挂载上报失败（不影响本地挂载）', error);
      });
    },
    [token],
  );

  /** 本机卸载 → 上报 revoked（失败仅告警，不阻塞卸载）。 */
  const reportRevoked = useCallback(
    (mountName: string) => {
      if (!token) return;
      void reportVaultMount(token, {
        device_id: deviceToken.current,
        mount_name: mountName,
        source_type: inferSourceType(mountName),
        auth_status: 'revoked',
      }).catch((error: unknown) => {
        console.warn('[vault-mounts] 卸载上报失败（不影响本地卸载）', error);
      });
    },
    [token],
  );

  return { remoteMounts, deviceToken: deviceToken.current, reportGranted, reportRevoked };
}
