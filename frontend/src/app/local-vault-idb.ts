// 本地 Vault 文件系统访问层——原生 IndexedDB 句柄持久化（E4 拆分溯源：local-vault-fs.ts 拆分 3 文件之一）。
// 句柄持久化走原生 IndexedDB（FileSystemHandle 不可序列化，不能进 localStorage；前端首处 IDB 使用，零依赖）。
// 多挂载（REQ-049 增强）：IDB 存「句柄数组」，支持同时挂载多个本地目录。

const IDB_NAME = 'lumen-demo-vault';
const IDB_STORE = 'handles';
const IDB_HANDLE_KEY = 'vault-root';

/** 浏览器是否可用 IndexedDB。 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openVaultIdb(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (!isIndexedDBAvailable()) { resolve(null); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

// Chromium 扩展：FileSystemHandle.queryPermission / requestPermission（不在标准 lib.dom 类型）。
interface PermissionableHandle extends FileSystemHandle {
  queryPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

export function asPermissionable(handle: FileSystemHandle): PermissionableHandle {
  return handle as unknown as PermissionableHandle;
}

/** 把 vault 根句柄追加持久化到 IndexedDB（刷新后可恢复；重复目录跳过）。 */
export async function saveVaultHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const db = await openVaultIdb();
  if (!db) return false;
  const existing = await loadVaultHandles();
  if (existing.some((h) => h.name === handle.name)) {
    return true;
  }
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put([...existing, handle], IDB_HANDLE_KEY);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}

/** 从 IndexedDB 读取已保存的全部 vault 根句柄（无则 []）。兼容旧单句柄值。 */
export async function loadVaultHandles(): Promise<FileSystemDirectoryHandle[]> {
  const db = await openVaultIdb();
  if (!db) return [];
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const r = tx.objectStore(IDB_STORE).get(IDB_HANDLE_KEY);
    r.onsuccess = () => {
      const value = r.result;
      if (Array.isArray(value)) {
        res(value as FileSystemDirectoryHandle[]);
      } else if (value) {
        // 兼容旧版：单个句柄升级为数组（下次保存时写回数组）。
        res([value as FileSystemDirectoryHandle]);
      } else {
        res([]);
      }
    };
    r.onerror = () => res([]);
  });
}

/** 移除一个已保存的 vault 句柄（卸载单个挂载）。 */
export async function removeVaultHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const existing = await loadVaultHandles();
  const remaining = existing.filter((h) => h.name !== handle.name);
  if (remaining.length === existing.length) {
    return true;
  }
  const db = await openVaultIdb();
  if (!db) return false;
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    if (remaining.length === 0) {
      tx.objectStore(IDB_STORE).delete(IDB_HANDLE_KEY);
    } else {
      tx.objectStore(IDB_STORE).put(remaining, IDB_HANDLE_KEY);
    }
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}

/** 清除全部已保存的 vault 句柄（卸载全部挂载）。 */
export async function clearVaultHandle(): Promise<boolean> {
  const db = await openVaultIdb();
  if (!db) return false;
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_HANDLE_KEY);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}

export type RestoreStatus = 'granted' | 'needs-auth' | 'no-handle' | 'error';

export interface RestoreResult {
  status: RestoreStatus;
  handle: FileSystemDirectoryHandle | null;
  /** 透视原因（granted / prompt / denied / 无句柄 / query 失败），供 UI 展示。 */
  reason: string;
}

/**
 * 刷新后恢复全部挂载：从 IndexedDB 取全部句柄 → 逐个 queryPermission。
 * 返回每条结果；granted 的由调用方 buildIndex，needs-auth 的留待用户手势内 reauth。
 * autoRequestIfPrompt=true 时在 prompt 下尝试 requestPermission（必须在用户手势内调用）。
 */
export async function restoreVaultHandles(autoRequestIfPrompt = false): Promise<RestoreResult[]> {
  const handles = await loadVaultHandles();
  if (handles.length === 0) {
    return [{ status: 'no-handle', handle: null, reason: '无已保存句柄' }];
  }
  const results: RestoreResult[] = [];
  for (const handle of handles) {
    try {
      const h = asPermissionable(handle);
      const q = await h.queryPermission({ mode: 'read' });
      if (q === 'granted') {
        results.push({ status: 'granted', handle, reason: 'granted' });
      } else if (autoRequestIfPrompt) {
        const r = await h.requestPermission({ mode: 'read' });
        if (r === 'granted') {
          results.push({ status: 'granted', handle, reason: 'granted' });
        } else {
          results.push({ status: 'needs-auth', handle, reason: r });
        }
      } else {
        results.push({ status: 'needs-auth', handle, reason: q });
      }
    } catch {
      results.push({ status: 'error', handle, reason: 'query 失败' });
    }
  }
  return results;
}

/** 兼容旧调用：恢复单个挂载（取首个句柄）。 */
export async function restoreVaultHandle(autoRequestIfPrompt = false): Promise<RestoreResult> {
  const results = await restoreVaultHandles(autoRequestIfPrompt);
  return results[0];
}
