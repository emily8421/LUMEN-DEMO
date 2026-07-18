import { request } from './client';

/**
 * REQ-025 快速录入（API-017，Phase2A 最小版）。
 *
 * 后端实际契约（backend/api/quick_entry.py，Task A f771e02）：
 * - POST /api/quick-entry（capture）：按 mode 保留草稿 / 转新文档 / 追加到已有文档。
 * - DELETE /api/quick-entry/{id}（discard）：仅 status=draft 且属于当前用户的条目可丢弃。
 *
 * 注：后端实现含 `source` 字段，docs/07 §3.9 契约草案（line 258）暂未列出，
 * 由 Task C 文档回写统一；前端按后端实际契约实现。
 */

/** 录入 mode：draft 保留草稿 / create_document 转新文档 / append_document 追加到已有文档。 */
export type QuickEntryMode = 'draft' | 'create_document' | 'append_document';

/** 条目状态：draft 草稿 / converted 已转文档或追加 / discarded 已丢弃。 */
export type QuickEntryStatus = 'draft' | 'converted' | 'discarded';

/** POST /api/quick-entry 与 DELETE /api/quick-entry/{id} 返回的条目视图。 */
export type QuickEntryView = {
  id: number;
  status: QuickEntryStatus;
  created_document_id: number | null;
  target_document_id: number | null;
  title: string;
  owner_id: number;
};

export type QuickEntryCapturePayload = {
  title: string;
  content_md?: string;
  source?: string | null;
  target_document_id?: number | null;
  tag_ids?: number[];
  mode?: QuickEntryMode;
};

/** 录入一条快速条目（capture）：按 mode 保留草稿 / 转新文档 / 追加到已有文档。 */
export async function captureQuickEntry(
  token: string,
  payload: QuickEntryCapturePayload,
): Promise<QuickEntryView> {
  return request<QuickEntryView>('/api/quick-entry', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

/** 丢弃一条 draft 条目（discard）：仅 status=draft 且属于当前用户的条目可丢弃。 */
export async function discardQuickEntry(token: string, entryId: number): Promise<QuickEntryView> {
  return request<QuickEntryView>(`/api/quick-entry/${entryId}`, {
    method: 'DELETE',
    token,
  });
}
