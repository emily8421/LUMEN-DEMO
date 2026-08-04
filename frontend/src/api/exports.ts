import { downloadBlob, request } from './client';
import type { DownloadResult } from './client';

export type PdfExportStatus = 'queued' | 'running' | 'done' | 'failed';

export type PdfExportResponse = {
  export_id: number;
  status: PdfExportStatus;
  artifact_path?: string | null;
};

export async function downloadDocumentMarkdown(token: string, documentId: number): Promise<DownloadResult> {
  return downloadBlob(`/api/documents/${documentId}/export?format=md`, token, 'document.md');
}

export async function exportSpaceZip(token: string): Promise<DownloadResult> {
  return downloadBlob('/api/export/space?format=zip', token, 'lumen-space-export.zip');
}

export async function exportDocumentPdf(token: string, documentId: number, versionNo?: number): Promise<PdfExportResponse> {
  return request<PdfExportResponse>('/api/export-pdf', {
    method: 'POST',
    token,
    body: JSON.stringify({
      document_id: documentId,
      version_no: versionNo ?? null,
      options: {
        include_sources: false,
        theme: 'default',
      },
    }),
  });
}

export async function downloadPdfExport(token: string, exportId: number): Promise<DownloadResult> {
  return downloadBlob(`/api/export-pdf/${exportId}/download`, token, 'document.pdf');
}

export async function exportAndDownloadDocumentPdf(
  token: string,
  documentId: number,
  versionNo?: number,
): Promise<DownloadResult> {
  const result = await exportDocumentPdf(token, documentId, versionNo);
  if (result.status !== 'done') {
    throw new Error(`PDF 导出任务 ${result.export_id} 尚未完成：${result.status}`);
  }
  return downloadPdfExport(token, result.export_id);
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
