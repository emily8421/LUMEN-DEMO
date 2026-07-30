import { useCallback, useRef } from 'react';

/**
 * 捕获 textarea 非空选区并回调（text, start, end）。
 * 光标移动（空选区）不触发，避免误清上层状态（如 AI 润色草稿）。
 * 给 DocumentsFeature 编辑器选区感知用（REQ-014 AI 润色触发；WSG：从 DocumentsFeature 抽出减压）。
 * 返回类型不显式标注，让 TS 按 useRef 推断，与编辑器 ref prop 直接兼容。
 */
export function useTextareaSelection(onChange: (text: string, start: number, end: number) => void) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const onSelect = useCallback(() => {
    const textarea = ref.current;
    if (!textarea) {
      return;
    }
    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart !== selectionEnd) {
      onChange(value.slice(selectionStart, selectionEnd), selectionStart, selectionEnd);
    }
  }, [onChange]);
  return { ref, onSelect };
}
