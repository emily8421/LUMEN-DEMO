import type { Draft } from './types';
import type { DocumentPermission } from '../api';

/** 文档草稿初始值 + 规范化（提交前去空白）。 */

export const emptyDraft: Draft = {
  title: '',
  content_md: '',
  permission: 'team' as DocumentPermission,
};

export function normalizeDraft(draft: Draft) {
  return {
    title: draft.title.trim(),
    content_md: draft.content_md,
    permission: draft.permission,
    // ⑥：新建时透传 folder_id（可空=根目录）；编辑态 draft.folder_id 为 undefined 则不携带。
    ...(draft.folder_id !== undefined ? { folder_id: draft.folder_id } : {}),
  };
}
