import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { QuickEntryMode, QuickEntryView } from '../api';
import { captureQuickEntry, discardQuickEntry } from '../api';
import type { RunAction } from './types';

type UseQuickEntryArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
  /** create_document / append_document 成功后刷新文档列表（新文档入列、追加内容生效）。 */
  onDocumentsChanged: () => void;
};

/**
 * REQ-025 快速录入 state + handler（Phase2A 最小版）。
 *
 * 抽成独立 hook，给 App() 减压（APP-SIZE-C-011）。封装：
 * - 抽屉开关 + 表单字段（标题 / 来源 / 摘要 / tag_ids / mode / append 目标文档）；
 * - capture（draft / create_document / append_document）与 discard（仅 draft）写操作；
 * - 录入成功后保留 lastEntry，供 UI 显示「丢弃草稿」或「打开文档」。
 *
 * discard 最小版：后端无 list endpoint，只能丢弃最近一次录入的 draft（lastEntry）；
 * 关闭抽屉或下一次录入后 entry id 不再保留，无法事后丢弃。
 *
 * 写操作经 App 传入的 runAction 包装，错误处理（含登录失效）与全局 isBusy / notice 一致。
 */
export function useQuickEntry({
  token,
  currentSpaceId,
  runAction,
  setNotice,
  onDocumentsChanged,
}: UseQuickEntryArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [contentMd, setContentMd] = useState('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [mode, setMode] = useState<QuickEntryMode>('create_document');
  const [targetDocumentId, setTargetDocumentId] = useState<number | null>(null);
  const [lastEntry, setLastEntry] = useState<QuickEntryView | null>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setSource('');
    setContentMd('');
    setTagIds([]);
    setMode('create_document');
    setTargetDocumentId(null);
  }, []);

  // token / 空间变化（含登出）→ 关闭抽屉并重置表单与结果。
  useEffect(() => {
    setIsOpen(false);
    resetForm();
    setLastEntry(null);
  }, [token, currentSpaceId, resetForm]);

  const open = useCallback(() => {
    // 保留 lastEntry：关闭再打开仍能看到上次录入（含 draft 可丢弃），录入新条目才覆盖。
    // 后端最小版无 list endpoint，仅保留最近一次；刷新页面 / 切空间 / 登出仍会丢失。
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleTag = useCallback((tagId: number) => {
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }, []);

  const changeMode = useCallback((nextMode: QuickEntryMode) => {
    setMode(nextMode);
    // 仅 append_document 允许 target_document_id；切走时清空，避免后端 4220。
    if (nextMode !== 'append_document') {
      setTargetDocumentId(null);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }
    if (mode === 'append_document' && targetDocumentId == null) {
      setNotice('追加到已有文档需要先选择目标文档。');
      return;
    }
    void runAction('正在录入...', async () => {
      const view = await captureQuickEntry(token, {
        title: trimmedTitle,
        content_md: contentMd,
        source: source.trim() || null,
        target_document_id: mode === 'append_document' ? targetDocumentId : null,
        tag_ids: tagIds,
        mode,
      });
      setLastEntry(view);
      resetForm();
      if (view.status === 'converted') {
        onDocumentsChanged();
        setNotice(convertedNotice(view, mode));
      } else {
        setNotice('已保存草稿，可继续录入或丢弃。');
      }
    });
  };

  const handleDiscard = () => {
    if (!token || !lastEntry) {
      return;
    }
    const entryId = lastEntry.id;
    void runAction('正在丢弃草稿...', async () => {
      await discardQuickEntry(token, entryId);
      setLastEntry(null);
      setNotice('已丢弃草稿。');
    });
  };

  return {
    isOpen,
    title,
    source,
    contentMd,
    tagIds,
    mode,
    targetDocumentId,
    lastEntry,
    setTitle,
    setSource,
    setContentMd,
    toggleTag,
    changeMode,
    setTargetDocumentId,
    open,
    close,
    handleSubmit,
    handleDiscard,
  };
}

function convertedNotice(view: QuickEntryView, mode: QuickEntryMode): string {
  if (mode === 'create_document') {
    return `已转为新文档（#${view.created_document_id}）。`;
  }
  if (mode === 'append_document') {
    return `已追加到文档（#${view.target_document_id}）。`;
  }
  return '已录入。';
}
