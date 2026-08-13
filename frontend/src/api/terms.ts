import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-2）──
// TermStatus：openapi 两个 enum 之一（DocumentPermission / TermStatus），直接 alias。
export type TermStatus = components['schemas']['TermStatus'];

/**
 * Term —— 主体字段来自生成 TermDetail（命名错位 Term↔TermDetail，含 REQ-036 领域树
 * migration 017 扩展字段）；status narrow 为 TermStatus。
 */
export type Term = Omit<components['schemas']['TermDetail'], 'status'> & {
  status: TermStatus;
};

// 分页：生成 TermListPage.items 是未 narrow 的 TermDetail，与 narrow Term 不匹配，保留手写。
export type TermListResponse = {
  items: Term[];
  total: number;
  page: number;
};

// 请求体：生成 TermWriteRequest 与手写零差异（status 同为 TermStatus enum），直接 alias。
export type TermWritePayload = components['schemas']['TermWriteRequest'];

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
