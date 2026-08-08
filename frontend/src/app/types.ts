import type { DocumentPermission, TermStatus } from '../api';

export type Session = {
  token: string;
  userId: number;
  /** 用户名（注册时填写；顶栏显示名，兼容旧 localStorage 无该字段）。 */
  name?: string;
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
  // 术语管理增强（REQ-036 领域树，migration 017）。
  category_id: number | null;
  category: string;
  source: string;
};

/** 主区术语面板交互模式：view=阅读态（点术语进入），edit=编辑态（点编辑/新建进入）。 */
export type TermPaneMode = 'view' | 'edit';
