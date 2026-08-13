import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-1）──
/** DocLink status —— openapi 裸 string，保留手写 union 保编译期 narrow。 */
export type DocLinkStatus = 'resolved' | 'unresolved' | 'no_access';

/** 主体字段来自生成类型；status narrow 为手写 DocLinkStatus。 */
export type DocLinkView = Omit<components['schemas']['DocLinkView'], 'status'> & {
  status: DocLinkStatus;
};

/** createDocLink 返回；alias 生成 DocLinkCreated + status narrow。 */
export type DocLinkCreateResult = Omit<components['schemas']['DocLinkCreated'], 'status'> & {
  status: DocLinkStatus;
};

// 请求体（前端组装）手写保留。
export type DocLinkCreatePayload = {
  source_document_id: number;
  link_text: string;
  target_document_id?: number | null;
  target_title?: string | null;
  link_type?: string;
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
