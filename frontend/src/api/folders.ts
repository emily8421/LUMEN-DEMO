import { request } from './client';

export type FolderView = {
  id: number;
  name: string;
  parent_id: number | null;
  order: number;
  document_count: number;
  child_folder_count: number;
  created_at: string;
  updated_at: string;
};

export type FolderDetail = {
  id: number;
  name: string;
  parent_id: number | null;
  order: number;
  created_at?: string;
  updated_at?: string;
};

export type FolderCreatePayload = {
  name: string;
  parent_id?: number | null;
};

export type FolderUpdatePayload = {
  name?: string;
  parent_id?: number | null;
};

type FolderListResponse = {
  items: FolderView[];
  total: number;
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
