import { useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { LlmConfigMeta } from '../api';
import type { AiMessage } from '../app/useAiAssistant';
import { MarkdownBlock } from '../components/MarkdownBlock';

type AiAssistantProps = {
  isOpen: boolean;
  messages: AiMessage[];
  draft: string;
  sending: boolean;
  useKnowledgeBase: boolean;
  /** 可用 LLM 通道（脱敏元信息），用于下拉切换（2026-08-08 多配置切换）。 */
  llmConfigs: LlmConfigMeta[];
  llmProvider: string;
  onLlmProviderChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onDraftChange: (value: string) => void;
  onToggleKnowledgeBase: () => void;
  onSend: () => void;
  onOpenDocument: (documentId: number, title: string) => void;
};

/**
 * 批3 AI 助手悬浮窗（输入材料 §4.5 / §6.3）。
 *
 * 右下角默认收起为悬浮图标，点击展开对话抽屉：标题栏（最小化 / 关闭）、
 * 对话区（多轮气泡 + 答案来源可点开文档）、底部输入框 +「基于知识库」勾选 + 发送。
 * 勾选 = RAG 检索增强问答；关闭 = 通用对话（后端 use_knowledge_base=false）。
 * 悬浮窗不抢主画面：任意视图可用，Esc / 最小化收起为图标。
 */
export function AiAssistant({
  isOpen,
  messages,
  draft,
  sending,
  useKnowledgeBase,
  llmConfigs,
  llmProvider,
  onLlmProviderChange,
  onOpen,
  onClose,
  onDraftChange,
  onToggleKnowledgeBase,
  onSend,
  onOpenDocument,
}: AiAssistantProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 新消息 / 抽屉打开 → 对话区滚到底部；输入框聚焦。
  useEffect(() => {
    if (isOpen) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, sending]);

  // 抽屉打开时全局 Esc 收起为悬浮图标（不依赖输入框焦点）。
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return (
      <button type="button" className="ai-assistant-fab" onClick={onOpen} aria-label="打开 AI 助手" title="AI 助手">
        ✨
      </button>
    );
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <section className="ai-assistant-drawer" aria-label="AI 助手">
      <header className="ai-assistant-header">
        <strong>AI 助手</strong>
        <span className={`ai-assistant-scope${useKnowledgeBase ? '' : ' generic'}`}>
          {useKnowledgeBase ? '基于知识库' : '通用对话'}
        </span>
        <div className="ai-assistant-header-actions">
          <button type="button" className="ai-assistant-icon-button" onClick={onClose} aria-label="最小化" title="最小化">
            —
          </button>
          <button type="button" className="ai-assistant-icon-button" onClick={onClose} aria-label="关闭" title="关闭">
            ✕
          </button>
        </div>
      </header>

      <div className="ai-assistant-messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="ai-assistant-empty">可以快速问我一个问题。</p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`ai-message ${message.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}${
                message.isError ? ' ai-message-error' : ''
              }`}
            >
              {message.role === 'assistant' ? (
                <MarkdownBlock content={message.content} className="compact-markdown" />
              ) : (
                <p>{message.content}</p>
              )}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 ? (
                <div className="ai-message-sources">
                  <span className="ai-message-sources-label">来源（{message.sources.length}）</span>
                  <ul>
                    {message.sources.map((source, index) => (
                      <li key={`${source.title}-${index}`}>
                        {source.doc_id != null ? (
                          <button type="button" onClick={() => onOpenDocument(source.doc_id as number, source.title)}>
                            {source.title}
                          </button>
                        ) : (
                          <span>{source.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))
        )}
        {sending ? <p className="ai-message-typing">AI 思考中…</p> : null}
      </div>

      <footer className="ai-assistant-input-row">
        <div className="ai-assistant-controls">
          <label className="ai-assistant-kb-toggle">
            <input type="checkbox" checked={useKnowledgeBase} onChange={onToggleKnowledgeBase} disabled={sending} />
            基于知识库
          </label>
          {llmConfigs.length > 0 ? (
            <label className="ai-assistant-provider">
              通道
              <select value={llmProvider} onChange={(event) => onLlmProviderChange(event.target.value)} disabled={sending}>
                <option value="">默认</option>
                {llmConfigs.map((config) => (
                  <option key={config.name} value={config.name} disabled={!config.enabled}>
                    {config.name} · {config.model}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <textarea
          ref={inputRef}
          className="ai-assistant-input"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="今天想跟 AI 聊点啥？"
          rows={2}
          aria-label="问题输入"
        />
        <button type="button" className="ai-assistant-send" onClick={onSend} disabled={sending || draft.trim().length === 0}>
          {sending ? '…' : '发送'}
        </button>
      </footer>
    </section>
  );
}
