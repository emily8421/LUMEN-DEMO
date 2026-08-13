import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { KnowledgeDocument } from '../../api';
import type { FolderManager } from '../useFolders';
import { useTreeMenuDismiss } from '../tree/useTreeMenuDismiss';
import type { TreeMenuState } from './FolderTree';

type DocumentRowProps = {
  document: KnowledgeDocument;
  depth: number;
  isActive: boolean;
  isBusy: boolean;
  folders: FolderManager;
  menuState: TreeMenuState | null;
  onSelectDocument: (documentId: number) => void;
  onMoveDocument: (document: KnowledgeDocument, targetFolderId: number | null) => void;
  onDeleteDocument: (documentId: number) => void;
  onOpenMenu: (documentId: number, x: number, y: number) => void;
  onCloseMenu: () => void;
};

/**
 * 文档目录树单个文档叶子行（REQ-039）：点击选中 + 右键菜单（打开/移动/删除）。
 * E4 Slice D 从 FolderTree 拆分，菜单关闭 useEffect 用共享 useTreeMenuDismiss。
 */
export function DocumentRow({
  document,
  depth,
  isActive,
  isBusy,
  folders,
  menuState,
  onSelectDocument,
  onMoveDocument,
  onDeleteDocument,
  onOpenMenu,
  onCloseMenu,
}: DocumentRowProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const moveTargets = folders.getDocumentMoveTargets();
  const documentMenuState = menuState?.type === 'document' && menuState.documentId === document.id ? menuState : null;
  const isMenuOpen = documentMenuState !== null;

  useTreeMenuDismiss(isMenuOpen, onCloseMenu, menuRef);

  function handleContextMenu(event: ReactMouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onOpenMenu(document.id, event.clientX, event.clientY);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) {
      return;
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    onOpenMenu(document.id, rect.left + 18, rect.bottom + 2);
  }

  function runMenuAction(action: () => void) {
    onCloseMenu();
    action();
  }

  return (
    <div className="tree-document-item" role="treeitem" onContextMenu={handleContextMenu}>
      <button
        type="button"
        className={`tree-row tree-document-row${isActive ? ' active' : ''}${isMenuOpen ? ' menu-open' : ''}`}
        style={{ '--tree-depth': depth } as CSSProperties}
        data-document-id={document.id}
        onClick={() => onSelectDocument(document.id)}
        onKeyDown={handleKeyDown}
        disabled={isBusy}
        aria-haspopup="menu"
      >
        <span>{document.title}</span>
      </button>
      {documentMenuState ? (
        <div
          ref={menuRef}
          className="tree-menu-popover"
          style={{ left: documentMenuState.x, top: documentMenuState.y } as CSSProperties}
          role="menu"
          aria-label={`${document.title} 操作`}
        >
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => onSelectDocument(document.id))} disabled={isBusy}>
            <span aria-hidden="true">↵</span>
            <span>打开</span>
          </button>
          <div className="tree-menu-separator" role="separator" />
          <label className="tree-menu-select">
            <span aria-hidden="true">⇥</span>
            <span>移动到</span>
            <select
              value={document.folder_id ?? 'root'}
              onChange={(event) => {
                const value = event.target.value;
                runMenuAction(() => onMoveDocument(document, value === 'root' ? null : Number(value)));
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
          <button type="button" role="menuitem" className="danger" onClick={() => runMenuAction(() => onDeleteDocument(document.id))} disabled={isBusy}>
            <span aria-hidden="true">×</span>
            <span>删除文档</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
