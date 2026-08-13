// 本地 Vault 文件系统访问层——授权校验 + 读写单文件（E4 拆分溯源：local-vault-fs.ts 拆分 3 文件之一）。
// 目录选择 / 遍历在 local-vault-walk.ts；IndexedDB 句柄持久化在 local-vault-idb.ts。
// 仅本地，不上传服务端（TC-P2-VAULT-001 ⑥）。

import type { LocalVaultDoc } from './local-vault-index';
import { asPermissionable } from './local-vault-idb';
import type { WalkedFile } from './local-vault-walk';

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
