import type { Space } from '../../api';
import type { Session } from '../types';
import { GlobalSearchBar } from '../../features/GlobalSearchBar';
import { HelpPopover } from './HelpPopover';
import { UserMenu } from './UserMenu';
import { PaneToggles } from './PaneToggles';

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
 * 顶栏：品牌块 + 全局搜索 / 空间切换 / 导出 + 栏折叠 + 帮助 + 快速录入 + 用户菜单。
 * E4 Slice D 拆分：HelpPopover / UserMenu / PaneToggles 移入 topbar/ 子文件，
 * 本组件只剩装配（无自身 UI state）。
 */
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
          <PaneToggles
            leftPaneOpen={leftPaneOpen}
            onToggleLeftPane={onToggleLeftPane}
            rightPaneOpen={rightPaneOpen}
            onToggleRightPane={onToggleRightPane}
          />
          <HelpPopover />
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
          <UserMenu
            session={session}
            currentSpace={currentSpace}
            canManageUsers={canManageUsers}
            onOpenUserManagement={onOpenUserManagement}
            onLogout={onLogout}
          />
        </div>
      ) : null}
    </header>
  );
}
