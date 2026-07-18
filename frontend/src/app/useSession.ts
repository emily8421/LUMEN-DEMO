import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from './types';
import type { Space } from '../api';
import { listSpaces, login, switchSpace } from '../api';
import { clearStoredSession, loadStoredSession, persistSession } from './session-store';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseSessionArgs = {
  runAction: RunAction;
  setNotice: (message: string) => void;
  /** 空间切换后的跨域副作用（重置选中文档 / 视图 / 搜索 / 问答 / 术语）。 */
  onSpaceChanged: () => void;
};

/**
 * 登录态 + 空间 state + handler（REQ-001/002）。
 *
 * 抽成独立 hook（APP-SIZE-C-011）。封装 username/session/spaces + 登录 / 切换空间 /
 * 重载空间 / 登录失效处理。空间切换的跨域副作用经 onSpaceChanged 回调交回 App。
 * 写操作经 App 注入的 runAction 包装（登录失效由 runAction 统一处理）。
 */
export function useSession({ runAction, setNotice, onSpaceChanged }: UseSessionArgs) {
  const [username, setUsername] = useState('alice');
  const [session, setSession] = useState<Session | null>(() => loadStoredSession());
  const [spaces, setSpaces] = useState<Space[]>([]);

  const handleAuthError = () => {
    clearStoredSession();
    setSession(null);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runAction('正在登录...', async () => {
      const result = await login(username.trim());
      const nextSession = {
        token: result.token,
        userId: result.user_id,
        currentSpaceId: result.current_space_id,
      };
      setSession(nextSession);
      persistSession(nextSession);
      setNotice(`已登录：user_id=${result.user_id}`);
    });
  };

  const handleSpaceChange = (spaceId: number) => {
    if (!session) {
      return;
    }
    void runAction('正在切换空间...', async () => {
      const result = await switchSpace(session.token, spaceId);
      const nextSession = { ...session, token: result.token, currentSpaceId: result.current_space_id };
      setSession(nextSession);
      persistSession(nextSession);
      onSpaceChanged();
      setNotice('空间已切换，文档列表已刷新。');
    });
  };

  const reloadSpaces = async (token: string) => {
    setSpaces(await listSpaces(token));
  };

  return {
    username,
    setUsername,
    session,
    spaces,
    handleLogin,
    handleSpaceChange,
    reloadSpaces,
    handleAuthError,
  };
}
