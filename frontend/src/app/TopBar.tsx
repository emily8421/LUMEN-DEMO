import type { Space } from '../api';
import type { Session } from './types';

type TopBarProps = {
  session: Session | null;
  spaces: Space[];
  isBusy: boolean;
  currentSpace: Space | null;
  onSpaceChange: (spaceId: number) => void;
};

export function TopBar({ session, spaces, isBusy, currentSpace, onSpaceChange }: TopBarProps) {
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
