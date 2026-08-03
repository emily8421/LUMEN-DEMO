import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ImportDraft, ImportFileSelection } from './types';
import type { DocumentPermission, ImportBatchItem } from '../api';
import { importBatchDocuments } from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseImportArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
  /** 导入完成后的跨域副作用：refresh 文档列表 / 选首个文档 / 切视图 / 重置搜索问答。 */
  onImported: (firstDocId: number | null) => Promise<void> | void;
};

const emptyImportDraft: ImportDraft = { permission: 'team' as DocumentPermission };

/**
 * 批量导入 state + handler（Sprint-16，REQ-037）。
 *
 * 抽成独立 hook，给 App() 减压（APP-SIZE-C-011）。封装导入草稿 / 文件选择 / 输入 key /
 * 最近摘要与逐条结果 + handleImport。导入完成后的跨域副作用（refresh 工作区、选首个文档、
 * 切到文档视图、重置搜索 / 问答）经 onImported 回调交回 App，避免本 hook 跨域持有 setter。
 *
 * 写操作经 App 注入的 runAction 包装，错误处理（含登录失效）与全局 isBusy / notice 一致。
 */
export function useImport({ token, runAction, setNotice, onImported }: UseImportArgs) {
  const [importDraft, setImportDraft] = useState<ImportDraft>(emptyImportDraft);
  const [importFiles, setImportFiles] = useState<ImportFileSelection[]>([]);
  const [importInputKey, setImportInputKey] = useState(0);
  const [lastImportSummary, setLastImportSummary] = useState('');
  const [lastImportItems, setLastImportItems] = useState<ImportBatchItem[]>([]);

  const handleImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || importFiles.length === 0) {
      return;
    }
    void runAction(`正在批量导入 ${importFiles.length} 个文本...`, async () => {
      const result = await importBatchDocuments(token, {
        files: importFiles,
        permission: importDraft.permission,
        preserveStructure: true,
      });
      const firstDocId = result.items.find((item) => item.parsed_doc_id != null)?.parsed_doc_id ?? null;
      setImportDraft(emptyImportDraft);
      setImportFiles([]);
      setLastImportItems(result.items);
      setImportInputKey((currentKey) => currentKey + 1);
      const summary = `批量导入完成：成功 ${result.success_count}，失败 ${result.failed_count}，跳过 ${result.skipped_count}`;
      setLastImportSummary(summary);
      setNotice(summary);
      await onImported(firstDocId);
    });
  };

  return {
    importDraft,
    setImportDraft,
    importFiles,
    setImportFiles,
    importInputKey,
    lastImportSummary,
    lastImportItems,
    handleImport,
  };
}
