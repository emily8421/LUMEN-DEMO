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
  };
}
