// 本地 Vault 挂载编排 hook（REQ-018 模式 B）
// 编排 task-031 数据层：pick→verify→存句柄→walk→读内容→倒排索引；页面加载无感恢复；本地搜索 / 预览。
// 挂载元信息为运行时状态（从 handle + 索引重建），不另建 localStorage store（避免冗余）；句柄走 local-vault-fs 的 IndexedDB。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearVaultHandle,
  isFileSystemAccessSupported,
  pickDirectory,
  readVaultFile,
  restoreVaultHandle,
  saveVaultHandle,
  verifyPermission,
  walkVault,
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
  children: Map<string, LocalMountTreeNode>;
  files: { name: string; doc: LocalVaultDoc }[];
}

/** 由 docs 路径聚合目录树（自动排除隐藏目录文件，已在 walk 阶段过滤）。 */
export function buildLocalMountTree(docs: LocalVaultDoc[]): LocalMountTreeNode {
  const root: LocalMountTreeNode = { name: '', children: new Map(), files: [] };
  for (const doc of docs) {
    const parts = doc.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      let child = node.children.get(key);
      if (!child) {
        child = { name: key, children: new Map(), files: [] };
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

  const handleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // 构建索引：walk → 读内容 → buildInvertedIndex（PoC buildIndex 同构）
  const buildIndex = useCallback(async (handle: FileSystemDirectoryHandle, name: string) => {
    setStatus('mounting');
    setMountName(name);
    setFileCount(0);
    const files: WalkedFile[] = [];
    await walkVault(handle, '', files, (n) => setFileCount(n));
    const newDocs: LocalVaultDoc[] = [];
    for (const f of files) {
      newDocs.push(await readVaultFile(f));
      if (newDocs.length % 200 === 0) setFileCount(newDocs.length);
    }
    setDocs(newDocs);
    setIndex(buildInvertedIndex(newDocs));
    setFileCount(newDocs.length);
    handleRef.current = handle;
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
    setDocs([]);
    setIndex(null);
    setMountName('');
    setFileCount(0);
    setSelectedPath(null);
    setQuery('');
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
  };
}
