import { useMemo, useState } from 'react';
import type { FolderView } from '../api';
import {
  createFolder as createFolderRequest,
  deleteFolder,
  listFolders,
  reorderFolders,
  updateFolder as updateFolderRequest,
} from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseFoldersArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

export type FolderMoveTarget = {
  id: number | null;
  label: string;
};

export type FolderInlineEdit =
  | {
      mode: 'create';
      parentId: number | null;
    }
  | {
      mode: 'rename';
      folder: FolderView;
    };

export function parentKey(parentId: number | null): string {
  return parentId === null ? 'root' : String(parentId);
}

export function useFolders({ token, runAction, setNotice }: UseFoldersArgs) {
  const [foldersByParent, setFoldersByParent] = useState<Record<string, FolderView[]>>({});
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());
  const [inlineEdit, setInlineEdit] = useState<FolderInlineEdit | null>(null);

  const knownFolders = useMemo(() => {
    const byId = new Map<number, FolderView>();
    Object.values(foldersByParent).forEach((folders) => {
      folders.forEach((folder) => byId.set(folder.id, folder));
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }, [foldersByParent]);

  function getFoldersForParent(parentId: number | null): FolderView[] {
    return foldersByParent[parentKey(parentId)] ?? [];
  }

  async function loadParent(loadToken: string, parentId: number | null) {
    const items = await listFolders(loadToken, parentId);
    setFoldersByParent((current) => ({ ...current, [parentKey(parentId)]: items }));
  }

  async function reloadParents(loadToken: string, parentIds: Array<number | null>) {
    const uniqueParentIds = Array.from(new Map(parentIds.map((id) => [parentKey(id), id])).values());
    const entries = await Promise.all(
      uniqueParentIds.map(async (parentId) => [parentKey(parentId), await listFolders(loadToken, parentId)] as const),
    );
    setFoldersByParent((current) => ({ ...current, ...Object.fromEntries(entries) }));
  }

  async function reloadLoadedFolders(loadToken: string) {
    const parentIds: Array<number | null> = [null, ...Array.from(expandedFolderIds)];
    const entries = await Promise.all(
      parentIds.map(async (parentId) => [parentKey(parentId), await listFolders(loadToken, parentId)] as const),
    );
    setFoldersByParent(Object.fromEntries(entries));
  }

  function resetFolders() {
    setFoldersByParent({});
    setExpandedFolderIds(new Set());
  }

  function collapseAll() {
    setExpandedFolderIds(new Set());
  }

  function beginCreateFolder(parentId: number | null) {
    if (parentId !== null) {
      setExpandedFolderIds((current) => new Set(current).add(parentId));
      if (!foldersByParent[parentKey(parentId)] && token) {
        void runAction('正在加载文件夹...', async () => {
          await loadParent(token, parentId);
        });
      }
    }
    setInlineEdit({ mode: 'create', parentId });
  }

  function beginRenameFolder(folder: FolderView) {
    setInlineEdit({ mode: 'rename', folder });
  }

  function cancelInlineEdit() {
    setInlineEdit(null);
  }

  function toggleFolder(folderId: number) {
    const isExpanded = expandedFolderIds.has(folderId);
    if (isExpanded) {
      setExpandedFolderIds((current) => {
        const next = new Set(current);
        next.delete(folderId);
        return next;
      });
      return;
    }

    setExpandedFolderIds((current) => new Set(current).add(folderId));
    if (!foldersByParent[parentKey(folderId)] && token) {
      void runAction('正在加载文件夹...', async () => {
        await loadParent(token, folderId);
      });
    }
  }

  async function createFolderWithName(parentId: number | null, name: string): Promise<boolean> {
    const trimmedName = name.trim();
    if (!token || !trimmedName) {
      return false;
    }

    let succeeded = false;
    await runAction('正在新建文件夹...', async () => {
      await createFolderRequest(token, { name: trimmedName, parent_id: parentId });
      if (parentId !== null) {
        setExpandedFolderIds((current) => new Set(current).add(parentId));
      }
      await reloadParents(token, [parentId]);
      setNotice(`已新建文件夹：${trimmedName}`);
      succeeded = true;
    });
    return succeeded;
  }

  async function renameFolderWithName(folder: FolderView, name: string): Promise<boolean> {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === folder.name) {
      return true;
    }

    if (!token) {
      return false;
    }

    let succeeded = false;
    await runAction('正在重命名文件夹...', async () => {
      await updateFolderRequest(token, folder.id, { name: trimmedName });
      await reloadParents(token, [folder.parent_id]);
      setNotice(`已重命名为：${trimmedName}`);
      succeeded = true;
    });
    return succeeded;
  }

  async function submitInlineEdit(name: string): Promise<boolean> {
    if (!inlineEdit) {
      return false;
    }

    const succeeded =
      inlineEdit.mode === 'create'
        ? await createFolderWithName(inlineEdit.parentId, name)
        : await renameFolderWithName(inlineEdit.folder, name);
    if (succeeded) {
      setInlineEdit(null);
    }
    return succeeded;
  }

  function handleDeleteFolder(folder: FolderView) {
    if (!token) {
      return;
    }
    if (!window.confirm(`确认删除空文件夹「${folder.name}」？`)) {
      return;
    }

    void runAction('正在删除文件夹...', async () => {
      await deleteFolder(token, folder.id);
      setExpandedFolderIds((current) => {
        const next = new Set(current);
        next.delete(folder.id);
        return next;
      });
      setFoldersByParent((current) => {
        const next = { ...current };
        delete next[parentKey(folder.id)];
        return next;
      });
      await reloadParents(token, [folder.parent_id]);
      setNotice('文件夹已删除。');
    });
  }

  function handleMoveFolder(folder: FolderView, targetParentId: number | null) {
    if (!token || targetParentId === folder.parent_id) {
      return;
    }

    void runAction('正在移动文件夹...', async () => {
      await updateFolderRequest(token, folder.id, { parent_id: targetParentId });
      if (targetParentId !== null) {
        setExpandedFolderIds((current) => new Set(current).add(targetParentId));
      }
      await reloadParents(token, [folder.parent_id, targetParentId]);
      setNotice(`已移动文件夹：${folder.name}`);
    });
  }

  function handleMoveFolderOrder(parentId: number | null, folderId: number, direction: -1 | 1) {
    if (!token) {
      return;
    }
    const siblings = getFoldersForParent(parentId);
    const index = siblings.findIndex((folder) => folder.id === folderId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return;
    }

    const orderedIds = siblings.map((folder) => folder.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];

    void runAction('正在调整文件夹顺序...', async () => {
      await reorderFolders(token, { parent_id: parentId, ordered_ids: orderedIds });
      await reloadParents(token, [parentId]);
      setNotice('文件夹顺序已更新。');
    });
  }

  function getMoveTargets(folderId: number): FolderMoveTarget[] {
    const byId = new Map(knownFolders.map((folder) => [folder.id, folder]));
    const isKnownDescendant = (candidate: FolderView) => {
      let parentId = candidate.parent_id;
      while (parentId !== null) {
        if (parentId === folderId) {
          return true;
        }
        const parent = byId.get(parentId);
        if (!parent) {
          return false;
        }
        parentId = parent.parent_id;
      }
      return false;
    };

    return [
      { id: null, label: '根目录' },
      ...knownFolders
        .filter((folder) => folder.id !== folderId && !isKnownDescendant(folder))
        .map((folder) => ({ id: folder.id, label: folder.name })),
    ];
  }

  function getDocumentMoveTargets(): FolderMoveTarget[] {
    return [
      { id: null, label: '根目录' },
      ...knownFolders.map((folder) => ({ id: folder.id, label: folder.name })),
    ];
  }

  return {
    foldersByParent,
    expandedFolderIds,
    inlineEdit,
    knownFolders,
    getFoldersForParent,
    getMoveTargets,
    getDocumentMoveTargets,
    reloadLoadedFolders,
    resetFolders,
    collapseAll,
    beginCreateFolder,
    beginRenameFolder,
    cancelInlineEdit,
    submitInlineEdit,
    toggleFolder,
    handleCreateFolder: beginCreateFolder,
    handleRenameFolder: beginRenameFolder,
    handleDeleteFolder,
    handleMoveFolder,
    handleMoveFolderOrder,
  };
}

export type FolderManager = ReturnType<typeof useFolders>;
