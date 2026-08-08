import { useState } from 'react';
import type { FormEvent } from 'react';
import { confirmPasswordReset, requestPasswordReset } from '../../api';
import { PasswordInput } from './PasswordInput';

type PasswordResetModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 'email' | 'confirm' | 'done';

/**
 * 忘记密码重置弹窗（REQ-051，维护态批5）两步：
 * 1) 输入邮箱申请 reset（demo 恒响应，提示从后端日志取 token——无 SMTP 降级）；
 * 2) 输入 token + 新密码确认重置；成功后提示用新密码登录（重置会吊销全部 session）。
 */
export function PasswordResetModal({ open, onClose }: PasswordResetModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  const resetState = () => {
    setStep('email');
    setEmail('');
    setToken('');
    setNewPassword('');
    setNotice('');
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await requestPasswordReset(email.trim());
      setNotice(data.message);
      setToken('');
      setNewPassword('');
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : '申请失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await confirmPasswordReset(token.trim(), newPassword);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请检查 token 或重新申请');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="password-reset-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="重置密码"
      >
        <div className="modal-header">
          <h2>重置密码</h2>
          <button type="button" className="secondary" onClick={handleClose} disabled={busy}>
            关闭
          </button>
        </div>

        <div className="modal-body">
          {step === 'email' ? (
            <form onSubmit={handleRequest}>
              <p className="modal-hint">输入注册邮箱申请重置。demo 模式无邮件发送，重置 token 会写入后端日志。</p>
              <label>
                邮箱
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              {error ? <p className="modal-error">{error}</p> : null}
              <button type="submit" disabled={busy || email.trim().length === 0}>
                {busy ? '提交中…' : '申请重置'}
              </button>
            </form>
          ) : null}

          {step === 'confirm' ? (
            <form onSubmit={handleConfirm}>
              {notice ? <p className="modal-notice">{notice}</p> : null}
              <label>
                重置 token（从后端日志复制）
                <input value={token} onChange={(event) => setToken(event.target.value)} required />
              </label>
              <label>
                新密码（至少 8 位）
                <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              </label>
              {error ? <p className="modal-error">{error}</p> : null}
              <button type="submit" disabled={busy || token.trim().length === 0 || newPassword.length < 8}>
                {busy ? '重置中…' : '重置密码'}
              </button>
            </form>
          ) : null}

          {step === 'done' ? (
            <div className="modal-done">
              <p>密码已重置，全部登录会话已失效，请使用新密码重新登录。</p>
              <button type="button" onClick={handleClose}>
                好的
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
