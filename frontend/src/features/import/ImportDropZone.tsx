import type { DragEvent } from 'react';
import type { ImportFileSelection } from '../../app/types';
import { collectDroppedFiles, fileListToSelections } from '../import-files';

type ImportDropZoneProps = {
  isBusy: boolean;
  importInputKey: number;
  selectedFileLabel: string;
  onFilesSelected: (files: ImportFileSelection[]) => void;
};

/**
 * 导入弹窗拖拽 / 文件选择区：支持拖拽文件或文件夹（递归收集）+ 单文件 input。
 * E4 Slice D 从 ImportFeature 抽出为组件，文件收集逻辑用共享 import-files。
 */
export function ImportDropZone({
  isBusy,
  importInputKey,
  selectedFileLabel,
  onFilesSelected,
}: ImportDropZoneProps) {
  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const droppedFiles = await collectDroppedFiles(event.dataTransfer);
    onFilesSelected(droppedFiles);
  }

  return (
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
        onChange={(event) => {
          const fileList = event.target.files;
          if (fileList) {
            onFilesSelected(fileListToSelections(fileList));
          }
        }}
      />
    </label>
  );
}
