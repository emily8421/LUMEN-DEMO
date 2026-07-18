import { useState } from 'react';
import type { FormEvent } from 'react';
import type { TermDraft } from './types';
import type { Term, TermWritePayload } from '../api';
import { createTerm, deleteTerm, listTerms, updateTerm } from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseTermsArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

const emptyTermDraft: TermDraft = { term: '', definition: '', aliases: '', status: 'confirmed' };

function normalizeTermDraft(draft: TermDraft): TermWritePayload {
  return {
    term: draft.term.trim(),
    definition: draft.definition.trim(),
    aliases: draft.aliases.split(',').map((alias) => alias.trim()).filter(Boolean),
    status: draft.status,
  };
}

function termToDraft(term: Term): TermDraft {
  return { term: term.term, definition: term.definition, aliases: term.aliases.join(', '), status: term.status };
}

/**
 * REQ-036 空间术语 state + handler。
 *
 * 抽成独立 hook，给 App() 减压（APP-SIZE-C-011）。封装术语列表 / 选中 / 草稿 + 保存 / 删除，
 * 并暴露统一的 selectTerm / newTerm（消除 ContextPane 与 TermsFeature 重复的内联闭包）与
 * reloadTerms / setTerms（供 refreshWorkspace 刷新）。
 *
 * 写操作经 App 注入的 runAction 包装，错误处理（含登录失效）与全局 isBusy / notice 一致。
 */
export function useTerms({ token, runAction, setNotice }: UseTermsArgs) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termDraft, setTermDraft] = useState<TermDraft>(emptyTermDraft);

  const reloadTerms = async () => {
    if (!token) {
      return;
    }
    const result = await listTerms(token);
    setTerms(result.items);
  };

  const selectTerm = (term: Term) => {
    setSelectedTermId(term.id);
    setTermDraft(termToDraft(term));
  };

  const newTerm = () => {
    setSelectedTermId(null);
    setTermDraft(emptyTermDraft);
  };

  const handleSaveTerm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    void runAction('正在保存术语...', async () => {
      const payload = normalizeTermDraft(termDraft);
      const savedTerm = selectedTermId
        ? await updateTerm(token, selectedTermId, payload)
        : await createTerm(token, payload);
      const result = await listTerms(token);
      setTerms(result.items);
      setSelectedTermId(savedTerm.id);
      setTermDraft(termToDraft(savedTerm));
      setNotice(`术语已保存：${savedTerm.term}`);
    });
  };

  const handleDeleteTerm = () => {
    if (!token || !selectedTermId) {
      return;
    }
    const selectedTerm = terms.find((term) => term.id === selectedTermId);
    const termLabel = selectedTerm?.term ?? `#${selectedTermId}`;
    if (!window.confirm(`确认删除术语「${termLabel}」？此操作不可撤销。`)) {
      return;
    }
    void runAction('正在删除术语...', async () => {
      await deleteTerm(token, selectedTermId);
      const result = await listTerms(token);
      setTerms(result.items);
      setSelectedTermId(null);
      setTermDraft(emptyTermDraft);
      setNotice('术语已删除。');
    });
  };

  return {
    terms,
    setTerms,
    selectedTermId,
    termDraft,
    setTermDraft,
    selectTerm,
    newTerm,
    handleSaveTerm,
    handleDeleteTerm,
    reloadTerms,
  };
}
