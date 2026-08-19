// CQ-P1-008 App 减压：登录 / 注册面板 + 忘记密码 modal（原 App.tsx auth shell 段）。
import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { useSession } from '../../app/useSession';
import { PasswordInput } from './PasswordInput';
import { PasswordResetModal } from './PasswordResetModal';

interface AuthShellProps {
  session: ReturnType<typeof useSession>;
  isBusy: boolean;
  resetModalOpen: boolean;
  onOpenResetModal: () => void;
  onCloseResetModal: () => void;
}

export function AuthShell({ session, isBusy, resetModalOpen, onOpenResetModal, onCloseResetModal }: AuthShellProps) {
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);

  const selectAuthMode = (mode: 'login' | 'register') => {
    session.setAuthMode(mode);
    (mode === 'login' ? loginTabRef : registerTabRef).current?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentMode = event.currentTarget.id === 'auth-tab-login' ? 'login' : 'register';
    let nextMode: 'login' | 'register' | null = null;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      nextMode = currentMode === 'login' ? 'register' : 'login';
    } else if (event.key === 'Home') {
      nextMode = 'login';
    } else if (event.key === 'End') {
      nextMode = 'register';
    }

    if (!nextMode) {
      return;
    }
    event.preventDefault();
    selectAuthMode(nextMode);
  };

  return (
    <section className="login-panel card">
      <div className="auth-tabs" role="tablist" aria-label="登录或注册">
        <button
          ref={loginTabRef}
          id="auth-tab-login"
          type="button"
          role="tab"
          className={session.authMode === 'login' ? 'active' : ''}
          aria-selected={session.authMode === 'login'}
          aria-controls="auth-panel-login"
          tabIndex={session.authMode === 'login' ? 0 : -1}
          onClick={() => selectAuthMode('login')}
          onKeyDown={handleTabKeyDown}
        >
          登录
        </button>
        <button
          ref={registerTabRef}
          id="auth-tab-register"
          type="button"
          role="tab"
          className={session.authMode === 'register' ? 'active' : ''}
          aria-selected={session.authMode === 'register'}
          aria-controls="auth-panel-register"
          tabIndex={session.authMode === 'register' ? 0 : -1}
          onClick={() => selectAuthMode('register')}
          onKeyDown={handleTabKeyDown}
        >
          注册
        </button>
      </div>
      <form
        id="auth-panel-login"
        role="tabpanel"
        aria-labelledby="auth-tab-login"
        hidden={session.authMode !== 'login'}
        onSubmit={session.handleLogin}
      >
        <h2>登录</h2>
        <p>演示账号 alice / kira / brightlite-member（密码 demo-pass-1234），或使用注册邮箱登录。</p>
        <label>
          账号（邮箱或 external_id）
          <input value={session.loginId} onChange={(event) => session.setLoginId(event.target.value)} />
        </label>
        <label>
          密码
          <PasswordInput value={session.password} onChange={session.setPassword} />
        </label>
        <button type="button" className="auth-link-button" onClick={onOpenResetModal}>
          忘记密码？
        </button>
        <button type="submit" disabled={isBusy || session.loginId.trim().length === 0}>登录</button>
      </form>
      <form
        id="auth-panel-register"
        role="tabpanel"
        aria-labelledby="auth-tab-register"
        hidden={session.authMode !== 'register'}
        onSubmit={session.handleRegister}
      >
        <h2>注册新账号</h2>
        <p>注册后自动创建个人空间并登录（REQ-040）。</p>
        <label>
          邮箱
          <input type="email" value={session.registerEmail} onChange={(event) => session.setRegisterEmail(event.target.value)} />
        </label>
        <label>
          显示名
          <input value={session.registerName} onChange={(event) => session.setRegisterName(event.target.value)} />
        </label>
        <label>
          密码（至少 8 位）
          <PasswordInput value={session.registerPassword} onChange={session.setRegisterPassword} />
        </label>
        <button
          type="submit"
          disabled={
            isBusy ||
            session.registerEmail.trim().length === 0 ||
            session.registerName.trim().length === 0 ||
            session.registerPassword.length < 8
          }
        >
          注册并登录
        </button>
      </form>
      <PasswordResetModal open={resetModalOpen} onClose={onCloseResetModal} />
    </section>
  );
}
