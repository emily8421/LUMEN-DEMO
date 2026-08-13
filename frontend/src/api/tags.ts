import type { KnowledgeDocument } from './documents';
import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice A 试点）──────────────────────────
// 主体响应类型对齐生成类型（字段名 / 类型 / optionality 以 openapi 为准，消除手工双写）；
// openapi 几乎无 enum（仅 DocumentPermission / TermStatus），响应字段多为裸 string，
// 故 union literal 保留手写作 narrow overlay（保住 switch / 分支的编译期保护）。

/** Tag status —— openapi 是裸 `string`，保留手写 union 保编译期 narrow。 */
export type TagStatus = 'active' | 'archived';

/**
 * TagView —— 主体字段来自生成类型；`status` 字段 narrow 为手写 TagStatus
 *（Omit + 覆盖：后端加字段自动同步，status 保 union 保护）。
 */
export type TagView = Omit<components['schemas']['TagView'], 'status'> & {
  status: TagStatus;
};

/** DocumentTagView —— 与生成类型零差异（无 union），直接 alias。 */
export type DocumentTagView = components['schemas']['DocumentTagView'];

/** 文档↔标签关联视图（addDocumentTag 返回），与生成 TagLinkView 一致。 */
type TagLinkView = components['schemas']['TagLinkView'];
// ──────────────────────────────────────────────────────────────────────

/**
 * 分页容器。生成类型有 TagListPage / DocumentTagListPage，但其 `items` 元素是
 * 生成 TagView（status: string），与上面 narrow 后的 TagView 不匹配；保留手写泛型
 * 搭配 narrow 元素类型，避免 union 退化。
 */
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
): Promise<TagLinkView> {
  return request<TagLinkView>('/api/documents/${documentId}/tags', {
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
