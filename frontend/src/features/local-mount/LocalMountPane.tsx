// 左侧「本地挂载」分区（REQ-018 模式 B，CMP-P2-TREE / PG-P2-002 下层）
// 与上层 LUMEN DB 文件管理器视觉隔离；本地目录树 + 本地搜索（不上传）+ 按需导入到 LUMEN（走 API-029）。
// 点文件 → onOpenLocalDoc(doc) 通知主区预览（左栏不再显示预览，避免遮挡目录）。
// 自管理 useLocalVaultMount hook；token / onImported / onOpenLocalDoc 由 ContextPane 透传。

import { useState } from 'react';
import {
  buildLocalMountTree,
  type UseLocalVaultMount,
} from '../../app/useLocalVaultMount';
import type { LocalVaultDoc } from '../../app/local-vault-index';
import { useLocalMountImport } from './useLocalMountImport';
import { LocalMountHeader } from './LocalMountHeader';
import { LocalMountImportBar } from './LocalMountImportBar';
import { LocalMountTreeView } from './LocalMountTreeView';

type LocalMountPaneProps = {
  token: string | undefined;
  onImported: () => void;
  onOpenLocalDoc: (doc: LocalVaultDoc | null) => void;
  /** REQ-049：本地挂载 vm（App 提升共享）。 */
  localVault: UseLocalVaultMount;
};

export function LocalMountPane({ token, onImported, onOpenLocalDoc, localVault }: LocalMountPaneProps) {
  const vm = localVault;
  const [collapsed, setCollapsed] = useState(false);
  const hasMount = vm.mounts.length > 0;
  const importApi = useLocalMountImport(token, vm.docs, vm.selectedPath, hasMount, onImported);

  if (!vm.supported) {
    return (
      <section className="local-mount-pane">
        <header className="local-mount-header">
          <h2>本地挂载</h2>
          <span className="local-mount-badge warn">不支持</span>
        </header>
        <p className="empty-state">需 Chrome / Edge 经 http://localhost 访问。</p>
      </section>
    );
  }

  const anyNeedsAuth = vm.mounts.some((m) => m.status === 'needs-auth');
  const anyMounting = vm.mounts.some((m) => m.status === 'mounting');
  const badgeClass = hasMount ? (anyNeedsAuth ? 'warn' : 'ok') : 'idle';
  const badgeText = hasMount
    ? `${vm.fileCount} 文件 · ${vm.mounts.length} 挂载`
    : anyMounting
      ? '索引中…'
      : '未挂载';
  const tree = vm.docs.length > 0 ? buildLocalMountTree(vm.docs) : null;
  const searching = vm.query.trim().length > 0;
  const needsAuthMounts = vm.mounts.filter((m) => m.status === 'needs-auth');

  function handleOpen(path: string) {
    vm.openDoc(path);
    onOpenLocalDoc(vm.docs.find((d) => d.path === path) ?? null);
  }

  return (
    <section className="local-mount-pane">
      <LocalMountHeader
        collapsed={collapsed}
        badgeClass={badgeClass}
        badgeText={badgeText}
        hasMount={hasMount}
        anyNeedsAuth={anyNeedsAuth}
        anyMounting={anyMounting}
        needsAuthMounts={needsAuthMounts}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onReauthAll={() => vm.mounts.forEach((m) => { if (m.status === 'needs-auth') void vm.reauth(m.id); })}
        onUnmountAll={() => void vm.unmountAll()}
        onMount={vm.mount}
        onReauth={(id) => void vm.reauth(id)}
        onUnmount={(id) => void vm.unmount(id)}
      />

      {!collapsed && hasMount ? (
        <>
          {vm.error ? <p className="local-mount-error">{vm.error}</p> : null}
          <input
            className="local-mount-search"
            placeholder="本地关键词搜索（文件名 / 标题 / 正文）"
            value={vm.query}
            onChange={(e) => vm.setQuery(e.target.value)}
          />
          <div className="local-mount-tree">
            {searching && vm.hits.length === 0 ? (
              <p className="empty-state">无命中</p>
            ) : searching ? (
              <ul className="local-mount-results">
                {vm.hits.map((h) => (
                  <li key={h.doc.path}>
                    <button
                      type="button"
                      className={h.doc.path === vm.selectedPath ? 'active' : ''}
                      onClick={() => handleOpen(h.doc.path)}
                    >
                      <strong>{h.doc.title || h.doc.name}</strong>
                      <small>{h.doc.path}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : tree ? (
              <LocalMountTreeView
                node={tree}
                depth={-1}
                selectedPath={vm.selectedPath}
                onSelect={handleOpen}
                onImportDir={importApi.requestImportDir}
                importDisabled={!importApi.canImport}
                onCreateFile={vm.createFile}
                onDeleteFile={vm.deleteFile}
                onRenameFile={vm.renameFile}
                onImportAll={importApi.requestImportAll}
                onImportFile={importApi.importSelected}
                isBusy={false}
              />
            ) : (
              <p className="empty-state">空 vault</p>
            )}
          </div>
          <LocalMountImportBar
            pendingImport={importApi.pendingImport}
            canImport={importApi.canImport}
            importing={importApi.importing}
            hasSelection={!!vm.selectedPath}
            hasDocs={vm.docs.length > 0}
            onConfirm={importApi.confirmImport}
            onCancel={importApi.cancelImport}
            onImportSelected={() => importApi.importSelected()}
            onImportAll={importApi.requestImportAll}
          />
          {importApi.importMsg ? <p className="local-mount-import-msg">{importApi.importMsg}</p> : null}
        </>
      ) : null}
    </section>
  );
}
