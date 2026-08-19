// 本地 Vault 挂载编排 hook（REQ-018 模式 B / REQ-049 增强）
// 编排 task-031 数据层：pick→verify→存句柄→walk→读内容→倒排索引；页面加载无感恢复；本地搜索 / 预览。
// 多挂载（REQ-049 增强）：支持同时挂载多个本地目录，IDB 存句柄数组；
// 各挂载独立管理句柄 / 状态，docs 聚合后供树 / 搜索 / 编辑统一使用（path 全局唯一）。
// E4 拆分溯源：类型在 local-vault-types.ts，树构建在 local-vault-tree.ts，REQ-049 写组在 useLocalVaultEditor.ts。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readVaultFile, verifyPermission } from '../features/local-mount/local-vault-fs';
import {
  clearVaultHandle,
  removeVaultHandle,
  restoreVaultHandles,
  saveVaultHandle,
} from '../features/local-mount/local-vault-idb';
import { isFileSystemAccessSupported, pickDirectory, walkVault } from '../features/local-mount/local-vault-walk';
import { buildInvertedIndex, searchIndex } from '../features/local-mount/local-vault-index';
import type { LocalVaultDoc, LocalVaultIndex } from '../features/local-mount/local-vault-index';
import type { WalkedFile } from '../features/local-mount/local-vault-walk';
import type { UseLocalVaultMount, VaultMount } from '../features/local-mount/local-vault-types';
import { useLocalVaultEditor } from './useLocalVaultEditor';

/** 挂载 id 序号（跨挂载全局自增，保证 id 唯一；模块级，同文件内 reassign）。 */
let mountSeq = 0;

export type { LocalMountStatus, UseLocalVaultMount, VaultMount } from '../features/local-mount/local-vault-types';
export { buildLocalMountTree } from '../features/local-mount/local-vault-tree';
export type { LocalMountTreeNode } from '../features/local-mount/local-vault-tree';

/**
 * 本地 Vault 挂载编排（REQ-018 模式 B / REQ-049 增强）。
 *
 * 依赖注入约定：无参数。内部组合 local-vault-* 工具层；编辑态 / 文件增删改查
 * 在 useLocalVaultEditor（写路径经 ensureVaultWritePermission 用户手势内授权）。
 */
export function useLocalVaultMount(): UseLocalVaultMount {
  const [supported] = useState<boolean>(isFileSystemAccessSupported());
  const [mounts, setMounts] = useState<VaultMount[]>([]);
  const [docs, setDocs] = useState<LocalVaultDoc[]>([]);
  const [index, setIndex] = useState<LocalVaultIndex | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState('');

  const mountsRef = useRef<VaultMount[]>([]);
  mountsRef.current = mounts;

  /** 聚合索引：把多个挂载的 docs 合并成一个索引（path 作为唯一键，重复按后者覆盖）。 */
  const buildAggregateIndex = useCallback((allDocs: LocalVaultDoc[]): LocalVaultIndex => {
    return buildInvertedIndex(allDocs);
  }, []);

  /** 构建单个挂载：walk → 读内容 → 更新该挂载句柄 + 聚合 docs/index。 */
  const buildMountIndex = useCallback(async (mountId: string, handle: FileSystemDirectoryHandle) => {
    setMounts((current) => current.map((m) => (m.id === mountId ? { ...m, status: 'mounting', fileCount: 0 } : m)));
    const files: WalkedFile[] = [];
    const dirs = new Map<string, FileSystemDirectoryHandle>();
    await walkVault(handle, '', files, (n) => {
      setMounts((cur) => cur.map((m) => (m.id === mountId ? { ...m, fileCount: n } : m)));
    }, dirs);
    const mountName = handle.name;
    // 多挂载：doc.path 加挂载名前缀（`<挂载名>/<相对路径>`）保证全局唯一，聚合树平铺所有挂载。
    const newDocs: LocalVaultDoc[] = [];
    for (const f of files) {
      const doc = await readVaultFile(f);
      newDocs.push({ ...doc, path: `${mountName}/${doc.path}`, name: doc.name });
    }
    // 更新该挂载句柄映射。
    setMounts((current) => current.map((m) => (m.id === mountId ? { ...m, dirs, fileCount: newDocs.length, status: 'mounted' } : m)));
    // 聚合：去掉该挂载旧 docs（按挂载名前缀过滤），合并新 docs。
    setDocs((allDocs) => {
      const others = allDocs.filter((d) => !d.path.startsWith(`${mountName}/`));
      const merged = [...others, ...newDocs];
      setIndex(buildAggregateIndex(merged));
      setFileCount(merged.length);
      return merged;
    });
  }, [buildAggregateIndex]);

  // 页面加载：无感恢复全部已保存挂载。
  useEffect(() => {
    if (!isFileSystemAccessSupported()) return;
    let cancelled = false;
    void (async () => {
      const results = await restoreVaultHandles(false);
      if (cancelled) return;
      const restored: VaultMount[] = [];
      for (const result of results) {
        if (result.status === 'granted' && result.handle) {
          const id = `${result.handle.name}-${mountSeq++}`;
          restored.push({ id, name: result.handle.name, handle: result.handle, status: 'mounting', fileCount: 0, dirs: new Map(), error: '' });
        } else if (result.status === 'needs-auth' && result.handle) {
          const id = `${result.handle.name}-${mountSeq++}`;
          restored.push({ id, name: result.handle.name, handle: result.handle, status: 'needs-auth', fileCount: 0, dirs: new Map(), error: '' });
        }
      }
      if (restored.length > 0) {
        setMounts(restored);
        // 并行构建所有 granted 挂载。
        for (const mount of restored) {
          if (mount.status === 'mounting') {
            await buildMountIndex(mount.id, mount.handle);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildMountIndex]);

  // 挂载：选目录 → 授权 → 存句柄 → 建索引。
  const mount = useCallback(async () => {
    setError('');
    try {
      const handle = await pickDirectory();
      if (!(await verifyPermission(handle, false))) {
        setError('授权被拒');
        return;
      }
      await saveVaultHandle(handle);
      const id = `${handle.name}-${mountSeq++}`;
      setMounts((current) => [...current, { id, name: handle.name, handle, status: 'mounting', fileCount: 0, dirs: new Map(), error: '' }]);
      await buildMountIndex(id, handle);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [buildMountIndex]);

  // 重新授权单个挂载（在用户手势内调用 requestPermission）。
  const reauth = useCallback(async (mountId: string) => {
    setError('');
    const target = mountsRef.current.find((m) => m.id === mountId);
    if (!target) return;
    const result = await restoreVaultHandles(true);
    const granted = result.find((r) => r.handle?.name === target.name);
    if (granted?.status === 'granted' && granted.handle) {
      await buildMountIndex(mountId, granted.handle);
    } else {
      setError('重新授权失败');
    }
  }, [buildMountIndex]);

  // 重扫单个挂载。
  const reindex = useCallback(async (mountId: string) => {
    const target = mountsRef.current.find((m) => m.id === mountId);
    if (!target) return;
    await buildMountIndex(mountId, target.handle);
  }, [buildMountIndex]);

  // REQ-049 编辑态 + 文件增删改查（写路径在 useLocalVaultEditor）。
  const editor = useLocalVaultEditor({
    docs,
    mountsRef,
    selectedPath,
    setSelectedPath,
    setError,
    rebuildMountIndex: buildMountIndex,
  });

  // 卸载单个挂载。
  const unmount = useCallback(async (mountId: string) => {
    const target = mountsRef.current.find((m) => m.id === mountId);
    if (target) {
      await removeVaultHandle(target.handle);
    }
    setMounts((current) => current.filter((m) => m.id !== mountId));
    setDocs((allDocs) => {
      if (target) {
        const withoutTarget = allDocs.filter((d) => !d.path.startsWith(target.name + '/') && d.path !== target.name);
        setIndex(buildAggregateIndex(withoutTarget));
        setFileCount(withoutTarget.length);
        return withoutTarget;
      }
      return allDocs;
    });
    if (selectedPath && target && (selectedPath === target.name || selectedPath.startsWith(target.name + '/'))) {
      setSelectedPath(null);
    }
    if (editor.editingPath && target && (editor.editingPath === target.name || editor.editingPath.startsWith(target.name + '/'))) {
      editor.clearEditing();
    }
  }, [buildAggregateIndex, selectedPath, editor]);

  // 卸载全部。
  const unmountAll = useCallback(async () => {
    await clearVaultHandle();
    setMounts([]);
    setDocs([]);
    setIndex(null);
    setFileCount(0);
    setSelectedPath(null);
    setQuery('');
    editor.clearEditing();
  }, [editor]);

  // 本地搜索。
  const hits = useMemo(
    () => (index && query.trim() ? searchIndex(index, query) : []),
    [index, query]
  );

  // 本地预览。
  const previewText = useMemo(() => {
    if (!selectedPath) return '';
    return docs.find((d) => d.path === selectedPath)?.text ?? '';
  }, [docs, selectedPath]);

  const openDoc = useCallback((path: string) => setSelectedPath(path), []);

  return {
    supported,
    mounts,
    docs,
    index,
    fileCount,
    query,
    hits,
    selectedPath,
    previewText,
    error,
    setQuery,
    mount,
    reauth,
    reindex,
    unmount,
    unmountAll,
    openDoc,
    editingPath: editor.editingPath,
    editingText: editor.editingText,
    beginEdit: editor.beginEdit,
    setEditingText: editor.setEditingText,
    saveEdit: editor.saveEdit,
    cancelEdit: editor.cancelEdit,
    createFile: editor.createFile,
    deleteFile: editor.deleteFile,
    renameFile: editor.renameFile,
  };
}
