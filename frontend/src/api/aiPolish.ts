import type { components } from './generated';
import { request } from './client';

/**
 * REQ-014 AI 润色 / 写作引用（API-028，Phase2B 首批核心）。
 *
 * 后端契约（backend/api/documents.py `polish_document_endpoint`，PR #89）：
 * - POST /api/documents/{id}/polish（mode=polish / citation）。
 * - 需文档可写：不可见 4004、不可写 4003、字段非法 4220、LLM 不可用 5030（不编造、不落 generated）。
 * - citation sources 仅当前用户可见 chunk；草稿只存 hash + 摘要（数据外发护栏 RG-008）。
 * - citation 无可见来源 → output_md="未找到可引用来源"、sources=[]（成功草稿，非错误）。
 */

/** 润色 mode：polish 改写选区 / citation 带来源引用。 */
export type PolishMode = 'polish' | 'citation';

/** 草稿状态：generated 已生成 / applied 已写回 / discarded 已丢弃 / failed 生成失败。 */
export type PolishStatus = 'generated' | 'applied' | 'discarded' | 'failed';

/** citation 引用来源：可追溯到 chunk / 文档（仅当前用户可见 chunk）；与生成 PolishSourceView 零差异，直接 alias。 */
export type PolishSource = components['schemas']['PolishSourceView'];

/**
 * POST /api/documents/{id}/polish 返回的草稿视图。
 * ── 混合接入（openapi codegen · Slice B-2）：主体字段来自生成类型；status narrow 为手写 union。
 */
export type PolishView = Omit<components['schemas']['PolishView'], 'status'> & {
  status: PolishStatus;
};

// 请求体（mode 为手写 union，生成是裸 string）手写保留。
export type PolishPayload = {
  mode: PolishMode;
  selection_md: string;
  instruction?: string | null;
  use_sources?: boolean;
};

/** 对文档选区执行 AI 润色 / 写作引用（API-028）。 */
export async function polishDocument(
  token: string,
  documentId: number,
  payload: PolishPayload,
): Promise<PolishView> {
  return request<PolishView>(`/api/documents/${documentId}/polish`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
