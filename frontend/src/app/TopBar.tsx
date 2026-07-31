import type { Space } from '../api';
import type { Session } from './types';

type TopBarProps = {
  session: Session | null;
  spaces: Space[];
  isBusy: boolean;
  currentSpace: Space | null;
  onSpaceChange: (spaceId: number) => void;
  onExportSpace: () => void;
  leftPaneOpen: boolean;
  onToggleLeftPane: () => void;
  rightPaneOpen: boolean;
  onToggleRightPane: () => void;
};

export function TopBar({ session, spaces, isBusy, currentSpace, onSpaceChange, onExportSpace, leftPaneOpen, onToggleLeftPane, rightPaneOpen, onToggleRightPane }: TopBarProps) {
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
      ) : null}
      {session ? (
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
      ) : null}
      {session ? (
        <div className="session-card">
          <span>用户 #{session.userId}</span>
          <strong>{currentSpace?.name ?? `空间 ${session.currentSpaceId}`}</strong>
        </div>
      ) : null}
    </header>
  );
}
