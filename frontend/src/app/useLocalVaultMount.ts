// 本地 Vault 挂载编排 hook（REQ-018 模式 B）
// 编排 task-031 数据层：pick→verify→存句柄→walk→读内容→倒排索引；页面加载无感恢复；本地搜索 / 预览。
// 挂载元信息为运行时状态（从 handle + 索引重建），不另建 localStorage store（避免冗余）；句柄走 local-vault-fs 的 IndexedDB。

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
  renameVaultFile,
  restoreVaultHandle,
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
  status: LocalMountStatus;
  mountName: string;
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
  reauth: () => Promise<void>;
  reindex: () => Promise<void>;
  unmount: () => Promise<void>;
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

export function useLocalVaultMount(): UseLocalVaultMount {
  const [status, setStatus] = useState<LocalMountStatus>(
    isFileSystemAccessSupported() ? 'idle' : 'unsupported'
  );
  const [mountName, setMountName] = useState('');
  const [docs, setDocs] = useState<LocalVaultDoc[]>([]);
  const [index, setIndex] = useState<LocalVaultIndex | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  // REQ-049：编辑态（path + 草稿文本）。
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleRef = useRef<FileSystemDirectoryHandle | null>(null);
  // REQ-049：目录相对路径 → 目录句柄（增删改查定位父目录）；随 buildIndex 重建。
  const dirsRef = useRef<Map<string, FileSystemDirectoryHandle>>(new Map());

  // 构建索引：walk → 读内容 → buildInvertedIndex（PoC buildIndex 同构）
  const buildIndex = useCallback(async (handle: FileSystemDirectoryHandle, name: string) => {
    setStatus('mounting');
    setMountName(name);
    setFileCount(0);
    const files: WalkedFile[] = [];
    const dirs = new Map<string, FileSystemDirectoryHandle>();
    await walkVault(handle, '', files, (n) => setFileCount(n), dirs);
    const newDocs: LocalVaultDoc[] = [];
    for (const f of files) {
      newDocs.push(await readVaultFile(f));
      if (newDocs.length % 200 === 0) setFileCount(newDocs.length);
    }
    setDocs(newDocs);
    setIndex(buildInvertedIndex(newDocs));
    setFileCount(newDocs.length);
    handleRef.current = handle;
    dirsRef.current = dirs;
    setStatus('mounted');
  }, []);

  // 页面加载：尝试无感恢复（queryPermission→granted，RG-009 ① 决定性证据）
  useEffect(() => {
    if (!isFileSystemAccessSupported()) return;
    let cancelled = false;
    void (async () => {
      const result = await restoreVaultHandle(false);
      if (cancelled) return;
      if (result.status === 'granted' && result.handle) {
        await buildIndex(result.handle, result.handle.name);
      } else if (result.status === 'needs-auth') {
        setStatus('needs-auth');
        if (result.handle) {
          handleRef.current = result.handle;
          setMountName(result.handle.name);
        }
      }
      // no-handle → 保持 idle
    })();
    return () => {
      cancelled = true;
    };
  }, [buildIndex]);

  // 挂载：选目录 → 授权 → 存句柄 → 建索引
  const mount = useCallback(async () => {
    setError('');
    try {
      const handle = await pickDirectory();
      if (!(await verifyPermission(handle, false))) {
        setError('授权被拒');
        setStatus('needs-auth');
        return;
      }
      await saveVaultHandle(handle);
      await buildIndex(handle, handle.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [buildIndex]);

  // 重新授权（在用户手势内调用 requestPermission）
  const reauth = useCallback(async () => {
    setError('');
    const result = await restoreVaultHandle(true);
    if (result.status === 'granted' && result.handle) {
      await buildIndex(result.handle, result.handle.name);
    } else {
      setError('重新授权失败：' + result.reason);
      setStatus('needs-auth');
    }
  }, [buildIndex]);

  // 重扫（手动增量，FileSystemObserver 留后续）
  const reindex = useCallback(async () => {
    if (!handleRef.current) return;
    await buildIndex(handleRef.current, mountName || handleRef.current.name);
  }, [buildIndex, mountName]);

  // 卸载
  const unmount = useCallback(async () => {
    await clearVaultHandle();
    handleRef.current = null;
    dirsRef.current = new Map();
    setDocs([]);
    setIndex(null);
    setMountName('');
    setFileCount(0);
    setSelectedPath(null);
    setQuery('');
    setEditingPath(null);
    setEditingText('');
    setStatus('idle');
  }, []);

  // 本地搜索
  const hits = useMemo(
    () => (index && query.trim() ? searchIndex(index, query) : []),
    [index, query]
  );

  // 本地预览（本地读取，不上传）
  const previewText = useMemo(() => {
    if (!selectedPath) return '';
    return docs.find((d) => d.path === selectedPath)?.text ?? '';
  }, [docs, selectedPath]);

  const openDoc = useCallback((path: string) => setSelectedPath(path), []);

  // ---- REQ-049 本地读写（仅本地文件系统写，不进服务端 / 不进 RAG）----

  /** 进入编辑态：从 docs 取当前文本作草稿。 */
  const beginEdit = useCallback((path: string) => {
    const doc = docs.find((d) => d.path === path);
    setEditingPath(path);
    setEditingText(doc?.text ?? '');
  }, [docs]);

  /** 保存编辑：readwrite 授权 → 覆盖写 → 重建索引 → 退出编辑态。 */
  const saveEdit = useCallback(async () => {
    if (!editingPath || !handleRef.current) return;
    const doc = docs.find((d) => d.path === editingPath);
    if (!doc) return;
    const ok = await ensureVaultWritePermission(doc.handle);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      setStatus('needs-auth');
      return;
    }
    try {
      await writeVaultFile(doc.handle, editingText);
      await buildIndex(handleRef.current, mountName || handleRef.current.name);
      setEditingPath(null);
      setEditingText('');
      setSelectedPath(editingPath);
    } catch (e) {
      setError(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [editingPath, editingText, docs, handleRef, mountName, buildIndex]);

  const cancelEdit = useCallback(() => {
    setEditingPath(null);
    setEditingText('');
  }, []);

  /** 新建文件：父目录 readwrite 授权 → createVaultFile → 重建索引。 */
  const createFile = useCallback(async (dirPath: string, name: string, content: string) => {
    if (!handleRef.current || !name.trim()) return;
    const parent = parentDirectoryForPath(dirPath, dirsRef.current, handleRef.current);
    const ok = await ensureVaultWritePermission(parent);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      setStatus('needs-auth');
      return;
    }
    try {
      await createVaultFile(parent, name.trim(), content);
      await buildIndex(handleRef.current, mountName || handleRef.current.name);
    } catch (e) {
      setError(`新建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [handleRef, mountName, buildIndex]);

  /** 删除文件：父目录 readwrite 授权 → deleteVaultFile → 重建索引。 */
  const deleteFile = useCallback(async (path: string) => {
    if (!handleRef.current) return;
    const doc = docs.find((d) => d.path === path);
    if (!doc) return;
    const parent = parentDirectoryForPath(path, dirsRef.current, handleRef.current);
    const ok = await ensureVaultWritePermission(parent);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      setStatus('needs-auth');
      return;
    }
    try {
      await deleteVaultFile(parent, doc.name);
      if (selectedPath === path) setSelectedPath(null);
      if (editingPath === path) cancelEdit();
      await buildIndex(handleRef.current, mountName || handleRef.current.name);
    } catch (e) {
      setError(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [handleRef, docs, selectedPath, editingPath, cancelEdit, mountName, buildIndex]);

  /** 重命名文件：父目录 readwrite 授权 → renameVaultFile → 重建索引。 */
  const renameFile = useCallback(async (path: string, newName: string) => {
    if (!handleRef.current || !newName.trim()) return;
    const doc = docs.find((d) => d.path === path);
    if (!doc) return;
    const parent = parentDirectoryForPath(path, dirsRef.current, handleRef.current);
    const ok = await ensureVaultWritePermission(parent);
    if (!ok) {
      setError('写入授权被拒，请重新授权（readwrite）后重试。');
      setStatus('needs-auth');
      return;
    }
    try {
      const dirPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      const newPath = dirPath ? `${dirPath}/${newName.trim()}` : newName.trim();
      await renameVaultFile(parent, doc.name, newName.trim());
      if (selectedPath === path) setSelectedPath(newPath);
      await buildIndex(handleRef.current, mountName || handleRef.current.name);
    } catch (e) {
      setError(`重命名失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [handleRef, docs, selectedPath, mountName, buildIndex]);

  return {
    status,
    mountName,
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
