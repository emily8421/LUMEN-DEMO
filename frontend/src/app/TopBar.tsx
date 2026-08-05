import { useState } from 'react';
import type { Space } from '../api';
import type { Session } from './types';

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
};

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
}: TopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const userLabel = session ? `#${session.userId}` : '';

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
          <div className="help-wrap">
            <button
              type="button"
              className="help-trigger"
              aria-label="帮助（操作指引）"
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen((current) => !current)}
              title="帮助（操作指引）"
            >
              ?
            </button>
            {helpOpen ? (
              <div className="help-popover" role="region" aria-label="操作指引">
                <strong className="help-title">操作指引</strong>
                <dl className="help-list">
                  <div><dt>视图</dt><dd>左侧导航：首页 / 文档 / 搜索 / 问答 / 术语 / 标签 / 时间线</dd></div>
                  <div><dt>快捷键</dt><dd>Ctrl+B 目录 · Ctrl+R 右栏</dd></div>
                  <div><dt>新建</dt><dd>首页「新建文档」卡片，或文档视图「新建」</dd></div>
                  <div><dt>快速录入</dt><dd>顶栏「快速录入」，随手记一条索引</dd></div>
                  <div><dt>导入</dt><dd>文档视图「导入」：.md / .txt 文件或文件夹（自动分批）</dd></div>
                  <div><dt>导出</dt><dd>顶栏「导出空间 ZIP」；文档详情可下载 .md / PDF</dd></div>
                </dl>
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
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
