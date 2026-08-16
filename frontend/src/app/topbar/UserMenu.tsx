import { useState } from 'react';
import type { Space } from '../../api';
import type { Session } from '../types';
import { applyTheme, initTheme, THEMES } from '../../theme';
import type { Theme } from '../../theme';

type UserMenuProps = {
  session: Session;
  currentSpace: Space | null;
  /** Sprint-28（REQ-046）：当前用户是否为全局 admin（用户管理入口显隐；后端强制鉴权）。 */
  canManageUsers: boolean;
  /** 打开用户管理页（全局 admin 可见）。 */
  onOpenUserManagement: () => void;
  onLogout: () => void;
};

/**
 * 顶栏用户菜单（自持 open state）：头像触发 → 主题切换 + 用户名/当前空间 + admin 用户管理 + 退出登录。
 * E4 Slice D 从 TopBar 拆分；⑨ 优先显示用户名（登录响应附带），旧 session / 无 name 时回退 #userId。
 * 2026-08-16 主题试点：主题切换器收进本菜单（设置区），localStorage 持久化 + index.html 预置防 FOUC。
 */
export function UserMenu({
  session,
  currentSpace,
  canManageUsers,
  onOpenUserManagement,
  onLogout,
}: UserMenuProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 惰性初始化：首帧已由 index.html 预置脚本设好 data-theme，这里只同步 React state
  const [theme, setTheme] = useState<Theme>(() => initTheme());
  const userLabel = session.name || `#${session.userId}`;

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <>
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
          <label className="user-menu-theme">
            <span>主题</span>
            <select
              value={theme}
              onChange={(event) => handleThemeChange(event.target.value as Theme)}
              aria-label="界面主题"
            >
              {THEMES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
    </>
  );
}
