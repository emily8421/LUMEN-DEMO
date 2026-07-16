import type { DocumentPermission } from './documents';
import { request } from './client';

export type ImportResponse = {
  import_id: number;
  status: string;
  parsed_doc_id: number;
  chunk_count: number;
  mode: string;
};

export type ImportBatchItem = {
  filename: string;
  relative_path: string;
  title: string;
  status: 'done' | 'failed' | 'skipped';
  import_id?: number | null;
  parsed_doc_id?: number | null;
  chunk_count: number;
  error?: string | null;
};

export type ImportBatchResponse = {
  batch_id: string;
  total: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  items: ImportBatchItem[];
};

export type ImportDocumentPayload = {
  file: File;
  title: string;
  permission: DocumentPermission;
};

export type ImportBatchDocumentPayload = {
  files: Array<{
    file: File;
    relativePath: string;
  }>;
  permission: DocumentPermission;
};

export async function importDocument(token: string, payload: ImportDocumentPayload): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', payload.file);
  if (payload.title.trim()) {
    formData.append('title', payload.title.trim());
  }
  formData.append('permission', payload.permission);

  return request<ImportResponse>('/api/import', {
    method: 'POST',
    token,
    body: formData,
  });
}

export async function importBatchDocuments(
  token: string,
  payload: ImportBatchDocumentPayload,
): Promise<ImportBatchResponse> {
  const formData = new FormData();
  payload.files.forEach((item) => {
    formData.append('files', item.file);
    formData.append('relative_paths', item.relativePath || item.file.name);
  });
  formData.append('permission', payload.permission);
  formData.append('conflict_policy', 'skip');

  return request<ImportBatchResponse>('/api/import/batch', {
    method: 'POST',
    token,
    body: formData,
  });
}
