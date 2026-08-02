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
              ☰
            </button>
            <button
              type="button"
              className={`pane-toggle${rightPaneOpen ? ' active' : ''}`}
              onClick={onToggleRightPane}
              aria-label={rightPaneOpen ? '收起右栏' : '展开右栏'}
              aria-pressed={rightPaneOpen}
              title="右栏（Ctrl+R）"
            >
              ☰
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
