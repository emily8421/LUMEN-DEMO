/**
 * 本地挂载内联输入框（Slice E 从 LocalMountTreeView 抽出，纯展示）。
 * 目录「新建文件」与文件「重命名」共用：Enter 提交、Escape 取消、blur 提交。
 */
interface LocalMountInlineInputProps {
  value: string;
  placeholder?: string;
  ariaLabel: string;
  isBusy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onBlur: () => void;
}

export function LocalMountInlineInput({
  value,
  placeholder,
  ariaLabel,
  isBusy,
  onChange,
  onSubmit,
  onCancel,
  onBlur,
}: LocalMountInlineInputProps) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      autoFocus
      disabled={isBusy}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit();
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={onBlur}
      aria-label={ariaLabel}
    />
  );
}
