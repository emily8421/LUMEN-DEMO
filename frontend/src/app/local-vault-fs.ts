// 本地 Vault 文件系统访问层（浏览器 File System Access + 原生 IndexedDB）
// 移植自 RG-009 PoC：docs/research/prototypes/2026-08-05-rg009-vault-local-mount-poc.html §1-3
// 句柄持久化走原生 IndexedDB（FileSystemHandle 不可序列化，不能进 localStorage；前端首处 IDB 使用，零依赖）。
// 仅本地，不上传服务端（TC-P2-VAULT-001 ⑥）。

import type { LocalVaultDoc } from './local-vault-index';

/** 本地挂载索引 / 预览支持的文本扩展名（与 PoC IMPORTABLE 一致）。 */
export const VAULT_TEXT_EXTENSIONS = ['.md', '.markdown', '.txt'];

const IDB_NAME = 'lumen-demo-vault';
const IDB_STORE = 'handles';
const IDB_HANDLE_KEY = 'vault-root';

/** 文件名是否为本地可索引文本文件。 */
export function isVaultTextFile(name: string): boolean {
  const l = name.toLowerCase();
  return VAULT_TEXT_EXTENSIONS.some(ext => l.endsWith(ext));
}

/** 路径是否含隐藏段（`.obsidian` 等点开头目录 / 文件）。 */
export function hasHiddenSegment(path: string): boolean {
  return path.split('/').some(seg => seg.startsWith('.'));
}

/** 浏览器是否支持 File System Access API。 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

/** 浏览器是否可用 IndexedDB。 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/** 选择本地 vault / Markdown 文件夹目录（需 Chrome/Edge 经 http://localhost 访问）。 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('当前浏览器不支持 File System Access（需 Chrome/Edge 经 http://localhost 访问）');
  }
  return await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
}

// Chromium 扩展：FileSystemHandle.queryPermission / requestPermission（不在标准 lib.dom 类型）。
interface PermissionableHandle extends FileSystemHandle {
  queryPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

function asPermissionable(handle: FileSystemHandle): PermissionableHandle {
  return handle as unknown as PermissionableHandle;
}

/**
 * 授权校验：queryPermission → requestPermission。
 * readWrite=false 只读（模式 B 仅本地浏览 / 搜索，默认只读）。
 */
export async function verifyPermission(handle: FileSystemHandle, readWrite = false): Promise<boolean> {
  const opts = { mode: readWrite ? 'readwrite' : 'read' } as const;
  const h = asPermissionable(handle);
  if ((await h.queryPermission(opts)) === 'granted') return true;
  if ((await h.requestPermission(opts)) === 'granted') return true;
  return false;
}

/** walk 产出的文件项。 */
export interface WalkedFile {
  path: string;
  name: string;
  handle: FileSystemFileHandle;
}

// Chromium 扩展：FileSystemDirectoryHandle.values() 异步迭代器（TS 5.5 lib.dom 未声明）。
function directoryValues(dir: FileSystemDirectoryHandle): AsyncIterable<FileSystemHandle> {
  return (dir as unknown as { values(): AsyncIterable<FileSystemHandle> }).values();
}

/**
 * 递归遍历目录，收集可索引文本文件（过滤隐藏段 + 非白名单扩展）。
 * 返回 acc（便于累计）；onProgress 每 200 文件回调一次。
 * dirs（可选）：按「目录相对路径 → 目录句柄」填充，供增删改查定位父目录（REQ-049）。
 */
export async function walkVault(
  dirHandle: FileSystemDirectoryHandle,
  prefix: string,
  acc: WalkedFile[],
  onProgress?: (count: number) => void,
  dirs?: Map<string, FileSystemDirectoryHandle>,
): Promise<WalkedFile[]> {
  for await (const entry of directoryValues(dirHandle)) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      if (dirs) dirs.set(path, entry as FileSystemDirectoryHandle);
      await walkVault(entry as FileSystemDirectoryHandle, path, acc, onProgress, dirs);
    } else if (entry.kind === 'file' && isVaultTextFile(entry.name) && !hasHiddenSegment(path)) {
      acc.push({ path, name: entry.name, handle: entry as FileSystemFileHandle });
      if (onProgress && acc.length % 200 === 0) onProgress(acc.length);
    }
  }
  return acc;
}

// ---- 本地写路径（REQ-049：仅本地文件系统写，不进服务端 / 不进 RAG，硬天花板不变）----

/**
 * 授权校验：以 readwrite 模式授权（写操作必须，浏览器会弹授权）。
 * 必须在用户手势内调用（点击 / 右键等），否则 requestPermission 被拒。
 */
export async function ensureVaultWritePermission(handle: FileSystemFileHandle | FileSystemDirectoryHandle): Promise<boolean> {
  return verifyPermission(handle, true);
}

/** 覆盖写一篇本地文件（编辑保存）。调用前需 ensureVaultWritePermission。 */
export async function writeVaultFile(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

/** 在目录下新建一篇文本文件（name 含扩展名）。 */
export async function createVaultFile(
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  content: string,
): Promise<FileSystemFileHandle> {
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  await writeVaultFile(fileHandle, content);
  return fileHandle;
}

/** 删除目录下的一篇文件。 */
export async function deleteVaultFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<void> {
  await dirHandle.removeEntry(name);
}

/** 重命名目录下的一篇文件（newName 含扩展名）。 */
export async function renameVaultFile(
  dirHandle: FileSystemDirectoryHandle,
  oldName: string,
  newName: string,
): Promise<FileSystemFileHandle> {
  const fileHandle = await dirHandle.getFileHandle(oldName);
  // Chromium FileSystemFileHandle.move() 扩展（TS lib.dom 未声明）。
  await (fileHandle as unknown as { move: (name: string) => Promise<void> }).move(newName);
  return dirHandle.getFileHandle(newName);
}

/** 从路径取父目录句柄（目录集合 + vault 根）。路径不含目录段时返回 vault 根。 */
export function parentDirectoryForPath(
  path: string,
  dirs: Map<string, FileSystemDirectoryHandle>,
  rootHandle: FileSystemDirectoryHandle,
): FileSystemDirectoryHandle {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) {
    return rootHandle;
  }
  const parentPath = path.slice(0, lastSlash);
  return dirs.get(parentPath) ?? rootHandle;
}

/** 本地读取单篇文件内容，提取标题（首个 `# 标题`）与正文（不上传）。 */
export async function readVaultFile(walked: WalkedFile): Promise<LocalVaultDoc> {
  const titleFromName = walked.name.replace(/\.(md|markdown|txt)$/i, '');
  let title = titleFromName;
  let text = '';
  try {
    const file = await walked.handle.getFile();
    text = await file.text();
    const m = text.match(/^#\s+(.+)$/m);
    if (m) title = m[1].trim();
  } catch {
    // 单文件读取失败跳过正文，不影响整体索引
  }
  return { path: walked.path, name: walked.name, title, text, handle: walked.handle };
}

// ---- 原生 IndexedDB 句柄持久化（FileSystemDirectoryHandle 可结构化克隆）----

function openVaultIdb(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (!isIndexedDBAvailable()) { resolve(null); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

/** 把 vault 根句柄持久化到 IndexedDB（刷新后可恢复）。 */
export async function saveVaultHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const db = await openVaultIdb();
  if (!db) return false;
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, IDB_HANDLE_KEY);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}

/** 从 IndexedDB 读取已保存的 vault 根句柄（无则 null）。 */
export async function loadVaultHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openVaultIdb();
  if (!db) return null;
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const r = tx.objectStore(IDB_STORE).get(IDB_HANDLE_KEY);
    r.onsuccess = () => res((r.result as FileSystemDirectoryHandle | undefined) || null);
    r.onerror = () => res(null);
  });
}

/** 清除已保存的 vault 句柄（卸载挂载）。 */
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
 * 刷新后恢复挂载：从 IndexedDB 取句柄 → queryPermission。
 * - `granted`：自动恢复成功（RG-009 ① 决定性证据：刷新后无需重新授权），不弹授权框。
 * - `needs-auth`：句柄在但权限为 prompt / denied，需用户点「恢复」在手势内触发 requestPermission。
 * - `no-handle`：无已保存句柄。
 * autoRequestIfPrompt=true 时在 prompt 下尝试 requestPermission（必须在用户手势内调用）。
 */
export async function restoreVaultHandle(autoRequestIfPrompt = false): Promise<RestoreResult> {
  const handle = await loadVaultHandle();
  if (!handle) return { status: 'no-handle', handle: null, reason: '无已保存句柄' };
  try {
    const h = asPermissionable(handle);
    const q = await h.queryPermission({ mode: 'read' });
    if (q === 'granted') return { status: 'granted', handle, reason: 'granted' };
    if (autoRequestIfPrompt) {
      const r = await h.requestPermission({ mode: 'read' });
      if (r === 'granted') return { status: 'granted', handle, reason: 'granted' };
      return { status: 'needs-auth', handle, reason: r };
    }
    return { status: 'needs-auth', handle, reason: q };
  } catch {
    return { status: 'error', handle: null, reason: 'query 失败' };
  }
}
