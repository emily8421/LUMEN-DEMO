import type { ImportFileSelection } from '../app/types';

/** File 附带 webkitRelativePath（文件夹 input 提供相对路径）。 */
type FileWithRelativePath = File & { webkitRelativePath?: string };

/** 文件系统条目（浏览器 File System Access 拖拽收集的最小形状）。 */
type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath?: string;
  file?: (successCallback: (file: File) => void, errorCallback?: () => void) => void;
  createReader?: () => {
    readEntries: (
      successCallback: (entries: FileSystemEntryLike[]) => void,
      errorCallback?: () => void,
    ) => void;
  };
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

function fileToSelection(file: File): ImportFileSelection {
  const relativePath = (file as FileWithRelativePath).webkitRelativePath || file.name;
  return { file, relativePath: normalizeImportPath(relativePath) };
}

const IMPORTABLE_EXTENSIONS = ['.md', '.markdown', '.txt'];

/**
 * 过滤掉 Obsidian vault 导入不应上传的文件：隐藏文件 / 目录（路径任一段以 `.` 开头，
 * 含 `.obsidian` 元目录、`.DS_Store` 等）与非白名单附件（后端仅接受 .md/.markdown/.txt，
 * 其余会被拒并记为 failed 噪音）。三个文件入口（单文件 / 文件夹 input、拖拽）统一调用。
 */
function filterImportable(selections: ImportFileSelection[]): ImportFileSelection[] {
  return selections.filter((selection) => {
    const isHiddenSegment = selection.relativePath
      .split('/')
      .some((segment) => segment.startsWith('.'));
    if (isHiddenSegment) {
      return false;
    }
    const lowerPath = selection.relativePath.toLowerCase();
    return IMPORTABLE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
  });
}

export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<ImportFileSelection[]> {
  const entries: FileSystemEntryLike[] = [];
  Array.from(dataTransfer.items).forEach((item) => {
    const entry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.() as FileSystemEntryLike | null | undefined;
    if (entry) {
      entries.push(entry);
    }
  });

  if (entries.length === 0) {
    return filterImportable(Array.from(dataTransfer.files).map(fileToSelection));
  }

  const nestedFiles = await Promise.all(entries.map(readEntryFiles));
  return filterImportable(nestedFiles.flat());
}

async function readEntryFiles(entry: FileSystemEntryLike): Promise<ImportFileSelection[]> {
  if (entry.isFile) {
    return readFileEntry(entry);
  }
  if (entry.isDirectory) {
    return readDirectoryEntry(entry);
  }
  return [];
}

function readFileEntry(entry: FileSystemEntryLike): Promise<ImportFileSelection[]> {
  return new Promise((resolve) => {
    if (!entry.file) {
      resolve([]);
      return;
    }

    entry.file(
      (file) => resolve([{ file, relativePath: normalizeImportPath(entry.fullPath || file.name) }]),
      () => resolve([]),
    );
  });
}

function readDirectoryEntry(entry: FileSystemEntryLike): Promise<ImportFileSelection[]> {
  const reader = entry.createReader?.();
  if (!reader) {
    return Promise.resolve([]);
  }

  const entries: FileSystemEntryLike[] = [];
  return new Promise((resolve) => {
    const readBatch = () => {
      reader.readEntries(
        async (batch) => {
          if (batch.length === 0) {
            const nestedFiles = await Promise.all(entries.map(readEntryFiles));
            resolve(nestedFiles.flat());
            return;
          }
          entries.push(...batch);
          readBatch();
        },
        () => resolve([]),
      );
    };

    readBatch();
  });
}

function normalizeImportPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
}

/**
 * FileList → 可导入选择（隐藏 / 非白名单过滤）。单文件 input 与文件夹选择入口统一调用。
 * E4 Slice D 从 ImportFeature 抽出（消除 drop-zone 与文件夹选择两处重复映射）。
 */
export function fileListToSelections(fileList: FileList): ImportFileSelection[] {
  return filterImportable(Array.from(fileList).map(fileToSelection));
}
