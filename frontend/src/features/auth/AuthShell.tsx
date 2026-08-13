// CQ-P1-008 App 减压：登录 / 注册面板 + 忘记密码 modal（原 App.tsx auth shell 段）。
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
  return (
    <section className="login-panel card">
      <div className="auth-tabs" role="tablist" aria-label="登录或注册">
        <button
          type="button"
          className={session.authMode === 'login' ? 'active' : ''}
          onClick={() => session.setAuthMode('login')}
        >
          登录
        </button>
        <button
          type="button"
          className={session.authMode === 'register' ? 'active' : ''}
          onClick={() => session.setAuthMode('register')}
        >
          注册
        </button>
      </div>
      {session.authMode === 'login' ? (
        <form onSubmit={session.handleLogin}>
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
      ) : (
        <form onSubmit={session.handleRegister}>
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
      )}
      <PasswordResetModal open={resetModalOpen} onClose={onCloseResetModal} />
    </section>
  );
}
