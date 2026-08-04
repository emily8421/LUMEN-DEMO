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
  folder_id?: number | null;
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
  preserveStructure?: boolean;
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

/**
 * 单批上传文件数上限（REQ-037 批量导入修复）。
 *
 * Starlette 1.2.1 默认 max_files=1000 / max_fields=1000；前端每文件发 1 个 `files` +
 * 1 个 `relative_paths`，单请求 part 数 ≈ 2N+3。1000 文件会先撞 max_fields 被框架拦下，
 * 后端还没开始导入。取 50 → 单请求约 103 个 part，远低于上限；同时把单请求内 CPU
 * embedding（bge-small-zh）工作量压到几秒级，规避请求超时。若本机 embedding 偏慢致单批
 * 偶发超时，可调小（如 30）——它是纯前端常量，不改后端契约。
 */
const IMPORT_BATCH_SIZE = 50;

async function postImportBatch(
  token: string,
  files: Array<{ file: File; relativePath: string }>,
  permission: DocumentPermission,
  preserveStructure: boolean,
): Promise<ImportBatchResponse> {
  const formData = new FormData();
  files.forEach((item) => {
    formData.append('files', item.file);
    formData.append('relative_paths', item.relativePath || item.file.name);
  });
  formData.append('permission', permission);
  formData.append('conflict_policy', 'skip');
  formData.append('preserve_structure', String(preserveStructure));

  return request<ImportBatchResponse>('/api/import/batch', {
    method: 'POST',
    token,
    body: formData,
  });
}

/**
 * 批量导入：按 {@link IMPORT_BATCH_SIZE} **顺序**分批上传，逐批聚合结果。
 *
 * 必须顺序、不能并发：后端同名去重（backend/service/imports.py `_document_title_exists`
 * 实时读 list_documents）并发会漏判重复；且 CPU embedding 并发只会互相抢资源。
 *
 * 传输级失败（网络 / 超时 / 鉴权）逐批 try/catch，记该批全部文件为失败、不中断后续批
 * （部分成功语义）。已落库的前序批不受影响；后端 conflict_policy=skip 按标题去重，整目录
 * 重试不会产生重复。onProgress 回调每完成一批触发，供调用方更新进度文案。
 */
export async function importBatchDocuments(
  token: string,
  payload: ImportBatchDocumentPayload,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportBatchResponse> {
  const total = payload.files.length;
  const preserveStructure = payload.preserveStructure ?? true;
  const batches: ImportBatchResponse[] = [];

  for (let start = 0; start < total; start += IMPORT_BATCH_SIZE) {
    const slice = payload.files.slice(start, start + IMPORT_BATCH_SIZE);
    try {
      batches.push(await postImportBatch(token, slice, payload.permission, preserveStructure));
    } catch (error) {
      batches.push(failedBatchFromSlice(slice, error));
    }
    onProgress?.(Math.min(start + IMPORT_BATCH_SIZE, total), total);
  }

  return mergeBatchResults(batches);
}

function failedBatchFromSlice(
  files: Array<{ file: File; relativePath: string }>,
  error: unknown,
): ImportBatchResponse {
  const reason = `批次上传失败：${error instanceof Error ? error.message : '未知原因'}`;
  const items: ImportBatchItem[] = files.map((entry) => ({
    filename: entry.file.name,
    relative_path: entry.relativePath || entry.file.name,
    title: entry.file.name,
    status: 'failed',
    chunk_count: 0,
    error: reason,
  }));

  return {
    batch_id: '',
    total: items.length,
    success_count: 0,
    failed_count: items.length,
    skipped_count: 0,
    items,
  };
}

function mergeBatchResults(batches: ImportBatchResponse[]): ImportBatchResponse {
  const items = batches.flatMap((batch) => batch.items);
  return {
    batch_id: batches[0]?.batch_id ?? '',
    total: batches.reduce((sum, batch) => sum + batch.total, 0),
    success_count: batches.reduce((sum, batch) => sum + batch.success_count, 0),
    failed_count: batches.reduce((sum, batch) => sum + batch.failed_count, 0),
    skipped_count: batches.reduce((sum, batch) => sum + batch.skipped_count, 0),
    items,
  };
}
