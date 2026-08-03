import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { FolderView, KnowledgeDocument } from '../api';
import type { FolderManager } from './useFolders';
import { parentKey } from './useFolders';

type FolderTreeProps = {
  documents: KnowledgeDocument[];
  selectedId: number | null;
  isCreating: boolean;
  isBusy: boolean;
  folders: FolderManager;
  onSelectDocument: (documentId: number) => void;
  onMoveDocument: (document: KnowledgeDocument, targetFolderId: number | null) => void;
};

type TreeMenuState =
  | {
      type: 'folder';
      folderId: number;
      x: number;
      y: number;
    }
  | {
      type: 'document';
      documentId: number;
      x: number;
      y: number;
    };

export function FolderTree({
  documents,
  selectedId,
  isCreating,
  isBusy,
  folders,
  onSelectDocument,
  onMoveDocument,
}: FolderTreeProps) {
  const [menuState, setMenuState] = useState<TreeMenuState | null>(null);
  const closeMenu = useCallback(() => setMenuState(null), []);

  const openFolderMenu = useCallback((folderId: number, x: number, y: number) => {
    const menuWidth = 220;
    const menuHeight = 292;
    setMenuState({
      type: 'folder',
      folderId,
      x: Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8)),
    });
  }, []);

  const openDocumentMenu = useCallback((documentId: number, x: number, y: number) => {
    const menuWidth = 220;
    const menuHeight = 164;
    setMenuState({
      type: 'document',
      documentId,
      x: Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8)),
    });
  }, []);

  const documentsByFolder = useMemo(() => {
    const groups = new Map<string, KnowledgeDocument[]>();
    documents.forEach((document) => {
      const key = parentKey(document.folder_id ?? null);
      const group = groups.get(key) ?? [];
      group.push(document);
      groups.set(key, group);
    });
    groups.forEach((group) => {
      group.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    });
    return groups;
  }, [documents]);

  const rootFolders = folders.getFoldersForParent(null);
  const rootDocuments = documentsByFolder.get(parentKey(null)) ?? [];

  function renderBranch(parentId: number | null, depth: number): ReactNode {
    const siblingFolders = folders.getFoldersForParent(parentId);
    const siblingDocuments = documentsByFolder.get(parentKey(parentId)) ?? [];
    const isCreatingFolder = folders.inlineEdit?.mode === 'create' && folders.inlineEdit.parentId === parentId;

    return (
      <>
        {isCreatingFolder ? (
          <FolderInlineEditor
            key={`create-${parentKey(parentId)}`}
            depth={depth}
            initialValue=""
            placeholder="文件夹名称"
            icon="▣"
            disabled={isBusy}
            onCancel={folders.cancelInlineEdit}
            onSubmit={folders.submitInlineEdit}
          />
        ) : null}
        {siblingFolders.map((folder, index) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            depth={depth}
            index={index}
            siblingCount={siblingFolders.length}
            isBusy={isBusy}
            isExpanded={folders.expandedFolderIds.has(folder.id)}
            folders={folders}
            menuState={menuState}
            onOpenMenu={openFolderMenu}
            onCloseMenu={closeMenu}
          >
            {folders.expandedFolderIds.has(folder.id) ? renderBranch(folder.id, depth + 1) : null}
          </FolderNode>
        ))}
        {siblingDocuments.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            depth={depth}
            isActive={document.id === selectedId && !isCreating}
            isBusy={isBusy}
            folders={folders}
            menuState={menuState}
            onSelectDocument={onSelectDocument}
            onMoveDocument={onMoveDocument}
            onOpenMenu={openDocumentMenu}
            onCloseMenu={closeMenu}
          />
        ))}
      </>
    );
  }

  if (rootFolders.length === 0 && rootDocuments.length === 0 && !folders.inlineEdit) {
    return <p className="empty-state context-empty">当前空间暂无可见文档。</p>;
  }

  return (
    <div className="folder-tree context-list" role="tree" aria-label="文档目录树">
      {renderBranch(null, 0)}
    </div>
  );
}

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
  children: ReactNode;
};

function FolderNode({
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
  children,
}: FolderNodeProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const moveTargets = folders.getMoveTargets(folder.id);
  const folderMenuState = menuState?.type === 'folder' && menuState.folderId === folder.id ? menuState : null;
  const isMenuOpen = folderMenuState !== null;
  const isRenaming = folders.inlineEdit?.mode === 'rename' && folders.inlineEdit.folder.id === folder.id;

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onCloseMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseMenu();
      }
    }

    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onCloseMenu);
    window.addEventListener('scroll', onCloseMenu, true);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onCloseMenu);
      window.removeEventListener('scroll', onCloseMenu, true);
    };
  }, [isMenuOpen, onCloseMenu]);

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
        <FolderInlineEditor
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

type DocumentRowProps = {
  document: KnowledgeDocument;
  depth: number;
  isActive: boolean;
  isBusy: boolean;
  folders: FolderManager;
  menuState: TreeMenuState | null;
  onSelectDocument: (documentId: number) => void;
  onMoveDocument: (document: KnowledgeDocument, targetFolderId: number | null) => void;
  onOpenMenu: (documentId: number, x: number, y: number) => void;
  onCloseMenu: () => void;
};

function DocumentRow({
  document,
  depth,
  isActive,
  isBusy,
  folders,
  menuState,
  onSelectDocument,
  onMoveDocument,
  onOpenMenu,
  onCloseMenu,
}: DocumentRowProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const moveTargets = folders.getDocumentMoveTargets();
  const documentMenuState = menuState?.type === 'document' && menuState.documentId === document.id ? menuState : null;
  const isMenuOpen = documentMenuState !== null;

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onCloseMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseMenu();
      }
    }

    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onCloseMenu);
    window.addEventListener('scroll', onCloseMenu, true);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onCloseMenu);
      window.removeEventListener('scroll', onCloseMenu, true);
    };
  }, [isMenuOpen, onCloseMenu]);

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
        </div>
      ) : null}
    </div>
  );
}

type FolderInlineEditorProps = {
  depth: number;
  initialValue: string;
  placeholder: string;
  icon: string;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<boolean>;
};

function FolderInlineEditor({
  depth,
  initialValue,
  placeholder,
  icon,
  disabled,
  onCancel,
  onSubmit,
}: FolderInlineEditorProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    if (initialValue) {
      inputRef.current?.select();
    }
  }, [initialValue]);

  function cancel() {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onCancel();
  }

  async function submit() {
    if (finishedRef.current) {
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      cancel();
      return;
    }

    finishedRef.current = true;
    const succeeded = await onSubmit(trimmedValue);
    if (!succeeded) {
      finishedRef.current = false;
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  }

  return (
    <div className="tree-row tree-inline-row" style={{ '--tree-depth': depth } as CSSProperties}>
      <span className="tree-inline-icon" aria-hidden="true">{icon}</span>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!disabled) {
            void submit();
          }
        }}
        aria-label={placeholder}
      />
    </div>
  );
}
