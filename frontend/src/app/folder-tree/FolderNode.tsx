import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { FolderView } from '../../api';
import type { FolderManager } from '../useFolders';
import { TreeInlineEditor } from '../tree/TreeInlineEditor';
import { useTreeMenuDismiss } from '../tree/useTreeMenuDismiss';
import type { TreeMenuState } from './FolderTree';

type FolderNodeProps = {
  folder: FolderView;
  depth: number;
  index: number;
  siblingCount: number;
  isBusy: boolean;
  isExpanded: boolean;
  folders: FolderManager;
  menuState: TreeMenuState | null;
  onOpenMenu: (folderId: number, x: number, y: number) => void;
  onCloseMenu: () => void;
  onCreateDocumentInFolder: (folderId?: number | null) => void;
  children: ReactNode;
};

/**
 * 文档目录树单个文件夹节点（REQ-039）：展开/折叠 + 右键菜单（新建/上移下移/移动/重命名/删除）
 * + 行内重命名编辑器。E4 Slice D 从 FolderTree 拆分，菜单关闭 useEffect 用共享 useTreeMenuDismiss。
 */
export function FolderNode({
  folder,
  depth,
  index,
  siblingCount,
  isBusy,
  isExpanded,
  folders,
  menuState,
  onOpenMenu,
  onCloseMenu,
  onCreateDocumentInFolder,
  children,
}: FolderNodeProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const moveTargets = folders.getMoveTargets(folder.id);
  const folderMenuState = menuState?.type === 'folder' && menuState.folderId === folder.id ? menuState : null;
  const isMenuOpen = folderMenuState !== null;
  const isRenaming = folders.inlineEdit?.mode === 'rename' && folders.inlineEdit.folder.id === folder.id;

  useTreeMenuDismiss(isMenuOpen, onCloseMenu, menuRef);

  function handleContextMenu(event: ReactMouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onOpenMenu(folder.id, event.clientX, event.clientY);
  }

  function handleLabelKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) {
      return;
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    onOpenMenu(folder.id, rect.left + 18, rect.bottom + 2);
  }

  function runMenuAction(action: () => void) {
    onCloseMenu();
    action();
  }

  return (
    <div className="tree-folder" role="treeitem" aria-expanded={isExpanded} onContextMenu={handleContextMenu}>
      {isRenaming ? (
        <TreeInlineEditor
          depth={depth}
          initialValue={folder.name}
          placeholder="文件夹名称"
          icon="✎"
          disabled={isBusy}
          onCancel={folders.cancelInlineEdit}
          onSubmit={folders.submitInlineEdit}
        />
      ) : (
        <div className={`tree-row tree-folder-row${isMenuOpen ? ' menu-open' : ''}`} style={{ '--tree-depth': depth } as CSSProperties}>
          <button
            type="button"
            className="tree-toggle"
            onClick={() => folders.toggleFolder(folder.id)}
            disabled={isBusy}
            aria-label={isExpanded ? `收起 ${folder.name}` : `展开 ${folder.name}`}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
          <button
            type="button"
            className="tree-folder-label"
            onClick={() => folders.toggleFolder(folder.id)}
            onKeyDown={handleLabelKeyDown}
            disabled={isBusy}
          >
            <span>{folder.name}</span>
          </button>
        </div>
      )}
      {folderMenuState ? (
        <div
          ref={menuRef}
          className="tree-menu-popover"
          style={{ left: folderMenuState.x, top: folderMenuState.y } as CSSProperties}
          role="menu"
          aria-label={`${folder.name} 操作`}
        >
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => onCreateDocumentInFolder(folder.id))} disabled={isBusy}>
            <span aria-hidden="true">＋</span>
            <span>在此新建文档</span>
          </button>
          <div className="tree-menu-separator" role="separator" />
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => folders.beginCreateFolder(folder.id))} disabled={isBusy}>
            <span aria-hidden="true">▣</span>
            <span>新建子文件夹</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => folders.beginRenameFolder(folder))} disabled={isBusy}>
            <span aria-hidden="true">✎</span>
            <span>重命名</span>
          </button>
          <div className="tree-menu-separator" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(() => folders.handleMoveFolderOrder(folder.parent_id, folder.id, -1))}
            disabled={isBusy || index === 0}
          >
            <span aria-hidden="true">↑</span>
            <span>上移</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(() => folders.handleMoveFolderOrder(folder.parent_id, folder.id, 1))}
            disabled={isBusy || index === siblingCount - 1}
          >
            <span aria-hidden="true">↓</span>
            <span>下移</span>
          </button>
          <label className="tree-menu-select">
            <span aria-hidden="true">⇥</span>
            <span>移动到</span>
            <select
              value={folder.parent_id ?? 'root'}
              onChange={(event) => {
                const value = event.target.value;
                runMenuAction(() => folders.handleMoveFolder(folder, value === 'root' ? null : Number(value)));
              }}
              disabled={isBusy}
            >
              {moveTargets.map((target) => (
                <option key={target.id ?? 'root'} value={target.id ?? 'root'}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
          <div className="tree-menu-separator" role="separator" />
          <button type="button" role="menuitem" className="danger" onClick={() => runMenuAction(() => folders.handleDeleteFolder(folder))} disabled={isBusy}>
            <span aria-hidden="true">×</span>
            <span>删除空文件夹</span>
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
