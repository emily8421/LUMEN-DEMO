// 本地 Vault 编辑态 + 文件增删改查（REQ-049：仅本地文件系统写，不进服务端 / 不进 RAG）。
// E4 拆分溯源：useLocalVaultMount.ts 拆分——REQ-049 写组。
import { useCallback, useState } from 'react';
import {
  createVaultFile,
  deleteVaultFile,
  ensureVaultWritePermission,
  parentDirectoryForPath,
  renameVaultFile,
  writeVaultFile,
} from '../features/local-mount/local-vault-fs';
import type { LocalVaultDoc } from '../features/local-mount/local-vault-index';
import type { VaultMount } from '../features/local-mount/local-vault-types';

type UseLocalVaultEditorArgs = {
  docs: LocalVaultDoc[];
  /** 当前挂载镜像（主 hook 的 ref，读最新值避免过期闭包）。 */
  mountsRef: { current: VaultMount[] };
  selectedPath: string | null;
  setSelectedPath: (path: string | null) => void;
  setError: (message: string) => void;
  /** 写操作后重建所属挂载索引（主 hook 注入 buildMountIndex）。 */
  rebuildMountIndex: (mountId: string, handle: FileSystemDirectoryHandle) => Promise<void>;
};

/**
 * 本地挂载文件编辑态 + 增删改查（REQ-049 写路径）。
 *
 * 依赖注入约定：docs / mountsRef / selectedPath / setError / rebuildMountIndex 由
 * useLocalVaultMount 注入；写操作前必须 ensureVaultWritePermission（用户手势内），
 * 失败 fail-closed 不静默；成功后经 rebuildMountIndex 重建挂载索引。
 */
export function useLocalVaultEditor({
  docs,
  mountsRef,
  selectedPath,
  setSelectedPath,
  setError,
  rebuildMountIndex,
}: UseLocalVaultEditorArgs) {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  /** 从 path 找所属挂载（含句柄与目录句柄映射）。 */
  const mountForPath = useCallback((path: string): VaultMount | null => {
    return mountsRef.current.find((m) => path === m.name || path.startsWith(m.name + '/')) ?? null;
  }, [mountsRef]);

  /** 取 path 的父目录句柄（所属挂载的 dirs 或根）。 */
  const parentHandleForPath = useCallback((path: string): FileSystemDirectoryHandle | null => {
    const mount = mountForPath(path);
    if (!mount) return null;
    // 相对挂载根的路径。
    const rel = path.startsWith(mount.name + '/') ? path.slice(mount.name.length + 1) : '';
    return parentDirectoryForPath(rel, mount.dirs, mount.handle);
  }, [mountForPath]);

  /** 从目录句柄反查挂载名（dirPath 为空 = 根目录新建）。 */
  const mountNameOf = useCallback((handle: FileSystemDirectoryHandle): string | null => {
    const mount = mountsRef.current.find((m) => m.handle === handle);
    return mount?.name ?? null;
  }, [mountsRef]);

  const beginEdit = useCallback((path: string) => {
    const doc = docs.find((d) => d.path === path);
    setEditingPath(path);
    setEditingText(doc?.text ?? '');
  }, [docs]);

  const saveEdit = useCallback(async () => {
    if (!editingPath) return;
    const doc = docs.find((d) => d.path === editingPath);
    if (!doc) return;
    const ok = await ensureVaultWritePermission(doc.handle);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      return;
    }
    try {
      await writeVaultFile(doc.handle, editingText);
      const mount = mountForPath(editingPath);
      if (mount) {
        await rebuildMountIndex(mount.id, mount.handle);
      }
      setEditingPath(null);
      setEditingText('');
      setSelectedPath(editingPath);
    } catch (e) {
      setError(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [editingPath, editingText, docs, mountForPath, rebuildMountIndex, setSelectedPath, setError]);

  const cancelEdit = useCallback(() => {
    setEditingPath(null);
    setEditingText('');
  }, []);

  const createFile = useCallback(async (dirPath: string, name: string, content: string) => {
    const parent = parentHandleForPath(dirPath);
    if (!parent || !name.trim()) return;
    const ok = await ensureVaultWritePermission(parent);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      return;
    }
    try {
      await createVaultFile(parent, name.trim(), content);
      const mount = mountForPath(dirPath || mountNameOf(parent) || '');
      if (mount) {
        await rebuildMountIndex(mount.id, mount.handle);
      }
    } catch (e) {
      setError(`新建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [parentHandleForPath, mountForPath, rebuildMountIndex, mountNameOf, setError]);

  const deleteFile = useCallback(async (path: string) => {
    const doc = docs.find((d) => d.path === path);
    if (!doc) return;
    const parent = parentHandleForPath(path);
    if (!parent) return;
    const ok = await ensureVaultWritePermission(parent);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      return;
    }
    try {
      await deleteVaultFile(parent, doc.name);
      if (selectedPath === path) setSelectedPath(null);
      if (editingPath === path) cancelEdit();
      const mount = mountForPath(path);
      if (mount) {
        await rebuildMountIndex(mount.id, mount.handle);
      }
    } catch (e) {
      setError(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [docs, parentHandleForPath, selectedPath, editingPath, cancelEdit, mountForPath, rebuildMountIndex, setSelectedPath, setError]);

  const renameFile = useCallback(async (path: string, newName: string) => {
    if (!newName.trim()) return;
    const doc = docs.find((d) => d.path === path);
    if (!doc) return;
    const parent = parentHandleForPath(path);
    if (!parent) return;
    const ok = await ensureVaultWritePermission(parent);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      return;
    }
    try {
      await renameVaultFile(parent, doc.name, newName.trim());
      const mount = mountForPath(path);
      if (mount) {
        const newRel = path.startsWith(mount.name + '/')
          ? `${mount.name}/${newName.trim()}`
          : newName.trim();
        if (selectedPath === path) setSelectedPath(newRel);
        await rebuildMountIndex(mount.id, mount.handle);
      }
    } catch (e) {
      setError(`重命名失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [docs, parentHandleForPath, selectedPath, mountForPath, rebuildMountIndex, setSelectedPath, setError]);

  /** 清空编辑态（卸载挂载时调用，避免残留悬空 path）。 */
  const clearEditing = useCallback(() => {
    setEditingPath(null);
    setEditingText('');
  }, []);

  return {
    editingPath,
    editingText,
    beginEdit,
    setEditingText,
    saveEdit,
    cancelEdit,
    createFile,
    deleteFile,
    renameFile,
    clearEditing,
  };
}
