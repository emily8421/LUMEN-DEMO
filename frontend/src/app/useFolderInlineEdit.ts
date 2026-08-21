// 文件夹内联新建 / 重命名编辑态（E4 拆分溯源：useFolders.ts 拆分——inline 编辑组）。
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { createFolder as createFolderRequest, updateFolder as updateFolderRequest } from '../api';
import type { FolderView } from '../api';
import type { RunAction } from './types';

export type FolderInlineEdit =
  | {
      mode: 'create';
      parentId: number | null;
    }
  | {
      mode: 'rename';
      folder: FolderView;
    };

type UseFolderInlineEditArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
  reloadParents: (loadToken: string, parentIds: Array<number | null>) => Promise<void>;
  setExpandedFolderIds: Dispatch<SetStateAction<Set<number>>>;
  ensureParentLoaded: (parentId: number | null) => void;
};

/**
 * 文件夹内联新建 / 重命名编辑态（树内行内输入，Sprint-23 文件夹 CRUD）。
 *
 * 依赖注入约定：token / runAction / setNotice / reloadParents / setExpandedFolderIds /
 * ensureParentLoaded 由 useFolders 注入（foldersByParent 的「未加载则加载」判定在
 * ensureParentLoaded 内收敛，子 hook 不直接读 foldersByParent，避免 state 直传）。
 */
export function useFolderInlineEdit({
  token,
  runAction,
  setNotice,
  reloadParents,
  setExpandedFolderIds,
  ensureParentLoaded,
}: UseFolderInlineEditArgs) {
  const [inlineEdit, setInlineEdit] = useState<FolderInlineEdit | null>(null);

  function beginCreateFolder(parentId: number | null) {
    if (parentId !== null) {
      setExpandedFolderIds((current) => new Set(current).add(parentId));
      ensureParentLoaded(parentId);
    }
    setInlineEdit({ mode: 'create', parentId });
  }

  function beginRenameFolder(folder: FolderView) {
    setInlineEdit({ mode: 'rename', folder });
  }

  function cancelInlineEdit() {
    setInlineEdit(null);
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

  return {
    inlineEdit,
    beginCreateFolder,
    beginRenameFolder,
    cancelInlineEdit,
    submitInlineEdit,
  };
}
