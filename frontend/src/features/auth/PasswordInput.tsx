import { useState } from 'react';

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
};

/**
 * 密码输入框 + 小眼睛显隐 toggle（REQ-051，维护态批5），复用于登录 / 注册 / 重置。
 * 受控组件：value / onChange，外层 form 的 label 结构保持不变。
 */
export function PasswordInput({ value, onChange, autoComplete, placeholder }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? '隐藏密码' : '显示密码'}
      >
        {visible ? '隐藏' : '显示'}
      </button>
    </div>
  );
}
