import { useEffect, useRef, useState } from 'react';
import type { Space } from '../api';
import type { Session } from './types';
import { GlobalSearchBar } from '../features/GlobalSearchBar';

type TopBarProps = {
  session: Session | null;
  spaces: Space[];
  isBusy: boolean;
  currentSpace: Space | null;
  onSpaceChange: (spaceId: number) => void;
  onExportSpace: () => void;
  onQuickEntryOpen: () => void;
  leftPaneOpen: boolean;
  onToggleLeftPane: () => void;
  rightPaneOpen: boolean;
  onToggleRightPane: () => void;
  onLogout: () => void;
  /** Sprint-28（REQ-046）：当前用户是否为全局 admin（用户管理入口显隐；后端强制鉴权）。 */
  canManageUsers: boolean;
  /** 打开用户管理页（全局 admin 可见）。 */
  onOpenUserManagement: () => void;
  /** 打开命令面板（批2a，点2）。 */
  onOpenSearchPalette: () => void;
};

/**
 * 帮助速查条目（Sprint-25 L1 帮助弹层）。
 * 与 docs/env/user-guide.md（唯一内容源）保持一致；完整内容以「查看完整手册」为准。
 */
const HELP_ENTRIES: Array<{ category: string; term: string; detail: string }> = [
  { category: '快速开始', term: '登录', detail: '演示账号 alice / kira / brightlite-member，密码 demo-pass-1234；可注册新账号' },
  { category: '快速开始', term: '30 秒上手', detail: '新建文档 → 保存 → 搜索 / 问答；示例文档未建索引，需新建或导入' },
  { category: '文档', term: '新建', detail: '文档视图「新建」，或首页「新建文档」卡片' },
  { category: '文档', term: '导入', detail: '文档视图「导入」：.md / .txt 文件或文件夹（自动分批）' },
  { category: '搜索问答', term: '搜索', detail: 'Hybrid 关键词 + 语义；按当前空间权限过滤' },
  { category: '搜索问答', term: '问答', detail: '答案必带来源；库外问题明确回复“未找到”' },
  { category: '导入导出', term: '导出', detail: '顶栏「导出空间 ZIP」；文档详情可下载 .md / PDF' },
  { category: '组织', term: '标签 / 术语 / 链接', detail: '空间级标签与术语、[[wikilink]] 双向链接' },
  { category: '权限', term: '权限', detail: '私有 / 团队共享 / 外部只读，由后端执行' },
  { category: '快捷键', term: '快捷键', detail: 'Ctrl+B 目录 · Ctrl+R 右栏' },
];

const HELP_MANUAL_URL = 'https://github.com/emily8421/LUMEN-DEMO/blob/main/docs/env/user-guide.md';

export function TopBar({
  session,
  spaces,
  isBusy,
  currentSpace,
  onSpaceChange,
  onExportSpace,
  onQuickEntryOpen,
  leftPaneOpen,
  onToggleLeftPane,
  rightPaneOpen,
  onToggleRightPane,
  onLogout,
  canManageUsers,
  onOpenUserManagement,
  onOpenSearchPalette,
}: TopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');
  const helpWrapRef = useRef<HTMLDivElement>(null);
  const userLabel = session ? `#${session.userId}` : '';

  // 帮助弹层关闭：点击外部 / Esc / 头部「×」（Sprint-25 bugfix）。
  useEffect(() => {
    if (!helpOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (helpWrapRef.current && !helpWrapRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [helpOpen]);

  const filteredHelp = (() => {
    const query = helpQuery.trim().toLowerCase();
    if (!query) {
      return HELP_ENTRIES;
    }
    return HELP_ENTRIES.filter((entry) =>
      [entry.category, entry.term, entry.detail].some((value) => value.toLowerCase().includes(query)),
    );
  })();

  return (
    <header className="topbar app-topbar">
      <div className="brand-block">
        <span className="brand-mark">L</span>
        <div>
          <p className="eyebrow">LUMEN Demo</p>
          <h1>LUMEN 团队知识库工作台</h1>
        </div>
      </div>
      {session ? (
        <div className="topbar-center">
          <GlobalSearchBar onOpen={onOpenSearchPalette} />
          <div className="top-context">
            <span>当前空间</span>
            <select
              value={session.currentSpaceId}
              onChange={(event) => void onSpaceChange(Number(event.target.value))}
              disabled={isBusy}
              aria-label="当前空间"
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>{space.name}</option>
              ))}
            </select>
            <button type="button" className="secondary" onClick={onExportSpace} disabled={isBusy}>导出空间 ZIP</button>
          </div>
        </div>
      ) : null}
      {session ? (
        <div className="top-actions">
          <div className="pane-toggles">
            <button
              type="button"
              className={`pane-toggle${leftPaneOpen ? ' active' : ''}`}
              onClick={onToggleLeftPane}
              aria-label={leftPaneOpen ? '收起目录' : '展开目录'}
              aria-pressed={leftPaneOpen}
              title="目录（Ctrl+B）"
            >
              <svg className="pane-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
            <button
              type="button"
              className={`pane-toggle${rightPaneOpen ? ' active' : ''}`}
              onClick={onToggleRightPane}
              aria-label={rightPaneOpen ? '收起右栏' : '展开右栏'}
              aria-pressed={rightPaneOpen}
              title="右栏（Ctrl+R）"
            >
              <svg className="pane-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M15 3v18" />
              </svg>
            </button>
          </div>
          <div className="help-wrap" ref={helpWrapRef}>
            <button
              type="button"
              className="help-trigger"
              aria-label="帮助（操作指引）"
              aria-expanded={helpOpen}
              onClick={() => {
                setHelpOpen((current) => !current);
                setHelpQuery('');
              }}
              title="帮助（操作指引）"
            >
              ?
            </button>
            {helpOpen ? (
              <div className="help-popover" role="region" aria-label="操作指引">
                <div className="help-header">
                  <strong className="help-title">操作指引</strong>
                  <button
                    type="button"
                    className="help-close"
                    aria-label="关闭帮助"
                    onClick={() => setHelpOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <input
                  className="help-filter"
                  value={helpQuery}
                  onChange={(event) => setHelpQuery(event.target.value)}
                  placeholder="搜索帮助（如：导入）"
                  aria-label="搜索帮助"
                />
                <dl className="help-list">
                  {filteredHelp.map((entry, index) => (
                    <div key={`${entry.category}-${index}`}>
                      <dt>{entry.category}</dt>
                      <dd>
                        <strong>{entry.term}</strong> — {entry.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
                {filteredHelp.length === 0 ? (
                  <p className="help-no-result">未找到匹配条目，请见完整手册。</p>
                ) : null}
                <a
                  className="help-manual-link"
                  href={HELP_MANUAL_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看完整手册 →
                </a>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="quick-entry-trigger top-quick-entry"
            onClick={onQuickEntryOpen}
            disabled={isBusy}
            aria-label="快速录入"
            title="快速录入"
          >
            <span aria-hidden="true">+</span>
            <span className="quick-entry-label">快速录入</span>
          </button>
          <button
            type="button"
            className="user-menu-trigger"
            aria-label={`用户 ${userLabel}`}
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((current) => !current)}
            title={`用户 ${userLabel} · ${currentSpace?.name ?? `空间 ${session.currentSpaceId}`}`}
          >
            <span className="user-avatar" aria-hidden="true">{userLabel}</span>
          </button>
          {userMenuOpen ? (
            <div className="user-menu-popover" role="menu">
              <span>用户 {userLabel}</span>
              <strong>{currentSpace?.name ?? `空间 ${session.currentSpaceId}`}</strong>
              {canManageUsers ? (
                <button
                  type="button"
                  className="user-menu-admin"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenUserManagement();
                  }}
                >
                  用户管理
                </button>
              ) : null}
              <button
                type="button"
                className="user-menu-logout"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
              >
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
