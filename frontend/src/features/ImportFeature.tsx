import { useEffect } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import type { DocumentPermission, ImportBatchItem } from '../api';
import type { ImportDraft, ImportFileSelection } from '../app/types';
import { permissionLabels } from '../app/constants';
import { fileListToSelections } from './import-files';
import { ImportDropZone } from './import/ImportDropZone';
import { ImportResultsList } from './import/ImportResultsList';

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

/**
 * 批量导入弹窗（.md / .txt 文件或文件夹拖拽 / 选择 → 权限 → 批量导入）。
 * E4 Slice D 拆分：拖拽/文件选择区 → import/ImportDropZone、结果列表 → import/ImportResultsList、
 * 文件收集纯工具 → import-files；本组件保留弹窗壳与表单编排。
 */
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

    onImportFilesChange(fileListToSelections(fileList));
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
            <ImportDropZone
              isBusy={isBusy}
              importInputKey={importInputKey}
              selectedFileLabel={selectedFileLabel}
              onFilesSelected={onImportFilesChange}
            />
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
          <ImportResultsList items={lastImportItems} />
        </div>
      </section>
    </div>
  );
}
