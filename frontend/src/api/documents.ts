import { request } from './client';

export type DocumentPermission = 'private' | 'team' | 'external_readonly';

export type KnowledgeDocument = {
  id: number;
  space_id: number;
  folder_id: number | null;
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

export async function moveDocument(
  token: string,
  documentId: number,
  folderId: number | null,
): Promise<KnowledgeDocument> {
  return request<KnowledgeDocument>(`/api/documents/${documentId}/folder`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ folder_id: folderId }),
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
