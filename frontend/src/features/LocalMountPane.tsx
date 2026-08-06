// 左侧「本地挂载」分区（REQ-018 模式 B，CMP-P2-TREE / PG-P2-002 下层）
// 与上层 LUMEN DB 文件管理器视觉隔离；本地目录树 + 本地搜索（不上传）+ 按需导入到 LUMEN（走 API-029）。
// 点文件 → onOpenLocalDoc(doc) 通知主区预览（左栏不再显示预览，避免遮挡目录）。
// 自管理 useLocalVaultMount hook；token / onImported / onOpenLocalDoc 由 ContextPane 透传。

import { useState } from 'react';
import {
  buildLocalMountTree,
  useLocalVaultMount,
  type LocalMountTreeNode,
} from '../app/useLocalVaultMount';
import type { LocalVaultDoc } from '../app/local-vault-index';
import { importBatchDocuments } from '../api';
import type { DocumentPermission } from '../api';

// 本地挂载 → 导入为私有文档（个人知识，合理默认；用户可后续在文档详情改权限）。
const IMPORT_PERMISSION: DocumentPermission = 'private';

type LocalMountPaneProps = {
  token: string | undefined;
  onImported: () => void;
  onOpenLocalDoc: (doc: LocalVaultDoc | null) => void;
};

export function LocalMountPane({ token, onImported, onOpenLocalDoc }: LocalMountPaneProps) {
  const vm = useLocalVaultMount();
  const [collapsed, setCollapsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [pendingImport, setPendingImport] = useState<{ path: string; label: string; count: number } | null>(null);

  if (vm.status === 'unsupported') {
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

  const badgeClass = vm.status === 'mounted' ? 'ok' : vm.status === 'needs-auth' ? 'warn' : 'idle';
  const badgeText =
    vm.status === 'mounted'
      ? `${vm.fileCount} 文件`
      : vm.status === 'needs-auth'
        ? '需重授权'
        : vm.status === 'mounting'
          ? '索引中…'
          : '未挂载';

  const tree = vm.docs.length > 0 ? buildLocalMountTree(vm.docs) : null;
  const searching = vm.query.trim().length > 0;
  const canImport = vm.status === 'mounted' && !!token && !importing;

  function handleOpen(path: string) {
    vm.openDoc(path);
    onOpenLocalDoc(vm.docs.find((d) => d.path === path) ?? null);
  }

  async function importDocs(docsToImport: LocalVaultDoc[], label: string) {
    if (!token || importing) return;
    setImporting(true);
    setImportMsg(`正在导入${label}…`);
    try {
      const files = [];
      for (const doc of docsToImport) {
        files.push({ file: await doc.handle.getFile(), relativePath: doc.path });
      }
      const result = await importBatchDocuments(
        token,
        { files, permission: IMPORT_PERMISSION, preserveStructure: true },
        (done, total) => setImportMsg(`正在导入${label}… ${done}/${total}`)
      );
      setImportMsg(
        `导入完成（已入上层 DB，保留目录结构，可在文档视图查看）：成功 ${result.success_count} / 失败 ${result.failed_count} / 跳过 ${result.skipped_count}`
      );
      if (result.success_count > 0) onImported();
    } catch (e) {
      setImportMsg('导入失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setImporting(false);
      setPendingImport(null);
    }
  }

  const importSelected = () => {
    if (!vm.selectedPath) return;
    const doc = vm.docs.find((d) => d.path === vm.selectedPath);
    if (doc) void importDocs([doc], '此篇');
  };
  const subtreeDocs = (dirPath: string) =>
    vm.docs.filter((d) => d.path === dirPath || d.path.startsWith(dirPath + '/'));

  const requestImportDir = (dirPath: string, label: string) => {
    if (!canImport) return;
    const docsToImport = subtreeDocs(dirPath);
    if (docsToImport.length === 0) return;
    if (docsToImport.length === 1) {
      void importDocs(docsToImport, label);
    } else {
      setPendingImport({ path: dirPath, label, count: docsToImport.length });
    }
  };

  const requestImportAll = () => {
    if (!canImport || vm.docs.length === 0) return;
    setPendingImport({ path: '', label: '全部挂载', count: vm.docs.length });
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const { path, label } = pendingImport;
    const docsToImport = path === '' ? vm.docs : subtreeDocs(path);
    void importDocs(docsToImport, label);
  };

  return (
    <section className="local-mount-pane">
      <header className="local-mount-header">
        <button
          type="button"
          className="local-mount-collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? '展开本地挂载' : '收起本地挂载'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
        <h2>本地挂载</h2>
        <span className={`local-mount-badge ${badgeClass}`}>{badgeText}</span>
        <div className="local-mount-actions">
          {vm.status === 'mounted' ? (
            <>
              <button type="button" onClick={vm.reindex} title="重扫本地变更">
                重扫
              </button>
              <button type="button" onClick={vm.unmount} title="卸载本地挂载">
                卸载
              </button>
            </>
          ) : vm.status === 'needs-auth' ? (
            <button type="button" onClick={vm.reauth}>
              重新授权
            </button>
          ) : (
            <button type="button" onClick={vm.mount} disabled={vm.status === 'mounting'}>
              挂载 vault
            </button>
          )}
        </div>
      </header>

      {!collapsed && vm.status !== 'mounted' && vm.status !== 'mounting' && (
        <p className="empty-state local-mount-empty">
          选择本地 vault / Markdown 文件夹挂载（仅本地浏览与搜索，不上传服务端）。
        </p>
      )}

      {!collapsed && vm.status === 'mounted' && (
        <>
          {vm.error && <p className="local-mount-error">{vm.error}</p>}
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
                onImportDir={requestImportDir}
                importDisabled={!canImport}
              />
            ) : (
              <p className="empty-state">空 vault</p>
            )}
          </div>
          {pendingImport ? (
            <div className="local-mount-confirm-bar">
              <span>
                将导入「{pendingImport.label}」的 <strong>{pendingImport.count}</strong> 个文件到 LUMEN（保留目录结构）。
              </span>
              <span className="local-mount-confirm-actions">
                <button type="button" onClick={confirmImport} disabled={importing}>
                  确认导入
                </button>
                <button type="button" onClick={() => setPendingImport(null)} disabled={importing}>
                  取消
                </button>
              </span>
            </div>
          ) : (vm.selectedPath || vm.docs.length > 0) ? (
            <div className="local-mount-import-bar">
              <button
                type="button"
                className="local-mount-import"
                onClick={importSelected}
                disabled={!canImport || !vm.selectedPath}
                title="把选中的本地文件导入 LUMEN（走 API-029，获得搜索 / RAG / 团队能力）"
              >
                导入此篇
              </button>
              <button
                type="button"
                className="local-mount-import"
                onClick={requestImportAll}
                disabled={!canImport || vm.docs.length === 0}
                title="把整个本地挂载导入 LUMEN（保留目录结构；将先确认文件数）"
              >
                导入全部
              </button>
            </div>
          ) : null}
          {importMsg && <p className="local-mount-import-msg">{importMsg}</p>}
        </>
      )}
    </section>
  );
}

function LocalMountTreeView({
  node,
  depth,
  selectedPath,
  onSelect,
  onImportDir,
  importDisabled,
}: {
  node: LocalMountTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onImportDir: (path: string, label: string) => void;
  importDisabled: boolean;
}) {
  const [open, setOpen] = useState(true);
  const pad = 6 + Math.max(0, depth) * 14;
  const childDirs = [...node.children.values()];

  return (
    <div>
      {depth >= 0 && (
        <div
          className="local-mount-node local-mount-dir"
          style={{ paddingLeft: pad }}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="local-mount-arrow">{open ? '▾' : '▸'}</span>
          <span className="local-mount-ic" aria-hidden="true">📁</span>
          <span className="local-mount-label">{node.name}</span>
          <button
            type="button"
            className="local-mount-import-node"
            onClick={(e) => {
              e.stopPropagation();
              onImportDir(node.path, node.name);
            }}
            disabled={importDisabled}
            title="导入此文件夹（含子文件，保留目录结构）"
            aria-label={`导入文件夹 ${node.name}`}
          >
            ⤓ 导入
          </button>
        </div>
      )}
      {open && (
        <div className="local-mount-children">
          {childDirs.map((d) => (
            <LocalMountTreeView
              key={d.name}
              node={d}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onImportDir={onImportDir}
              importDisabled={importDisabled}
            />
          ))}
          {node.files.map((f) => (
            <div
              key={f.doc.path}
              className={`local-mount-node local-mount-file ${f.doc.path === selectedPath ? 'cur' : ''}`}
              style={{ paddingLeft: pad + 18 }}
              onClick={() => onSelect(f.doc.path)}
              title={f.doc.path}
            >
              <span className="local-mount-ic" aria-hidden="true">📄</span>
              <span className="local-mount-label">{f.name}</span>
              <span className="local-mount-tag">本地</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
