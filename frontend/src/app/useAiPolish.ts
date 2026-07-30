import { useCallback, useEffect, useState } from 'react';
import type { KnowledgeDocument, PolishMode, PolishView } from '../api';
import { polishDocument } from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

export type AiPolishSelection = {
  text: string;
  start: number;
  end: number;
};

type UseAiPolishArgs = {
  token: string | undefined;
  userId: number | undefined;
  selectedDocument: KnowledgeDocument | null;
  isCreating: boolean;
  /** 当前正文：apply 时按 selection.start/end 替换选区。 */
  contentMd: string;
  runAction: RunAction;
  setNotice: (message: string) => void;
  /** 应用：替换选区为 output_md 后保存（PUT update → 版本）。 */
  onApplyContent: (newContentMd: string) => void;
};

type PolishPhase = 'idle' | 'loading' | 'generated' | 'error';

const UNAVAILABLE_HINT = 'AI 暂不可用，可重试';

function isExternalPermission(permission: string): boolean {
  // 后端用 'external'，前端类型为 'external_readonly'；两种都按只读处理。
  return permission === 'external' || permission === 'external_readonly';
}

function friendlyPolishError(message: string): string {
  return message.includes('AI service') ? UNAVAILABLE_HINT : message;
}

/**
 * REQ-014 AI 润色 state + handler（Phase2B 首批，前端 half）。
 *
 * 仿 useQuickEntry 抽独立 hook 给 App 减压。封装：
 * - textarea 选区捕获（{text, start, end}）；
 * - mode（polish / citation）+ instruction；
 * - polish 请求（runAction 包装；错误含 5030/4003/4004/4220）；
 * - apply（替换选区 + onApplyContent 保存留版本；带 selection 失效守卫）；
 * - discard（本地清预览；后端无 discard endpoint）。
 *
 * canWrite：external + 非 owner 禁用触发（只读护栏，后端 4003 兜底）。
 */
export function useAiPolish({
  token,
  userId,
  selectedDocument,
  isCreating,
  contentMd,
  runAction,
  setNotice,
  onApplyContent,
}: UseAiPolishArgs) {
  const [selection, setSelection] = useState<AiPolishSelection | null>(null);
  const [mode, setMode] = useState<PolishMode>('polish');
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState<PolishView | null>(null);
  const [phase, setPhase] = useState<PolishPhase>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 文档 / token 变化（切文档、登出）→ 清空选区、草稿与错误。
  useEffect(() => {
    setSelection(null);
    setResult(null);
    setPhase('idle');
    setErrorMessage('');
    setInstruction('');
  }, [selectedDocument?.id, token]);

  const canWrite =
    selectedDocument != null &&
    (!isExternalPermission(selectedDocument.permission) || selectedDocument.owner_id === userId);

  const changeSelection = useCallback((text: string, start: number, end: number) => {
    if (text.trim().length === 0) {
      setSelection(null);
      return;
    }
    setSelection({ text, start, end });
    // 新选区 → 清掉上一次草稿，避免张冠李戴。
    setResult(null);
    setPhase('idle');
    setErrorMessage('');
  }, []);

  const requestPolish = useCallback(() => {
    if (!token || !selectedDocument || !selection) {
      return;
    }
    void runAction('正在生成 AI 草稿...', async () => {
      setPhase('loading');
      setErrorMessage('');
      try {
        const view = await polishDocument(token, selectedDocument.id, {
          mode,
          selection_md: selection.text,
          instruction: instruction.trim() || null,
          use_sources: mode === 'citation',
        });
        setResult(view);
        setPhase('generated');
        setNotice(view.sources.length === 0 && view.output_md ? '已生成草稿。' : '已生成草稿，可预览后应用。');
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : '生成失败';
        setPhase('error');
        setErrorMessage(friendlyPolishError(message));
        setNotice(friendlyPolishError(message));
      }
    });
  }, [token, selectedDocument, selection, mode, instruction, runAction, setNotice]);

  const apply = useCallback(() => {
    if (!result || !selection) {
      return;
    }
    // selection 失效守卫：正文自选区后若被改动，区间不再匹配 → 提示重选，不乱插。
    if (contentMd.slice(selection.start, selection.end) !== selection.text) {
      setPhase('error');
      setErrorMessage('选区已失效（正文改动过），请重新选择片段。');
      setNotice('选区已失效，请重新选择片段。');
      return;
    }
    const nextContent =
      contentMd.slice(0, selection.start) + result.output_md + contentMd.slice(selection.end);
    onApplyContent(nextContent);
    // 应用后清本地预览；保存（PUT→版本）由 useDocuments 负责，成功会刷新 draft + 版本。
    setResult(null);
    setSelection(null);
    setPhase('idle');
    setErrorMessage('');
  }, [result, selection, contentMd, onApplyContent, setNotice]);

  const discard = useCallback(() => {
    setResult(null);
    setPhase('idle');
    setErrorMessage('');
    setNotice('已丢弃 AI 草稿。');
  }, [setNotice]);

  return {
    selection,
    mode,
    instruction,
    result,
    phase,
    errorMessage,
    canWrite: canWrite && !isCreating,
    changeSelection,
    setMode,
    setInstruction,
    requestPolish,
    apply,
    discard,
  };
}
