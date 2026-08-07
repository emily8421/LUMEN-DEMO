import { useCallback, useEffect, useRef, useState } from 'react';
import type { LlmConfigMeta, QueryTurn, RagSource } from '../api';
import { getLlmConfigs, queryKnowledgeBase } from '../api';

export type AiMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: RagSource[];
  isError?: boolean;
};

type UseAiAssistantArgs = {
  token: string | undefined;
};

/**
 * 批3 AI 抽屉（右下角悬浮助手）：多轮对话 state + handler。
 *
 * - 多轮走「路径 A」：前端维护 messages，发送时把历史拼传给后端（/api/query history），
 *   后端把历史拼进 LLM prompt；RAG 检索仍只基于当前问题。
 * - 「基于知识库」开关：勾选=RAG 检索增强问答（默认）；关闭=通用对话（use_knowledge_base=false）。
 * - 抽屉对话用局部 sending 态，不占用全局 isBusy（悬浮窗不抢主画面）；
 *   失败把错误文案作为 assistant 消息就地显示，不打断主流程。
 * - draft / useKnowledgeBase / messages / sending 用 ref 镜像最新值，避免 handleSend 闭包
 *   陈旧（勾选开关后立即发送等连续操作读旧值）。
 * - 空间切换后应调用 reset() 清空对话（复用既有「空间切换清问答」约定）。
 */
export function useAiAssistant({ token }: UseAiAssistantArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraftState] = useState('');
  const [useKnowledgeBase, setUseKnowledgeBaseState] = useState(true);
  const [messages, setMessagesState] = useState<AiMessage[]>([]);
  const [sending, setSendingState] = useState(false);
  const [llmConfigs, setLlmConfigs] = useState<LlmConfigMeta[]>([]);
  const [llmProvider, setLlmProviderState] = useState('');
  const seqRef = useRef(0);

  // 最新值镜像（handleSend 读这些，闭包永不陈旧）。
  const draftRef = useRef('');
  const kbRef = useRef(true);
  const messagesRef = useRef<AiMessage[]>([]);
  const sendingRef = useRef(false);
  const llmProviderRef = useRef('');

  const setDraft = useCallback((value: string) => {
    draftRef.current = value;
    setDraftState(value);
  }, []);

  const setUseKnowledgeBase = useCallback((value: boolean) => {
    kbRef.current = value;
    setUseKnowledgeBaseState(value);
  }, []);

  const setMessages = useCallback((updater: (current: AiMessage[]) => AiMessage[]) => {
    setMessagesState((current) => {
      const next = updater(current);
      messagesRef.current = next;
      return next;
    });
  }, []);

  const setSending = useCallback((value: boolean) => {
    sendingRef.current = value;
    setSendingState(value);
  }, []);

  const setLlmProvider = useCallback((value: string) => {
    llmProviderRef.current = value;
    setLlmProviderState(value);
  }, []);

  /** 拉取可用 LLM 通道（脱敏元信息），供抽屉下拉切换；token 变化时自动刷新。 */
  const reloadConfigs = useCallback(() => {
    if (!token) {
      return;
    }
    void getLlmConfigs(token)
      .then((configs) => setLlmConfigs(configs))
      .catch(() => setLlmConfigs([]));
  }, [token]);

  useEffect(() => {
    reloadConfigs();
  }, [reloadConfigs]);

  /** 打开抽屉；可带入初始问题（批2a 命令面板「问 AI」→ 开抽屉并预填）。 */
  const open = useCallback(
    (question?: string) => {
      setDraft(question ?? '');
      setIsOpen(true);
    },
    [setDraft],
  );

  /** 收起为右下角悬浮图标。 */
  const close = useCallback(() => setIsOpen(false), []);

  /** 空间切换时清空对话（避免跨空间上下文串扰）。 */
  const reset = useCallback(() => setMessages(() => []), [setMessages]);

  const handleSend = useCallback(async () => {
    const question = draftRef.current.trim();
    if (!question || !token || sendingRef.current) {
      return;
    }
    // 发送前的历史（不含本轮的 user 消息）作为多轮上下文传给后端。
    const history: QueryTurn[] = messagesRef.current.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const userMessage: AiMessage = { id: seqRef.current, role: 'user', content: question };
    seqRef.current += 1;
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setSending(true);
    try {
      const result = await queryKnowledgeBase(token, question, {
        history,
        useKnowledgeBase: kbRef.current,
        llmProvider: llmProviderRef.current || undefined,
      });
      setMessages((current) => [
        ...current,
        { id: seqRef.current, role: 'assistant', content: result.answer, sources: result.sources },
      ]);
      seqRef.current += 1;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '请求失败，请稍后重试。';
      setMessages((current) => [...current, { id: seqRef.current, role: 'assistant', content: message, isError: true }]);
      seqRef.current += 1;
    } finally {
      setSending(false);
    }
  }, [token, setDraft, setMessages, setSending]);

  const toggleKnowledgeBase = useCallback(() => {
    setUseKnowledgeBase(!kbRef.current);
  }, [setUseKnowledgeBase]);

  return {
    isOpen,
    open,
    close,
    reset,
    draft,
    setDraft,
    useKnowledgeBase,
    setUseKnowledgeBase,
    toggleKnowledgeBase,
    llmConfigs,
    llmProvider,
    setLlmProvider,
    messages,
    sending,
    handleSend,
  };
}
