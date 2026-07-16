import type { KnowledgeDocument } from './documents';
import { request } from './client';

export type TagStatus = 'active' | 'archived';

export type TagView = {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  document_count: number;
  status: TagStatus;
};

export type DocumentTagView = {
  tag_id: number;
  name: string;
  color: string | null;
  link_source: string;
};

type ListEnvelope<T> = { items: T[]; total: number };

export async function listTags(token: string, q?: string): Promise<ListEnvelope<TagView>> {
  const query = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return request<ListEnvelope<TagView>>(`/api/tags${query}`, { token });
}

export async function getTag(token: string, tagId: number): Promise<TagView> {
  return request<TagView>(`/api/tags/${tagId}`, { token });
}

export async function createTag(
  token: string,
  payload: { name: string; color?: string; description?: string },
): Promise<TagView> {
  return request<TagView>('/api/tags', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTag(
  token: string,
  tagId: number,
  payload: { name?: string; color?: string; description?: string; status?: string },
): Promise<TagView> {
  return request<TagView>(`/api/tags/${tagId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function archiveTag(token: string, tagId: number): Promise<TagView> {
  return request<TagView>(`/api/tags/${tagId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listDocumentTags(token: string, documentId: number): Promise<DocumentTagView[]> {
  const result = await request<ListEnvelope<DocumentTagView>>(`/api/documents/${documentId}/tags`, { token });
  return result.items;
}

export async function addDocumentTag(
  token: string,
  documentId: number,
  tagId: number,
): Promise<{ tag_id: number; document_id: number; link_source: string }> {
  return request(`/api/documents/${documentId}/tags`, {
    method: 'POST',
    token,
    body: JSON.stringify({ tag_id: tagId }),
  });
}

export async function removeDocumentTag(token: string, documentId: number, tagId: number): Promise<void> {
  await request<{ deleted: boolean }>(`/api/documents/${documentId}/tags/${tagId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listDocumentsByTag(token: string, tagId: number): Promise<KnowledgeDocument[]> {
  const result = await request<ListEnvelope<KnowledgeDocument>>(`/api/tags/${tagId}/documents`, { token });
  return result.items;
}
