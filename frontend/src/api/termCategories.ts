import { request } from './client';

// REQ-036 术语领域树（migration 017）。仿 folders.ts（REQ-039 文档目录树）。

export type TermCategoryView = {
  id: number;
  name: string;
  parent_id: number | null;
  order_idx: number;
  term_count: number;
  child_category_count: number;
  created_at: string;
  updated_at: string;
};

export type TermCategoryDetail = {
  id: number;
  name: string;
  parent_id: number | null;
  order_idx: number;
};

export type TermCategoryCreatePayload = {
  name: string;
  parent_id?: number | null;
};

export type TermCategoryUpdatePayload = {
  name?: string;
  parent_id?: number | null;
};

type TermCategoryListResponse = {
  items: TermCategoryView[];
  total: number;
};

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
