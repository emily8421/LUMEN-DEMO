// 本地挂载类型定义（E4 拆分溯源：useLocalVaultMount.ts 拆分——类型 + mountSeq）。
import type { LocalVaultDoc } from './local-vault-index';
import type { LocalVaultIndex, LocalVaultSearchHit } from './local-vault-index';

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
