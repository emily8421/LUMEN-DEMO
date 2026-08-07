import type { DocumentPermission, TermStatus } from '../api';

export type Session = {
  token: string;
  userId: number;
  currentSpaceId: number;
  /** Sprint-28（REQ-045）：全局角色 admin / member（登录响应携带，C-ROLE-004 前端显隐依据）。 */
  role: 'admin' | 'member';
};

export type ImportDraft = {
  permission: DocumentPermission;
};

export type ImportFileSelection = {
  file: File;
  relativePath: string;
};

export type Draft = {
  title: string;
  content_md: string;
  permission: DocumentPermission;
};

export type TermDraft = {
  term: string;
  definition: string;
  aliases: string;
  status: TermStatus;
};
