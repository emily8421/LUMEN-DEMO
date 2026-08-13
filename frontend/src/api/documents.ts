import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-4）──
// 后端对「文档」有两种形状（backend/api/documents.py response_model）：
//   列表 GET /api/documents → DocumentSummary（无 content_md）；
//   详情 GET/{id} / POST / PUT / PATCH folder / restore → DocumentDetail（content_md 必填）。
// 前端用 union 显式承载两种形状；「是否已加载详情」经 isDocumentDetail 判别
//（旧手写把两者压平为 content_md?: string，用字段存在性当运行时哨兵）。

/** 文档可见性 —— openapi 两个 enum 之一（DocumentPermission / TermStatus），直接 alias。 */
export type DocumentPermission = components['schemas']['DocumentPermission'];

/** 列表元素（无正文）；permission narrow 保 union（生成裸 string）。 */
export type DocumentSummaryView = Omit<components['schemas']['DocumentSummary'], 'permission'> & {
  permission: DocumentPermission;
};

/** 详情（含正文 content_md: string）；permission narrow 保 union。 */
export type DocumentDetailView = Omit<components['schemas']['DocumentDetail'], 'permission'> & {
  permission: DocumentPermission;
};

/** 文档 = 列表版 | 详情版；详情判别见 isDocumentDetail。 */
export type KnowledgeDocument = DocumentSummaryView | DocumentDetailView;

/** 详情判别守卫：content_md 字段存在即详情版（后端 detail 必带、summary 必不带）。 */
export function isDocumentDetail(document: KnowledgeDocument): document is DocumentDetailView {
  return 'content_md' in document;
}

/** 文档版本条目，与生成 DocumentVersionView 零差异，直接 alias。 */
export type DocumentVersion = components['schemas']['DocumentVersionView'];

// 请求体：生成 DocumentWriteRequest 与手写零差异（permission 同为 enum），直接 alias。
export type DocumentWritePayload = components['schemas']['DocumentWriteRequest'];

export async function listDocuments(token: string): Promise<DocumentSummaryView[]> {
  return request('/api/documents', { token });
}

export async function getDocument(token: string, documentId: number): Promise<DocumentDetailView> {
  return request(`/api/documents/${documentId}`, { token });
}

export async function createDocument(
  token: string,
  payload: DocumentWritePayload,
): Promise<DocumentDetailView> {
  return request('/api/documents', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateDocument(
  token: string,
  documentId: number,
  payload: DocumentWritePayload,
): Promise<DocumentDetailView> {
  return request(`/api/documents/${documentId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function moveDocument(
  token: string,
  documentId: number,
  folderId: number | null,
): Promise<DocumentDetailView> {
  return request(`/api/documents/${documentId}/folder`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ folder_id: folderId }),
  });
}

export async function deleteDocument(token: string, documentId: number): Promise<void> {
  await request<{ deleted: boolean }>(`/api/documents/${documentId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listVersions(token: string, documentId: number): Promise<DocumentVersion[]> {
  return request(`/api/documents/${documentId}/versions`, { token });
}

export async function restoreVersion(
  token: string,
  documentId: number,
  versionNo: number,
): Promise<DocumentDetailView> {
  return request(`/api/documents/${documentId}/versions/${versionNo}/restore`, {
    method: 'POST',
    token,
  });
}
