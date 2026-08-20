import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from './types';
import type { Space } from '../api';
import { listSpaces, login, logout, register, switchSpace } from '../api';
import { clearStoredSession, loadStoredSession, persistSession } from './session-store';
import { createResponseOwnership } from './response-ownership';

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
  const [loginId, setLoginId] = useState('alice');
  const [password, setPassword] = useState('demo-pass-1234');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [session, setSession] = useState<Session | null>(() => loadStoredSession());
  const [spaces, setSpaces] = useState<Space[]>([]);
  const spaceResponseOwnership = useRef(createResponseOwnership());
  const spaceSwitchResponseOwnership = useRef(createResponseOwnership());
  const sessionScope = session?.token ?? '';
  spaceResponseOwnership.current.setScope(sessionScope);
  spaceSwitchResponseOwnership.current.setScope(sessionScope);

  const handleAuthError = () => {
    clearStoredSession();
    setSession(null);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runAction('正在登录...', async () => {
      const result = await login(loginId.trim(), password);
      const nextSession = {
        token: result.token,
        userId: result.user_id,
        name: result.name,
        currentSpaceId: result.current_space_id,
        role: result.role,
      };
      setSession(nextSession);
      persistSession(nextSession);
      setNotice(`已登录：${result.name || `#${result.user_id}`}（${result.role}）`);
    });
  };

  /** 注册（REQ-040）后自动登录（C-AUTH-001：自建个人空间）。 */
  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runAction('正在注册...', async () => {
      const created = await register(registerEmail.trim(), registerName.trim(), registerPassword);
      const result = await login(created.email, registerPassword);
      const nextSession = {
        token: result.token,
        userId: result.user_id,
        name: result.name || created.name,
        currentSpaceId: result.current_space_id,
        role: result.role,
      };
      setSession(nextSession);
      persistSession(nextSession);
      setNotice(`注册成功：${created.name}（${created.email}，member）`);
    });
  };

  /** 登出（REQ-042）：撤销当前会话并清空本地登录态。 */
  const handleLogout = () => {
    if (!session) {
      return;
    }
    void runAction('正在退出...', async () => {
      try {
        await logout(session.token);
      } finally {
        clearStoredSession();
        setSession(null);
        setNotice('已退出登录。');
      }
    });
  };

  const handleSpaceChange = (spaceId: number) => {
    if (!session) {
      return;
    }
    if (!spaceSwitchResponseOwnership.current.isCurrentScope(session.token)) {
      return;
    }
    const ticket = spaceSwitchResponseOwnership.current.begin();
    void runAction('正在切换空间...', async () => {
      const result = await switchSpace(session.token, spaceId);
      if (!spaceSwitchResponseOwnership.current.owns(ticket)) {
        return;
      }
      // Sprint-26 契约变更：switch 不再重发 token，session 承载 current_space_id
      const nextSession = { ...session, currentSpaceId: result.current_space_id };
      setSession(nextSession);
      persistSession(nextSession);
      onSpaceChanged();
      setNotice('空间已切换，文档列表已刷新。');
    });
  };

  const reloadSpaces = async (token: string) => {
    if (!spaceResponseOwnership.current.isCurrentScope(token)) {
      return;
    }
    const ticket = spaceResponseOwnership.current.begin();
    const rows = await listSpaces(token);
    if (spaceResponseOwnership.current.owns(ticket)) {
      setSpaces(rows);
    }
  };

  return {
    loginId,
    setLoginId,
    password,
    setPassword,
    registerEmail,
    setRegisterEmail,
    registerName,
    setRegisterName,
    registerPassword,
    setRegisterPassword,
    authMode,
    setAuthMode,
    session,
    spaces,
    handleLogin,
    handleRegister,
    handleLogout,
    handleSpaceChange,
    reloadSpaces,
    handleAuthError,
  };
}
