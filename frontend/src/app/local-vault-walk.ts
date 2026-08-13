// 本地 Vault 文件系统访问层——目录选择 + 递归遍历（E4 拆分溯源：local-vault-fs.ts 拆分 3 文件之一）。
// 移植自 RG-009 PoC：docs/research/prototypes/2026-08-05-rg009-vault-local-mount-poc.html §1-3。
// 仅本地，不上传服务端（TC-P2-VAULT-001 ⑥）。

/** 本地挂载索引 / 预览支持的文本扩展名（与 PoC IMPORTABLE 一致）。 */
export const VAULT_TEXT_EXTENSIONS = ['.md', '.markdown', '.txt'];

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

/** 选择本地 vault / Markdown 文件夹目录（需 Chrome/Edge 经 http://localhost 访问）。 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('当前浏览器不支持 File System Access（需 Chrome/Edge 经 http://localhost 访问）');
  }
  return await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
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
