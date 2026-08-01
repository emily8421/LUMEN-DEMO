import { useState } from 'react';
import type { ActiveView } from './WorkspaceViewNav';

type UseWorkspace = {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  notice: string;
  setNotice: (message: string) => void;
  isBusy: boolean;
  setIsBusy: (busy: boolean) => void;
  error: string;
  setError: (message: string) => void;
};

/**
 * 全局工作台 UI state：当前视图 / 通知 / 忙碌 / 错误。
 *
 * 抽成独立 hook（APP-SIZE-C-011）。runAction 留在 App（cross-cutting，需组合本 hook 的
 * setters 与 useSession.handleAuthError）；本 hook 只暴露 state + setters 供 App 与各域 hook 使用。
 */
export function useWorkspace(): UseWorkspace {
  // Doc-First §9.5.2（Sprint-21 slice 3c）：默认落地页 = 首页（home 欢迎引导），不直接进 documents。
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [notice, setNotice] = useState('请使用 Demo 账号登录。');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  return { activeView, setActiveView, notice, setNotice, isBusy, setIsBusy, error, setError };
}
