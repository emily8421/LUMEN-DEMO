import { useState } from 'react';
import { importBatchDocuments } from '../../api';
import type { DocumentPermission } from '../../api';
import type { LocalVaultDoc } from '../../app/local-vault-index';

// 本地挂载 → 导入为私有文档（个人知识，合理默认；用户可后续在文档详情改权限）。
const IMPORT_PERMISSION: DocumentPermission = 'private';

interface PendingImport {
  path: string;
  label: string;
  count: number;
}

/**
 * 本地挂载「按需导入到 LUMEN」编排（Slice E 从 LocalMountPane 抽出）。
 * 走 API-029 importBatchDocuments（保留目录结构）。单篇直接导入；文件夹 / 全部先弹确认条。
 * 导入是本地→服务端的唯一上行入口，状态（importing / importMsg / pendingImport）集中于此。
 */
export interface LocalMountImportApi {
  importing: boolean;
  importMsg: string;
  pendingImport: PendingImport | null;
  canImport: boolean;
  importSelected: (path?: string) => void;
  requestImportDir: (dirPath: string, label: string) => void;
  requestImportAll: () => void;
  confirmImport: () => void;
  cancelImport: () => void;
}

export function useLocalMountImport(
  token: string | undefined,
  docs: LocalVaultDoc[],
  selectedPath: string | null,
  hasMount: boolean,
  onImported: () => void,
): LocalMountImportApi {
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const canImport = hasMount && !!token && !importing;

  async function importDocs(docsToImport: LocalVaultDoc[], label: string) {
    if (!token || importing) return;
    setImporting(true);
    setImportMsg(`正在导入${label}…`);
    try {
      const files = [];
      for (const doc of docsToImport) {
        files.push({ file: await doc.handle.getFile(), relativePath: doc.path });
      }
      const result = await importBatchDocuments(
        token,
        { files, permission: IMPORT_PERMISSION, preserveStructure: true },
        (done, total) => setImportMsg(`正在导入${label}… ${done}/${total}`),
      );
      setImportMsg(
        `导入完成（已入上层 DB，保留目录结构，可在文档视图查看）：成功 ${result.success_count} / 失败 ${result.failed_count} / 跳过 ${result.skipped_count}`,
      );
      if (result.success_count > 0) onImported();
    } catch (e) {
      setImportMsg('导入失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setImporting(false);
      setPendingImport(null);
    }
  }

  const subtreeDocs = (dirPath: string) =>
    docs.filter((d) => d.path === dirPath || d.path.startsWith(dirPath + '/'));

  /** 导入单篇（path 缺省时用全局选中）。 */
  const importSelected = (path?: string) => {
    const targetPath = path ?? selectedPath;
    if (!targetPath) return;
    const doc = docs.find((d) => d.path === targetPath);
    if (doc) void importDocs([doc], '此篇');
  };

  const requestImportDir = (dirPath: string, label: string) => {
    if (!canImport) return;
    const docsToImport = subtreeDocs(dirPath);
    if (docsToImport.length === 0) return;
    if (docsToImport.length === 1) {
      void importDocs(docsToImport, label);
    } else {
      setPendingImport({ path: dirPath, label, count: docsToImport.length });
    }
  };

  const requestImportAll = () => {
    if (!canImport || docs.length === 0) return;
    setPendingImport({ path: '', label: '全部挂载', count: docs.length });
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const { path, label } = pendingImport;
    const docsToImport = path === '' ? docs : subtreeDocs(path);
    void importDocs(docsToImport, label);
  };

  const cancelImport = () => setPendingImport(null);

  return {
    importing,
    importMsg,
    pendingImport,
    canImport,
    importSelected,
    requestImportDir,
    requestImportAll,
    confirmImport,
    cancelImport,
  };
}
