import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { KnowledgeDocument } from '../../api';
import type { FolderManager } from '../useFolders';
import { parentKey } from '../useFolders';
import { TreeInlineEditor } from '../tree/TreeInlineEditor';
import { FolderNode } from './FolderNode';
import { DocumentRow } from './DocumentRow';

type FolderTreeProps = {
  documents: KnowledgeDocument[];
  selectedId: number | null;
  isCreating: boolean;
  isBusy: boolean;
  folders: FolderManager;
  onSelectDocument: (documentId: number) => void;
  /** ⑥：在指定文件夹下新建文档（文件夹右键「在此新建文档」）。 */
  onCreateDocumentInFolder: (folderId?: number | null) => void;
  onMoveDocument: (document: KnowledgeDocument, targetFolderId: number | null) => void;
  onDeleteDocument: (documentId: number) => void;
};

export type TreeMenuState =
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

/**
 * 文档目录树（REQ-039）：递归渲染文件夹分支 + 文档叶子，右键菜单由父级 ContextPane 承载
 * 的子组件（FolderNode / DocumentRow）管理。E4 Slice D 拆分：主组件只剩遍历编排，
 * 行 / 菜单 / 内联编辑器分别移入 folder-tree 子文件，内联编辑器用共享 tree/TreeInlineEditor。
 */
export function FolderTree({
  documents,
  selectedId,
  isCreating,
  isBusy,
  folders,
  onSelectDocument,
  onCreateDocumentInFolder,
  onMoveDocument,
  onDeleteDocument,
}: FolderTreeProps) {
  const [menuState, setMenuState] = useState<TreeMenuState | null>(null);
  const closeMenu = useCallback(() => setMenuState(null), []);

  const openFolderMenu = useCallback((folderId: number, x: number, y: number) => {
    const menuWidth = 220;
    const menuHeight = 320;
    setMenuState({
      type: 'folder',
      folderId,
      x: Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8)),
    });
  }, []);

  const openDocumentMenu = useCallback((documentId: number, x: number, y: number) => {
    const menuWidth = 220;
    const menuHeight = 200;
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
          <TreeInlineEditor
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
            onCreateDocumentInFolder={onCreateDocumentInFolder}
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
            onDeleteDocument={onDeleteDocument}
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
