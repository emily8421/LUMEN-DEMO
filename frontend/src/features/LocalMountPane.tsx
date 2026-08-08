// 左侧「本地挂载」分区（REQ-018 模式 B，CMP-P2-TREE / PG-P2-002 下层）
// 与上层 LUMEN DB 文件管理器视觉隔离；本地目录树 + 本地搜索（不上传）+ 按需导入到 LUMEN（走 API-029）。
// 点文件 → onOpenLocalDoc(doc) 通知主区预览（左栏不再显示预览，避免遮挡目录）。
// 自管理 useLocalVaultMount hook；token / onImported / onOpenLocalDoc 由 ContextPane 透传。

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  buildLocalMountTree,
  type LocalMountTreeNode,
  type UseLocalVaultMount,
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
  /** REQ-049：本地挂载 vm（App 提升共享）。 */
  localVault: UseLocalVaultMount;
};

export function LocalMountPane({ token, onImported, onOpenLocalDoc, localVault }: LocalMountPaneProps) {
  const vm = localVault;
  const [collapsed, setCollapsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [pendingImport, setPendingImport] = useState<{ path: string; label: string; count: number } | null>(null);

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

  const hasMount = vm.mounts.length > 0;
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
  const canImport = hasMount && !!token && !importing;

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

  /** 导入单篇（path 缺省时用全局选中）。 */
  const importSelected = (path?: string) => {
    const targetPath = path ?? vm.selectedPath;
    if (!targetPath) return;
    const doc = vm.docs.find((d) => d.path === targetPath);
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
          {anyNeedsAuth ? (
            <button type="button" onClick={() => vm.mounts.forEach((m) => { if (m.status === 'needs-auth') void vm.reauth(m.id); })}>
              重新授权
            </button>
          ) : null}
          {hasMount ? (
            <button type="button" onClick={() => void vm.unmountAll()} title="卸载全部本地挂载">
              卸载全部
            </button>
          ) : null}
          <button type="button" onClick={vm.mount} disabled={anyMounting} title="添加本地挂载目录">
            挂载 vault
          </button>
        </div>
      </header>

      {!collapsed && !hasMount && !anyMounting && (
        <p className="empty-state local-mount-empty">
          选择本地 vault / Markdown 文件夹挂载（仅本地浏览与搜索，不上传服务端）。可同时挂载多个目录。
        </p>
      )}

      {!collapsed && hasMount && (
        <>
          {vm.error && <p className="local-mount-error">{vm.error}</p>}
          {vm.mounts.some((m) => m.status === 'needs-auth') ? (
            <div className="local-mount-mount-list">
              {vm.mounts.filter((m) => m.status === 'needs-auth').map((m) => (
                <div key={m.id} className="local-mount-mount-row">
                  <span>📁 {m.name}</span>
                  <button type="button" className="secondary" onClick={() => void vm.reauth(m.id)}>重新授权</button>
                  <button type="button" className="secondary" onClick={() => void vm.unmount(m.id)}>移除</button>
                </div>
              ))}
            </div>
          ) : null}
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
                onCreateFile={vm.createFile}
                onDeleteFile={vm.deleteFile}
                onRenameFile={vm.renameFile}
                onImportAll={requestImportAll}
                onImportFile={importSelected}
                isBusy={false}
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
                onClick={() => importSelected()}
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
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onImportAll,
  onImportFile,
  isBusy,
}: {
  node: LocalMountTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onImportDir: (path: string, label: string) => void;
  importDisabled: boolean;
  onCreateFile: (dirPath: string, name: string, content: string) => Promise<void>;
  onDeleteFile: (path: string) => Promise<void>;
  onRenameFile: (path: string, newName: string) => Promise<void>;
  onImportAll: () => void;
  onImportFile: (path: string) => void;
  isBusy: boolean;
}) {
  const [open, setOpen] = useState(true);
  // REQ-049：目录「新建文件」与文件「重命名」的 inline 输入态。
  const [creatingFileIn, setCreatingFileIn] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  // REQ-049 优化：文件右键菜单（重命名 / 删除入口）。
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // REQ-049 优化：目录右键菜单（新建文件 / 导入入口）。
  const [dirMenuPath, setDirMenuPath] = useState<string | null>(null);
  const [dirMenuPos, setDirMenuPos] = useState<{ x: number; y: number } | null>(null);
  const dirMenuRef = useRef<HTMLDivElement | null>(null);
  const pad = 6 + Math.max(0, depth) * 14;
  const childDirs = [...node.children.values()];

  // 右键菜单关闭：点击菜单外 / Esc（文件 + 目录菜单共用）。
  useEffect(() => {
    if (menuPath === null && dirMenuPath === null) {
      return undefined;
    }
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node) || dirMenuRef.current?.contains(event.target as Node)) {
        return;
      }
      setMenuPath(null);
      setDirMenuPath(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuPath(null);
        setDirMenuPath(null);
      }
    }
    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuPath, dirMenuPath]);

  function commitInline() {
    const name = inputValue.trim();
    if (!name) {
      setCreatingFileIn(null);
      setRenamingPath(null);
      setInputValue('');
      return;
    }
    if (creatingFileIn !== null) {
      void onCreateFile(creatingFileIn, name, '');
    } else if (renamingPath !== null) {
      void onRenameFile(renamingPath, name);
    }
    setCreatingFileIn(null);
    setRenamingPath(null);
    setInputValue('');
  }

  return (
    <div>
      {depth >= 0 && (
        <div
          className="local-mount-node local-mount-dir"
          style={{ paddingLeft: pad }}
          onClick={() => setOpen((o) => !o)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDirMenuPath(node.path);
            setDirMenuPos({ x: e.clientX, y: e.clientY });
          }}
          title={node.path ? `${node.path} · 右键新建文件 / 导入` : '右键新建文件 / 导入'}
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
          <button
            type="button"
            className="local-mount-node-action"
            onClick={(e) => {
              e.stopPropagation();
              setCreatingFileIn(node.path);
              setInputValue('');
            }}
            disabled={isBusy}
            title="在此新建文件"
            aria-label={`在此新建文件 ${node.name}`}
          >
            ＋
          </button>
          {dirMenuPath === node.path && dirMenuPos ? (
            <div
              ref={dirMenuRef}
              className="local-mount-menu"
              style={{ left: dirMenuPos.x, top: dirMenuPos.y } as CSSProperties}
              role="menu"
              aria-label={`${node.name} 操作`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDirMenuPath(null);
                  setCreatingFileIn(node.path);
                  setInputValue('');
                }}
              >
                <span aria-hidden="true">＋</span> 新建文件
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDirMenuPath(null);
                  onImportDir(node.path, node.name);
                }}
                disabled={importDisabled}
              >
                <span aria-hidden="true">⤓</span> 导入此文件夹
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDirMenuPath(null);
                  onImportAll();
                }}
                disabled={importDisabled}
              >
                <span aria-hidden="true">⤓</span> 导入全部挂载
              </button>
            </div>
          ) : null}
        </div>
      )}
      {creatingFileIn === node.path ? (
        <div className="local-mount-inline" style={{ paddingLeft: pad + 18 }}>
          <input
            value={inputValue}
            placeholder="文件名（含扩展名，如 note.md）"
            autoFocus
            disabled={isBusy}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitInline();
              if (e.key === 'Escape') { setCreatingFileIn(null); setInputValue(''); }
            }}
            onBlur={commitInline}
            aria-label="新建文件名"
          />
        </div>
      ) : null}
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
              onCreateFile={onCreateFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              onImportAll={onImportAll}
              onImportFile={onImportFile}
              isBusy={isBusy}
            />
          ))}
          {node.files.map((f) => (
            <div
              key={f.doc.path}
              className={`local-mount-node local-mount-file ${f.doc.path === selectedPath ? 'cur' : ''}`}
              style={{ paddingLeft: pad + 18 }}
              onClick={() => onSelect(f.doc.path)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuPath(f.doc.path);
                setMenuPos({ x: e.clientX, y: e.clientY });
              }}
              title={f.doc.path}
            >
              {renamingPath === f.doc.path ? (
                <span className="local-mount-inline-inline" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={inputValue}
                    autoFocus
                    disabled={isBusy}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitInline();
                      if (e.key === 'Escape') { setRenamingPath(null); setInputValue(''); }
                    }}
                    onBlur={commitInline}
                    aria-label="重命名文件名"
                  />
                </span>
              ) : (
                <>
                  <span className="local-mount-ic" aria-hidden="true">📄</span>
                  <span className="local-mount-label">{f.name}</span>
                  <span className="local-mount-tag">本地</span>
                  {menuPath === f.doc.path && menuPos ? (
                    <div
                      ref={menuRef}
                      className="local-mount-menu"
                      style={{ left: menuPos.x, top: menuPos.y } as CSSProperties}
                      role="menu"
                      aria-label={`${f.name} 操作`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuPath(null);
                          onImportFile(f.doc.path);
                        }}
                        disabled={importDisabled}
                      >
                        <span aria-hidden="true">⤓</span> 导入此篇
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuPath(null);
                          setRenamingPath(f.doc.path);
                          setInputValue(f.name);
                        }}
                      >
                        <span aria-hidden="true">✎</span> 重命名
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={() => {
                          setMenuPath(null);
                          if (window.confirm(`确认删除本地文件「${f.name}」？`)) {
                            void onDeleteFile(f.doc.path);
                          }
                        }}
                      >
                        <span aria-hidden="true">×</span> 删除
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
