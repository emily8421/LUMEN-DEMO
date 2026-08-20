import { useMemo, useRef, useState } from 'react';
import type { FolderView } from '../api';
import {
  deleteFolder,
  listFolders,
  reorderFolders,
  updateFolder as updateFolderRequest,
} from '../api';
import { parentKey, buildMoveTargets, buildDocumentMoveTargets } from './folder-utils';
import type { FolderMoveTarget } from './folder-utils';
import { useFolderInlineEdit } from './useFolderInlineEdit';
import { createKeyedResponseOwnership } from './response-ownership';
import type { RunAction } from './types';

type UseFoldersArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

export { parentKey } from './folder-utils';

export type { FolderInlineEdit } from './useFolderInlineEdit';

export function useFolders({ token, currentSpaceId, runAction, setNotice }: UseFoldersArgs) {
  const [foldersByParent, setFoldersByParent] = useState<Record<string, FolderView[]>>({});
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());
  const responseOwnership = useRef(createKeyedResponseOwnership());
  const scope = JSON.stringify([token ?? null, currentSpaceId ?? null]);
  responseOwnership.current.setScope(scope);

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
    if (!responseOwnership.current.isCurrentScope(JSON.stringify([loadToken, currentSpaceId ?? null]))) {
      return;
    }
    const ticket = responseOwnership.current.begin(parentKey(parentId));
    const items = await listFolders(loadToken, parentId);
    if (responseOwnership.current.owns(ticket)) {
      setFoldersByParent((current) => ({ ...current, [parentKey(parentId)]: items }));
    }
  }

  async function reloadParents(loadToken: string, parentIds: Array<number | null>) {
    if (!responseOwnership.current.isCurrentScope(JSON.stringify([loadToken, currentSpaceId ?? null]))) {
      return;
    }
    const uniqueParentIds = Array.from(new Map(parentIds.map((id) => [parentKey(id), id])).values());
    const entries = await Promise.all(
      uniqueParentIds.map(async (parentId) => {
        const key = parentKey(parentId);
        const ticket = responseOwnership.current.begin(key);
        return { key, items: await listFolders(loadToken, parentId), ticket };
      }),
    );
    const currentEntries = entries
      .filter(({ ticket }) => responseOwnership.current.owns(ticket))
      .map(({ key, items }) => [key, items] as const);
    if (currentEntries.length > 0) {
      setFoldersByParent((current) => ({ ...current, ...Object.fromEntries(currentEntries) }));
    }
  }

  async function reloadLoadedFolders(loadToken: string) {
    if (!responseOwnership.current.isCurrentScope(JSON.stringify([loadToken, currentSpaceId ?? null]))) {
      return;
    }
    const parentIds: Array<number | null> = [null, ...Array.from(expandedFolderIds)];
    const entries = await Promise.all(
      parentIds.map(async (parentId) => {
        const key = parentKey(parentId);
        const ticket = responseOwnership.current.begin(key);
        return { key, items: await listFolders(loadToken, parentId), ticket };
      }),
    );
    const currentEntries = entries
      .filter(({ ticket }) => responseOwnership.current.owns(ticket))
      .map(({ key, items }) => [key, items] as const);
    if (currentEntries.length > 0) {
      setFoldersByParent(Object.fromEntries(currentEntries));
    }
  }

  function resetFolders() {
    setFoldersByParent({});
    setExpandedFolderIds(new Set());
  }

  function collapseAll() {
    setExpandedFolderIds(new Set());
  }

  function expandAll() {
    setExpandedFolderIds(new Set(knownFolders.map((folder) => folder.id)));
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
    ensureParentLoaded(folderId);
  }

  // inline 编辑的「未加载则加载」判定收敛在此（foldersByParent 不直传子 hook）。
  function ensureParentLoaded(parentId: number | null) {
    if (parentId !== null && !foldersByParent[parentKey(parentId)] && token) {
      void runAction('正在加载文件夹...', async () => {
        await loadParent(token, parentId);
      });
    }
  }

  const inline = useFolderInlineEdit({
    token,
    runAction,
    setNotice,
    reloadParents,
    setExpandedFolderIds,
    ensureParentLoaded,
  });

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
    return buildMoveTargets(knownFolders, folderId);
  }

  function getDocumentMoveTargets(): FolderMoveTarget[] {
    return buildDocumentMoveTargets(knownFolders);
  }

  return {
    foldersByParent,
    expandedFolderIds,
    inlineEdit: inline.inlineEdit,
    knownFolders,
    getFoldersForParent,
    getMoveTargets,
    getDocumentMoveTargets,
    reloadLoadedFolders,
    resetFolders,
    collapseAll,
    expandAll,
    beginCreateFolder: inline.beginCreateFolder,
    beginRenameFolder: inline.beginRenameFolder,
    cancelInlineEdit: inline.cancelInlineEdit,
    submitInlineEdit: inline.submitInlineEdit,
    toggleFolder,
    handleCreateFolder: inline.beginCreateFolder,
    handleRenameFolder: inline.beginRenameFolder,
    handleDeleteFolder,
    handleMoveFolder,
    handleMoveFolderOrder,
  };
}

export type FolderManager = ReturnType<typeof useFolders>;
