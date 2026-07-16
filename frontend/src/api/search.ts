import { request } from './client';

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
