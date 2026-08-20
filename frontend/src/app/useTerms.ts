import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { TermDraft, TermPaneMode } from './types';
import type { Term, TermWritePayload } from '../api';
import { createTerm, deleteTerm, listTerms, updateTerm } from '../api';
import { createResponseOwnership } from './response-ownership';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseTermsArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

const emptyTermDraft: TermDraft = {
  term: '',
  definition: '',
  aliases: '',
  status: 'confirmed',
  category_id: null,
  category: '',
  source: '',
};

function normalizeTermDraft(draft: TermDraft): TermWritePayload {
  return {
    term: draft.term.trim(),
    definition: draft.definition.trim(),
    aliases: draft.aliases.split(',').map((alias) => alias.trim()).filter(Boolean),
    status: draft.status,
    category_id: draft.category_id,
    category: draft.category.trim() || null,
    source: draft.source.trim() || null,
  };
}

function termToDraft(term: Term): TermDraft {
  return {
    term: term.term,
    definition: term.definition,
    aliases: term.aliases.join(', '),
    status: term.status,
    category_id: term.category_id,
    category: term.category ?? '',
    source: term.source ?? '',
  };
}

/**
 * REQ-036 空间术语 state + handler。
 *
 * 抽成独立 hook，给 App() 减压（APP-SIZE-C-011）。封装术语列表 / 选中 / 草稿 + 保存 / 删除，
 * 并暴露统一的 selectTerm / newTerm（消除 ContextPane 与 TermsFeature 重复的内联闭包）与
 * reloadTerms / setTerms（供 refreshWorkspace 刷新）。
 *
 * 术语管理增强（REQ-036 领域树，migration 017）：
 * - TermDraft 扩 category_id / category / source 三字段（读写透传）。
 * - 阅读/编辑态分离（用户确认）：selectTerm 进入 view（阅读态），beginEdit / newTerm 进入
 *   edit（编辑态）。view 时表单只读展示，edit 时才可编辑保存。
 */
export function useTerms({ token, currentSpaceId, runAction, setNotice }: UseTermsArgs) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termDraft, setTermDraft] = useState<TermDraft>(emptyTermDraft);
  const [paneMode, setPaneMode] = useState<TermPaneMode>('view');
  const responseOwnership = useRef(createResponseOwnership());
  const scope = JSON.stringify([token ?? null, currentSpaceId ?? null]);
  responseOwnership.current.setScope(scope);

  const reloadTerms = async () => {
    if (!token) {
      return;
    }
    if (!responseOwnership.current.isCurrentScope(scope)) {
      return;
    }
    const ticket = responseOwnership.current.begin();
    const result = await listTerms(token);
    if (responseOwnership.current.owns(ticket)) {
      setTerms(result.items);
    }
  };

  const selectTerm = (term: Term) => {
    setSelectedTermId(term.id);
    setTermDraft(termToDraft(term));
    setPaneMode('view');
  };

  const beginEdit = () => {
    setPaneMode('edit');
  };

  /** 新建术语；``categoryId`` 非空时预填到该领域（左栏「在此新建术语」）。 */
  const newTerm = (categoryId: number | null = null) => {
    setSelectedTermId(null);
    setTermDraft({ ...emptyTermDraft, category_id: categoryId });
    setPaneMode('edit');
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
      setPaneMode('view');
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
      setPaneMode('view');
      setNotice('术语已删除。');
    });
  };

  return {
    terms,
    setTerms,
    selectedTermId,
    termDraft,
    paneMode,
    setTermDraft,
    selectTerm,
    beginEdit,
    newTerm,
    handleSaveTerm,
    handleDeleteTerm,
    reloadTerms,
  };
}
