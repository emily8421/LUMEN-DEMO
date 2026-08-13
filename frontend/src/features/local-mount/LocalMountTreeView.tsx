import { useEffect, useRef, useState } from 'react';
import type { LocalMountTreeNode } from '../../app/useLocalVaultMount';
import { DirContextMenu, FileContextMenu } from './LocalMountContextMenus';
import { useInlineEdit } from './useInlineEdit';
import { LocalMountInlineInput } from './LocalMountInlineInput';

/**
 * 本地挂载递归目录树（Slice E 从 LocalMountPane 抽出）。
 * 持有展开 / 两类右键菜单的全部交互态；内联编辑态由 useInlineEdit 管，输入框展示用 LocalMountInlineInput，菜单展示用 LocalMountContextMenus。
 * 自递归渲染子目录；文件节点叶子。关菜单 effect 监听 pointerdown / Escape（文件 + 目录菜单共用）。
 */
export function LocalMountTreeView({
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
  // REQ-049 优化：文件右键菜单（重命名 / 删除入口）。
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // REQ-049 优化：目录右键菜单（新建文件 / 导入入口）。
  const [dirMenuPath, setDirMenuPath] = useState<string | null>(null);
  const [dirMenuPos, setDirMenuPos] = useState<{ x: number; y: number } | null>(null);
  const dirMenuRef = useRef<HTMLDivElement>(null);
  // REQ-049：目录「新建文件」与文件「重命名」的内联编辑态。
  const { creatingFileIn, setCreatingFileIn, renamingPath, setRenamingPath, inputValue, setInputValue, commitInline } = useInlineEdit(onCreateFile, onRenameFile);
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
            <DirContextMenu
              menuRef={dirMenuRef}
              name={node.name}
              pos={dirMenuPos}
              importDisabled={importDisabled}
              onNewFile={() => {
                setDirMenuPath(null);
                setCreatingFileIn(node.path);
                setInputValue('');
              }}
              onImportDir={() => {
                setDirMenuPath(null);
                onImportDir(node.path, node.name);
              }}
              onImportAll={() => {
                setDirMenuPath(null);
                onImportAll();
              }}
            />
          ) : null}
        </div>
      )}
      {creatingFileIn === node.path ? (
        <div className="local-mount-inline" style={{ paddingLeft: pad + 18 }}>
          <LocalMountInlineInput
            value={inputValue}
            placeholder="文件名（含扩展名，如 note.md）"
            ariaLabel="新建文件名"
            isBusy={isBusy}
            onChange={setInputValue}
            onSubmit={commitInline}
            onCancel={() => { setCreatingFileIn(null); setInputValue(''); }}
            onBlur={commitInline}
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
                  <LocalMountInlineInput
                    value={inputValue}
                    ariaLabel="重命名文件名"
                    isBusy={isBusy}
                    onChange={setInputValue}
                    onSubmit={commitInline}
                    onCancel={() => { setRenamingPath(null); setInputValue(''); }}
                    onBlur={commitInline}
                  />
                </span>
              ) : (
                <>
                  <span className="local-mount-ic" aria-hidden="true">📄</span>
                  <span className="local-mount-label">{f.name}</span>
                  <span className="local-mount-tag">本地</span>
                  {menuPath === f.doc.path && menuPos ? (
                    <FileContextMenu
                      menuRef={menuRef}
                      name={f.name}
                      pos={menuPos}
                      importDisabled={importDisabled}
                      onImportFile={() => {
                        setMenuPath(null);
                        onImportFile(f.doc.path);
                      }}
                      onRename={() => {
                        setMenuPath(null);
                        setRenamingPath(f.doc.path);
                        setInputValue(f.name);
                      }}
                      onDelete={() => {
                        setMenuPath(null);
                        if (window.confirm(`确认删除本地文件「${f.name}」？`)) {
                          void onDeleteFile(f.doc.path);
                        }
                      }}
                    />
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
