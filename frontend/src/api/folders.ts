import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-1）──
// 主体类型对齐生成类型（字段以 openapi 为准）；FolderView 纯字段无 union，直接 alias。
export type FolderView = components['schemas']['FolderView'];
// 生成 FolderDetail 仅 { id, name, parent_id, order }；前端旧手写的 created_at?/updated_at? 后端 schema 不返回、
// 无消费方引用（grep 确认仅本文件内部），alias 清理冗余字段。
export type FolderDetail = components['schemas']['FolderDetail'];

// 分页：FolderView 无 union，生成 FolderListPage 与手写一致，直接 alias。
type FolderListResponse = components['schemas']['FolderListPage'];

// 请求体（前端组装，无 union 价值）手写保留。
export type FolderCreatePayload = {
  name: string;
  parent_id?: number | null;
};

export type FolderUpdatePayload = {
  name?: string;
  parent_id?: number | null;
};

type FolderReorderPayload = {
  parent_id?: number | null;
  ordered_ids: number[];
};

export async function listFolders(token: string, parentId: number | null = null): Promise<FolderView[]> {
  const suffix = parentId === null ? '' : `?parent_id=${encodeURIComponent(parentId)}`;
  const response = await request<FolderListResponse>(`/api/folders${suffix}`, { token });
  return response.items;
}

export async function createFolder(token: string, payload: FolderCreatePayload): Promise<FolderDetail> {
  return request<FolderDetail>('/api/folders', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateFolder(
  token: string,
  folderId: number,
  payload: FolderUpdatePayload,
): Promise<FolderDetail> {
  return request<FolderDetail>(`/api/folders/${folderId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteFolder(token: string, folderId: number): Promise<void> {
  await request<{ deleted: boolean }>(`/api/folders/${folderId}`, {
    method: 'DELETE',
    token,
  });
}

export async function reorderFolders(token: string, payload: FolderReorderPayload): Promise<void> {
  await request<{ ok?: boolean; updated?: boolean }>('/api/folders/reorder', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
