import { useEffect } from 'react';
import type { DragEvent, FormEvent, MouseEvent } from 'react';
import type { DocumentPermission, ImportBatchItem } from '../api';
import type { ImportDraft, ImportFileSelection } from '../app/types';
import { permissionLabels } from '../app/constants';

type ImportFeatureProps = {
  isOpen: boolean;
  isBusy: boolean;
  importDraft: ImportDraft;
  onImportDraftChange: (draft: ImportDraft) => void;
  importFiles: ImportFileSelection[];
  onImportFilesChange: (files: ImportFileSelection[]) => void;
  importInputKey: number;
  lastImportSummary: string;
  lastImportItems: ImportBatchItem[];
  onImport: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function ImportFeature({
  isOpen,
  isBusy,
  importDraft,
  onImportDraftChange,
  importFiles,
  onImportFilesChange,
  importInputKey,
  lastImportSummary,
  lastImportItems,
  onImport,
  onClose,
}: ImportFeatureProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function selectFiles(fileList: FileList | null) {
    if (!fileList) {
      onImportFilesChange([]);
      return;
    }

    onImportFilesChange(Array.from(fileList).map(fileToSelection));
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const droppedFiles = await collectDroppedFiles(event.dataTransfer);
    onImportFilesChange(droppedFiles);
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || isBusy) {
      return;
    }
    onClose();
  }

  const selectedFileLabel = importFiles.length === 0
    ? '尚未选择文件'
    : importFiles.length === 1
      ? importFiles[0].relativePath
      : `已选择 ${importFiles.length} 个文件`;

  return (
    <div className="import-modal-overlay" onClick={handleOverlayClick}>
      <section
        className="import-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="import-modal-header">
          <div className="view-title">
            <p className="eyebrow">REQ-037</p>
            <h2 id="import-modal-title">批量导入文本</h2>
          </div>
          <button
            type="button"
            className="chip-remove import-modal-close"
            aria-label="关闭导入弹窗"
            onClick={onClose}
            disabled={isBusy}
          >
            ×
          </button>
        </header>

        <div className="import-modal-body">
          <form className="compact-form import-modal-form" onSubmit={onImport}>
            <label
              className="drop-zone import-drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <strong>拖拽文件或文件夹到这里</strong>
              <span>{selectedFileLabel}</span>
              <input
                key={importInputKey}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                multiple
                disabled={isBusy}
                onChange={(event) => selectFiles(event.target.files)}
              />
            </label>
            <label className="folder-picker import-folder-picker">
              选择文件夹
              <input
                key={`folder-${importInputKey}`}
                type="file"
                multiple
                accept=".md,.txt,text/markdown,text/plain"
                disabled={isBusy}
                ref={(input) => {
                  input?.setAttribute('webkitdirectory', '');
                  input?.setAttribute('directory', '');
                }}
                onChange={(event) => selectFiles(event.target.files)}
              />
            </label>
            <label>
              权限
              <select
                value={importDraft.permission}
                disabled={isBusy}
                onChange={(event) => onImportDraftChange({ ...importDraft, permission: event.target.value as DocumentPermission })}
              >
                {Object.entries(permissionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            {importFiles.length > 0 ? (
              <ul className="import-file-list">
                {importFiles.slice(0, 4).map((item) => (
                  <li key={`${item.relativePath}-${item.file.size}`}>{item.relativePath}</li>
                ))}
                {importFiles.length > 4 ? <li>还有 {importFiles.length - 4} 个文件...</li> : null}
              </ul>
            ) : null}
            <button type="submit" disabled={isBusy || importFiles.length === 0}>批量导入</button>
          </form>
          {lastImportSummary ? <p className="import-summary">{lastImportSummary}</p> : null}
          {lastImportItems.length > 0 ? (
            <ul className="import-result-list">
              {lastImportItems.map((item) => (
                <li key={`${item.relative_path}-${item.status}-${item.parsed_doc_id ?? item.error ?? ''}`} className={`import-result-${item.status}`}>
                  <strong>{item.title}</strong>
                  <span>{item.status === 'done' ? `成功 · ${item.chunk_count} chunks` : `${item.status === 'skipped' ? '跳过' : '失败'} · ${item.error ?? '未知原因'}`}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type FileWithRelativePath = File & { webkitRelativePath?: string };

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

async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<ImportFileSelection[]> {
  const entries: FileSystemEntryLike[] = [];
  Array.from(dataTransfer.items).forEach((item) => {
    const entry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.() as FileSystemEntryLike | null | undefined;
    if (entry) {
      entries.push(entry);
    }
  });

  if (entries.length === 0) {
    return Array.from(dataTransfer.files).map(fileToSelection);
  }

  const nestedFiles = await Promise.all(entries.map(readEntryFiles));
  return nestedFiles.flat();
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
