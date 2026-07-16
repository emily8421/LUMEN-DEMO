import { request } from './client';

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
