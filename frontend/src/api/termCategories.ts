import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-2）──
// REQ-036 术语领域树（migration 017）。仿 folders.ts 混合接入：纯字段无 union，直接 alias。
export type TermCategoryView = components['schemas']['TermCategoryView'];
export type TermCategoryDetail = components['schemas']['TermCategoryDetail'];

export type TermCategoryCreatePayload = {
  name: string;
  parent_id?: number | null;
};

export type TermCategoryUpdatePayload = {
  name?: string;
  parent_id?: number | null;
};

// 分页：TermCategoryView 无 union，生成 TermCategoryListPage 与手写一致，直接 alias。
type TermCategoryListResponse = components['schemas']['TermCategoryListPage'];

type TermCategoryReorderPayload = {
  parent_id?: number | null;
  ordered_ids: number[];
};

export async function listTermCategories(
  token: string,
  parentId: number | null = null,
): Promise<TermCategoryView[]> {
  const suffix = parentId === null ? '' : `?parent_id=${encodeURIComponent(parentId)}`;
  const response = await request<TermCategoryListResponse>(`/api/term-categories${suffix}`, { token });
  return response.items;
}

export async function createTermCategory(
  token: string,
  payload: TermCategoryCreatePayload,
): Promise<TermCategoryDetail> {
  return request<TermCategoryDetail>('/api/term-categories', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTermCategory(
  token: string,
  categoryId: number,
  payload: TermCategoryUpdatePayload,
): Promise<TermCategoryDetail> {
  return request<TermCategoryDetail>(`/api/term-categories/${categoryId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteTermCategory(token: string, categoryId: number): Promise<void> {
  await request<{ deleted: boolean }>(`/api/term-categories/${categoryId}`, {
    method: 'DELETE',
    token,
  });
}

export async function reorderTermCategories(
  token: string,
  payload: TermCategoryReorderPayload,
): Promise<void> {
  await request<{ ok?: boolean; updated?: boolean }>('/api/term-categories/reorder', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
