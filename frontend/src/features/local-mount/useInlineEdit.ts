import { useState } from 'react';

/**
 * 本地挂载目录「新建文件」+ 文件「重命名」的内联编辑态（Slice E 从 LocalMountTreeView 抽出）。
 * inputValue 共用；creatingFileIn / renamingPath 互斥标识当前编辑目标；commitInline 按目标派发创建或重命名。
 */
export function useInlineEdit(
  onCreateFile: (dirPath: string, name: string, content: string) => Promise<void>,
  onRenameFile: (path: string, newName: string) => Promise<void>,
) {
  const [creatingFileIn, setCreatingFileIn] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  function commitInline() {
    const name = inputValue.trim();
    if (!name) {
      setCreatingFileIn(null);
      setRenamingPath(null);
      setInputValue('');
      return;
    }
    if (creatingFileIn !== null) {
      void onCreateFile(creatingFileIn, name, '');
    } else if (renamingPath !== null) {
      void onRenameFile(renamingPath, name);
    }
    setCreatingFileIn(null);
    setRenamingPath(null);
    setInputValue('');
  }

  return { creatingFileIn, setCreatingFileIn, renamingPath, setRenamingPath, inputValue, setInputValue, commitInline };
}
