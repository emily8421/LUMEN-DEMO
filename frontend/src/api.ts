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
  doc_id: number;
  title: string;
  snippet: string;
};

export type QueryResponse = {
  answer: string;
  sources: RagSource[];
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

type RequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

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
