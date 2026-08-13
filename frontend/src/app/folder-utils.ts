// 文件夹纯工具函数（E4 拆分溯源：useFolders.ts 拆分——parentKey + 移动目标构建）。
import type { FolderView } from '../api';

export type FolderMoveTarget = {
  id: number | null;
  label: string;
};

/** 父目录键：null → 'root'，其余 → 字符串 id（与 foldersByParent 的 key 口径一致）。 */
export function parentKey(parentId: number | null): string {
  return parentId === null ? 'root' : String(parentId);
}

/** 构建文件夹「移动到」目标（排除自身与自身后代，避免移进子目录成环）。 */
export function buildMoveTargets(knownFolders: FolderView[], folderId: number): FolderMoveTarget[] {
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

/** 构建文档「移动到」目标（全部已知文件夹，允许移入任意一层）。 */
export function buildDocumentMoveTargets(knownFolders: FolderView[]): FolderMoveTarget[] {
  return [
    { id: null, label: '根目录' },
    ...knownFolders.map((folder) => ({ id: folder.id, label: folder.name })),
  ];
}
