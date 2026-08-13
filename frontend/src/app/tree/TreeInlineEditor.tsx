import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';

type TreeInlineEditorProps = {
  depth: number;
  initialValue: string;
  placeholder: string;
  icon: string;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<boolean>;
};

/**
 * 树节点内联编辑器（共享）：新建 / 重命名时在同一行内输入名称，Enter 提交 / Esc 取消，
 * 失焦提交，失败后重新聚焦。FolderTree 的 FolderInlineEditor 与 TermCategoryTree 的
 * CategoryInlineEditor 此前逐字相同（各 ~88 行），E4 Slice D 抽为共享组件（消除 100% 重复）。
 */
export function TreeInlineEditor({
  depth,
  initialValue,
  placeholder,
  icon,
  disabled,
  onCancel,
  onSubmit,
}: TreeInlineEditorProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    if (initialValue) {
      inputRef.current?.select();
    }
  }, [initialValue]);

  function cancel() {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onCancel();
  }

  async function submit() {
    if (finishedRef.current) {
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      cancel();
      return;
    }

    finishedRef.current = true;
    const succeeded = await onSubmit(trimmedValue);
    if (!succeeded) {
      finishedRef.current = false;
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  }

  return (
    <div className="tree-row tree-inline-row" style={{ '--tree-depth': depth } as CSSProperties}>
      <span className="tree-inline-icon" aria-hidden="true">{icon}</span>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!disabled) {
            void submit();
          }
        }}
        aria-label={placeholder}
      />
    </div>
  );
}
