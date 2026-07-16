const API_BASE = import.meta.env.VITE_API_BASE ?? '';

type ApiEnvelope<T> = {
  code: number;
  msg: string;
  data: T;
};

export type LoginResponse = {
  token: string;
  user_id: number;
  current_space_id: number;
};

export type Space = {
  id: number;
  code: string;
  name: string;
};

export type DocumentPermission = 'private' | 'team' | 'external_readonly';

export type KnowledgeDocument = {
  id: number;
  space_id: number;
  title: string;
  permission: DocumentPermission;
  type: string;
  current_version: number;
  owner_id: number;
  content_md?: string;
};

export type DocumentVersion = {
  id: number;
  document_id: number;
  version_no: number;
  content_md: string;
  editor_id: number;
  created_at: string;
};

export type DocumentWritePayload = {
  title: string;
  content_md: string;
  permission: DocumentPermission;
};

export type SearchResult = {
  doc_id: number;
  title: string;
  snippet: string;
  chunk_id: number;
  ordinal: number;
};

export type SearchResponse = {
  items: SearchResult[];
  total: number;
  page: number;
};

export type RagSource = {
  doc_id: number | null;
  title: string;
  snippet: string;
  source_type?: 'document' | 'term';
};

export type QueryResponse = {
  answer: string;
  sources: RagSource[];
};

export type TermStatus = 'confirmed' | 'pending';

export type Term = {
  id: number;
  space_id: number | null;
  term: string;
  definition: string;
  aliases: string[];
  owner_id: number;
  status: TermStatus;
  source_document_id: number | null;
};

export type TermListResponse = {
  items: Term[];
  total: number;
  page: number;
};

export type TermWritePayload = {
  term: string;
  definition: string;
  aliases: string[];
  status: TermStatus;
  source_document_id?: number | null;
};

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

export type DocLinkStatus = 'resolved' | 'unresolved' | 'no_access';

export type DocLinkView = {
  id: number;
  source_document_id: number;
  target_document_id: number | null;
  target_title: string | null;
  link_text: string;
  link_type: string;
  status: DocLinkStatus;
};

export type DocLinkCreatePayload = {
  source_document_id: number;
  link_text: string;
  target_document_id?: number | null;
  target_title?: string | null;
  link_type?: string;
};

export async function login(username: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ external_id: username }),
  });
}

export async function listSpaces(token: string): Promise<Space[]> {
  return request<Space[]>('/api/spaces', { token });
}

export async function switchSpace(token: string, spaceId: number): Promise<{ token: string; current_space_id: number }> {
  return request<{ token: string; current_space_id: number }>('/api/spaces/switch', {
    method: 'POST',
    token,
    body: JSON.stringify({ space_id: spaceId }),
  });
}

export async function listDocuments(token: string): Promise<KnowledgeDocument[]> {
  return request<KnowledgeDocument[]>('/api/documents', { token });
}

export async function getDocument(token: string, documentId: number): Promise<KnowledgeDocument> {
  return request<KnowledgeDocument>(`/api/documents/${documentId}`, { token });
}

export async function createDocument(token: string, payload: DocumentWritePayload): Promise<KnowledgeDocument> {
  return request<KnowledgeDocument>('/api/documents', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateDocument(
  token: string,
  documentId: number,
  payload: DocumentWritePayload,
): Promise<KnowledgeDocument> {
  return request<KnowledgeDocument>(`/api/documents/${documentId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteDocument(token: string, documentId: number): Promise<void> {
  await request<{ deleted: boolean }>(`/api/documents/${documentId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listVersions(token: string, documentId: number): Promise<DocumentVersion[]> {
  return request<DocumentVersion[]>(`/api/documents/${documentId}/versions`, { token });
}

export async function restoreVersion(
  token: string,
  documentId: number,
  versionNo: number,
): Promise<KnowledgeDocument> {
  return request<KnowledgeDocument>(`/api/documents/${documentId}/versions/${versionNo}/restore`, {
    method: 'POST',
    token,
  });
}

export async function searchDocuments(token: string, query: string): Promise<SearchResponse> {
  return request<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`, { token });
}

export async function queryKnowledgeBase(token: string, question: string): Promise<QueryResponse> {
  return request<QueryResponse>('/api/query', {
    method: 'POST',
    token,
    body: JSON.stringify({ question }),
  });
}

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

export type DownloadResult = {
  blob: Blob;
  filename: string;
};

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

export async function listTerms(token: string): Promise<TermListResponse> {
  return request<TermListResponse>('/api/terms', { token });
}

export async function createTerm(token: string, payload: TermWritePayload): Promise<Term> {
  return request<Term>('/api/terms', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTerm(token: string, termId: number, payload: TermWritePayload): Promise<Term> {
  return request<Term>(`/api/terms/${termId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteTerm(token: string, termId: number): Promise<void> {
  await request<{ deleted: boolean }>(`/api/terms/${termId}`, {
    method: 'DELETE',
    token,
  });
}

export type DocLinkCreateResult = {
  id: number;
  status: DocLinkStatus;
};

export async function listDocLinks(
  token: string,
  documentId: number,
  direction: 'outbound' | 'backlink',
): Promise<DocLinkView[]> {
  const query = `document_id=${documentId}&direction=${direction}`;
  return request<DocLinkView[]>(`/api/doc-links?${query}`, { token });
}

export async function createDocLink(token: string, payload: DocLinkCreatePayload): Promise<DocLinkCreateResult> {
  return request<DocLinkCreateResult>('/api/doc-links', {
    method: 'POST',
    token,
    body: JSON.stringify({ ...payload, link_type: payload.link_type ?? 'manual' }),
  });
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || envelope.code !== 0) {
    throw new Error(envelope.msg || `Request failed with status ${response.status}`);
  }

  return envelope.data;
}

async function downloadBlob(path: string, token: string, fallbackFilename: string): Promise<DownloadResult> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const blob = await response.blob();
  const filename = parseContentDispositionFilename(response.headers.get('content-disposition')) ?? fallbackFilename;
  return { blob, filename };
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const envelope = (await response.json()) as ApiEnvelope<unknown>;
    if (envelope?.msg) {
      return envelope.msg;
    }
  } catch {
    // 非 JSON 错误体，回退到 HTTP 状态码
  }
  return `请求失败（${response.status}）`;
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = header.match(/filename="?([^";]+)"?/);
  return match ? match[1] : null;
}
