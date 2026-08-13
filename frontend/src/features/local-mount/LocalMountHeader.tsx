import type { UseLocalVaultMount } from '../../app/useLocalVaultMount';

/**
 * 本地挂载分区的 header + 空态 + needs-auth 挂载列表（Slice E 从 LocalMountPane 抽出）。
 * 折叠按钮 / 标题 / 状态徽章 / 重新授权·卸载全部·挂载 vault 三按钮。
 */
interface LocalMountHeaderProps {
  collapsed: boolean;
  badgeClass: string;
  badgeText: string;
  hasMount: boolean;
  anyNeedsAuth: boolean;
  anyMounting: boolean;
  /** 需重新授权的挂载（已过滤）。 */
  needsAuthMounts: UseLocalVaultMount['mounts'];
  onToggleCollapse: () => void;
  onReauthAll: () => void;
  onUnmountAll: () => void;
  onMount: () => void;
  onReauth: (id: string) => void;
  onUnmount: (id: string) => void;
}

export function LocalMountHeader({
  collapsed,
  badgeClass,
  badgeText,
  hasMount,
  anyNeedsAuth,
  anyMounting,
  needsAuthMounts,
  onToggleCollapse,
  onReauthAll,
  onUnmountAll,
  onMount,
  onReauth,
  onUnmount,
}: LocalMountHeaderProps) {
  return (
    <>
      <header className="local-mount-header">
        <button
          type="button"
          className="local-mount-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? '展开本地挂载' : '收起本地挂载'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
        <h2>本地挂载</h2>
        <span className={`local-mount-badge ${badgeClass}`}>{badgeText}</span>
        <div className="local-mount-actions">
          {anyNeedsAuth ? (
            <button type="button" onClick={onReauthAll}>重新授权</button>
          ) : null}
          {hasMount ? (
            <button type="button" onClick={onUnmountAll} title="卸载全部本地挂载">卸载全部</button>
          ) : null}
          <button type="button" onClick={onMount} disabled={anyMounting} title="添加本地挂载目录">挂载 vault</button>
        </div>
      </header>

      {!collapsed && !hasMount && !anyMounting ? (
        <p className="empty-state local-mount-empty">
          选择本地 vault / Markdown 文件夹挂载（仅本地浏览与搜索，不上传服务端）。可同时挂载多个目录。
        </p>
      ) : null}

      {!collapsed && hasMount && anyNeedsAuth ? (
        <div className="local-mount-mount-list">
          {needsAuthMounts.map((m) => (
            <div key={m.id} className="local-mount-mount-row">
              <span>📁 {m.name}</span>
              <button type="button" className="secondary" onClick={() => onReauth(m.id)}>重新授权</button>
              <button type="button" className="secondary" onClick={() => onUnmount(m.id)}>移除</button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
