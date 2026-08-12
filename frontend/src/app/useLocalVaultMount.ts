// 本地 Vault 挂载编排 hook（REQ-018 模式 B / REQ-049 增强）
// 编排 task-031 数据层：pick→verify→存句柄→walk→读内容→倒排索引；页面加载无感恢复；本地搜索 / 预览。
// 多挂载（REQ-049 增强）：支持同时挂载多个本地目录，IDB 存句柄数组；
// 各挂载独立管理句柄 / 状态，docs 聚合后供树 / 搜索 / 编辑统一使用（path 全局唯一）。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearVaultHandle,
  createVaultFile,
  deleteVaultFile,
  ensureVaultWritePermission,
  isFileSystemAccessSupported,
  parentDirectoryForPath,
  pickDirectory,
  readVaultFile,
  removeVaultHandle,
  renameVaultFile,
  restoreVaultHandles,
  saveVaultHandle,
  verifyPermission,
  walkVault,
  writeVaultFile,
  type WalkedFile,
} from './local-vault-fs';
import {
  buildInvertedIndex,
  searchIndex,
  type LocalVaultDoc,
  type LocalVaultIndex,
  type LocalVaultSearchHit,
} from './local-vault-index';

export type LocalMountStatus =
  | 'idle'
  | 'mounting'
  | 'mounted'
  | 'needs-auth'
  | 'unsupported'
  | 'error';

/** 单个挂载项（多挂载）。 */
export interface VaultMount {
  /** 稳定 id（句柄 name + 序号），用于 key / 移除。 */
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  status: LocalMountStatus;
  fileCount: number;
  /** 该挂载的目录相对路径 → 目录句柄（增删改查定位父目录）。 */
  dirs: Map<string, FileSystemDirectoryHandle>;
  error: string;
}

/** 目录树节点（由扁平 docs 路径聚合，PoC renderTree 同构）。 */
export interface LocalMountTreeNode {
  name: string;
  path: string;
  children: Map<string, LocalMountTreeNode>;
  files: { name: string; doc: LocalVaultDoc }[];
}

/** 由 docs 路径聚合目录树（自动排除隐藏目录文件，已在 walk 阶段过滤）。 */
export function buildLocalMountTree(docs: LocalVaultDoc[]): LocalMountTreeNode {
  const root: LocalMountTreeNode = { name: '', path: '', children: new Map(), files: [] };
  for (const doc of docs) {
    const parts = doc.path.split('/');
    let node = root;
    let dirPath = '';
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      dirPath = dirPath ? `${dirPath}/${key}` : key;
      let child = node.children.get(key);
      if (!child) {
        child = { name: key, path: dirPath, children: new Map(), files: [] };
        node.children.set(key, child);
      }
      node = child;
    }
    node.files.push({ name: parts[parts.length - 1], doc });
  }
  return root;
}

export interface UseLocalVaultMount {
  /** 是否支持 File System Access（Chrome/Edge + localhost）。 */
  supported: boolean;
  /** 全部挂载项（含各自句柄 / 状态 / 目录句柄）。 */
  mounts: VaultMount[];
  /** 聚合文档（多挂载合并；path 全局唯一）。 */
  docs: LocalVaultDoc[];
  index: LocalVaultIndex | null;
  fileCount: number;
  query: string;
  hits: LocalVaultSearchHit[];
  selectedPath: string | null;
  previewText: string;
  error: string;
  setQuery: (q: string) => void;
  mount: () => Promise<void>;
  reauth: (mountId: string) => Promise<void>;
  reindex: (mountId: string) => Promise<void>;
  unmount: (mountId: string) => Promise<void>;
  unmountAll: () => Promise<void>;
  openDoc: (path: string) => void;
  // REQ-049 本地读写：编辑态 + 文件增删改查。
  editingPath: string | null;
  editingText: string;
  beginEdit: (path: string) => void;
  setEditingText: (text: string) => void;
  saveEdit: () => Promise<void>;
  cancelEdit: () => void;
  createFile: (dirPath: string, name: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (path: string, newName: string) => Promise<void>;
}

let mountSeq = 0;

export function useLocalVaultMount(): UseLocalVaultMount {
  const [supported] = useState<boolean>(isFileSystemAccessSupported());
  const [mounts, setMounts] = useState<VaultMount[]>([]);
  const [docs, setDocs] = useState<LocalVaultDoc[]>([]);
  const [index, setIndex] = useState<LocalVaultIndex | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  // REQ-049：编辑态（path + 草稿文本）。
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

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
    if (editingPath && target && (editingPath === target.name || editingPath.startsWith(target.name + '/'))) {
      setEditingPath(null);
      setEditingText('');
    }
  }, [buildAggregateIndex, selectedPath, editingPath]);

  // 卸载全部。
  const unmountAll = useCallback(async () => {
    await clearVaultHandle();
    setMounts([]);
    setDocs([]);
    setIndex(null);
    setFileCount(0);
    setSelectedPath(null);
    setQuery('');
    setEditingPath(null);
    setEditingText('');
  }, []);

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

  // ---- REQ-049 本地读写（仅本地文件系统写，不进服务端 / 不进 RAG）----

  const beginEdit = useCallback((path: string) => {
    const doc = docs.find((d) => d.path === path);
    setEditingPath(path);
    setEditingText(doc?.text ?? '');
  }, [docs]);

  /** 从 path 找所属挂载（含句柄与目录句柄映射）。 */
  const mountForPath = useCallback((path: string): VaultMount | null => {
    return mountsRef.current.find((m) => path === m.name || path.startsWith(m.name + '/')) ?? null;
  }, []);

  /** 取 path 的父目录句柄（所属挂载的 dirs 或根）。 */
  const parentHandleForPath = useCallback((path: string): FileSystemDirectoryHandle | null => {
    const mount = mountForPath(path);
    if (!mount) return null;
    // 相对挂载根的路径。
    const rel = path.startsWith(mount.name + '/') ? path.slice(mount.name.length + 1) : '';
    return parentDirectoryForPath(rel, mount.dirs, mount.handle);
  }, [mountForPath]);

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
        await buildMountIndex(mount.id, mount.handle);
      }
      setEditingPath(null);
      setEditingText('');
      setSelectedPath(editingPath);
    } catch (e) {
      setError(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [editingPath, editingText, docs, mountForPath, buildMountIndex]);

  const cancelEdit = useCallback(() => {
    setEditingPath(null);
    setEditingText('');
  }, []);

  /** 从目录句柄反查挂载 id（dirPath 为空 = 根目录新建）。 */
  const mountNameOf = useCallback((handle: FileSystemDirectoryHandle): string | null => {
    const mount = mountsRef.current.find((m) => m.handle === handle);
    return mount?.name ?? null;
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
        await buildMountIndex(mount.id, mount.handle);
      }
    } catch (e) {
      setError(`新建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [parentHandleForPath, mountForPath, buildMountIndex, mountNameOf]);

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
        await buildMountIndex(mount.id, mount.handle);
      }
    } catch (e) {
      setError(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [docs, parentHandleForPath, selectedPath, editingPath, cancelEdit, mountForPath, buildMountIndex]);

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
        await buildMountIndex(mount.id, mount.handle);
      }
    } catch (e) {
      setError(`重命名失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [docs, parentHandleForPath, selectedPath, mountForPath, buildMountIndex]);

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
    editingPath,
    editingText,
    beginEdit,
    setEditingText,
    saveEdit,
    cancelEdit,
    createFile,
    deleteFile,
    renameFile,
  };
}
