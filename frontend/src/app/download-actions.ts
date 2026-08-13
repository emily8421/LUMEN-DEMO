// 文档下载 / 导出动作（E4 拆分溯源：useDocuments.ts 拆分——下载组）。
import {
  downloadDocumentMarkdown,
  exportAndDownloadDocumentPdf,
  triggerBrowserDownload,
} from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type DownloadActionsArgs = {
  token: string | undefined;
  selectedDocument: { id: number } | null;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/** 生成文档下载 / PDF 导出动作（依赖 selectedDocument + runAction 包装）。 */
export function createDownloadActions({
  token,
  selectedDocument,
  runAction,
  setNotice,
}: DownloadActionsArgs) {
  const handleDownloadMarkdown = () => {
    if (!token || !selectedDocument) {
      return;
    }
    void runAction('正在下载文档...', async () => {
      const { blob, filename } = await downloadDocumentMarkdown(token, selectedDocument.id);
      triggerBrowserDownload(blob, filename);
      setNotice(`已下载：${filename}`);
    });
  };

  const handleExportPdf = () => {
    if (!token || !selectedDocument) {
      return;
    }
    void runAction('正在导出 PDF...', async () => {
      const { blob, filename } = await exportAndDownloadDocumentPdf(token, selectedDocument.id);
      triggerBrowserDownload(blob, filename);
      setNotice(`已下载 PDF：${filename}`);
    });
  };

  return { handleDownloadMarkdown, handleExportPdf };
}
