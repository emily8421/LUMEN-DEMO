import { useRef } from 'react';
import type { RefObject } from 'react';
import type { Draft } from '../../app/types';

interface UndoSnapshot {
  text: string;
  start: number;
  end: number;
}

/**
 * 受控 textarea 自建撤销栈（Slice E 从 DocumentsFeature 抽出）。
 * 浏览器原生 Ctrl+Z 被受控组件破坏，需自建：每次输入 / 工具插入前压栈，Ctrl+Z 出栈恢复内容与光标。
 * 上限 50 步，超出丢弃最旧。栈随宿主组件（DocumentEditorForm）卸载而销毁——
 * 编辑会话边界（切文档 / 新建 / 保存时主组件切回阅读态）自然重置栈，无需显式 reset effect。
 */
export function useEditorUndoStack(
  draft: Draft,
  onDraftChange: (draft: Draft) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
): { pushUndoSnapshot: () => void; handleUndo: () => void } {
  const undoStackRef = useRef<Array<UndoSnapshot>>([]);
  const UNDO_MAX = 50;

  /** 记录一次可撤销快照（工具插入 / 手动输入前调用）。 */
  const pushUndoSnapshot = () => {
    const textarea = textareaRef.current;
    const text = textarea?.value ?? draft.content_md;
    const { selectionStart = 0, selectionEnd = 0 } = textarea ?? {};
    const stack = undoStackRef.current;
    // 连续相同内容不重复入栈（避免同一次输入多次 onChange 堆栈）。
    const last = stack[stack.length - 1];
    if (last && last.text === text) {
      return;
    }
    stack.push({ text, start: selectionStart, end: selectionEnd });
    if (stack.length > UNDO_MAX) {
      stack.shift();
    }
  };

  /** Ctrl+Z：出栈恢复上一步内容与光标。 */
  const handleUndo = () => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) {
      return;
    }
    onDraftChange({ ...draft, content_md: snapshot.text });
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(snapshot.start, snapshot.end);
    });
  };

  return { pushUndoSnapshot, handleUndo };
}
