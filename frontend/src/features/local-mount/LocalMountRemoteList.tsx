// 跨设备挂载清单（REQ-018 模式 B 增强 / Wave 3，TC-P2-VAULT-004「设备 B 可见」）。
//
// 只读提示列表：显示当前用户在其他设备（和本机）上报过的挂载元数据；
// granted = 该设备仍有此挂载，revoked = 已卸载（默认折叠不展示）。
// 注意：这不是自动恢复——句柄只活在各设备浏览器 IndexedDB，本机访问
// 仍须重新「挂载 vault」授权选目录（RG-009 天花板，不越界）。

import { useState } from 'react';
import type { VaultMountView } from '../../api/vaultMounts';

type LocalMountRemoteListProps = {
  remoteMounts: VaultMountView[];
  deviceToken: string;
};

export function LocalMountRemoteList({ remoteMounts, deviceToken }: LocalMountRemoteListProps) {
  const [collapsed, setCollapsed] = useState(true);
  // granted 行才有提示价值；revoked 已卸载默认不展示（服务端保留行仅为审计）
  const granted = remoteMounts.filter((m) => m.auth_status === 'granted');
  if (granted.length === 0) return null;

  const otherDevices = granted.filter((m) => m.device_id !== deviceToken);
  const summary =
    otherDevices.length > 0
      ? `${granted.length} 处挂载（${otherDevices.length} 处在其他设备）`
      : `${granted.length} 处挂载`;

  return (
    <div className="local-mount-remote">
      <button
        type="button"
        className="local-mount-remote-toggle"
        onClick={() => setCollapsed((c) => !c)}
      >
        跨设备挂载 · {summary}
        <small>{collapsed ? '展开' : '收起'}</small>
      </button>
      {!collapsed ? (
        <ul className="local-mount-remote-list">
          {granted.map((mount) => (
            <li key={mount.id}>
              <strong>{mount.mount_name}</strong>
              <small>
                {mount.device_id === deviceToken ? '本机' : '其他设备'} ·{' '}
                {mount.source_type === 'obsidian' ? 'Obsidian' : 'Markdown'} ·{' '}
                {mount.last_synced_at.slice(0, 10)}
              </small>
            </li>
          ))}
          <li className="local-mount-remote-hint">
            其他设备的挂载仅记录名称；在本机访问需重新挂载授权。
          </li>
        </ul>
      ) : null}
    </div>
  );
}
