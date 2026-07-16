import { request } from './client';

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
