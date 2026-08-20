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
  /** 新建时所属文件夹（⑥；可空=根目录）。编辑态不传，沿用文档自身 folder_id。 */
  folder_id?: number | null;
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

/** 带进度提示的操作包装类型（"正在保存文档…" 等）；运行时实现单一，在 useAppState.runAction。 */
export type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;
