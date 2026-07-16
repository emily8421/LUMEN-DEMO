import { downloadBlob } from './client';
import type { DownloadResult } from './client';

export async function downloadDocumentMarkdown(token: string, documentId: number): Promise<DownloadResult> {
  return downloadBlob(`/api/documents/${documentId}/export?format=md`, token, 'document.md');
}

export async function exportSpaceZip(token: string): Promise<DownloadResult> {
  return downloadBlob('/api/export/space?format=zip', token, 'lumen-space-export.zip');
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
