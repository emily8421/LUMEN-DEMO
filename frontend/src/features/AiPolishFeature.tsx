import { useEffect, useRef } from 'react';
import type { PolishMode, PolishView } from '../api';
import type { AiPolishSelection } from '../app/useAiPolish';
import { MarkdownBlock } from '../components/MarkdownBlock';

type PolishPhase = 'idle' | 'loading' | 'generated' | 'error';

type AiPolishFeatureProps = {
  selection: AiPolishSelection | null;
  mode: PolishMode;
  instruction: string;
  result: PolishView | null;
  phase: PolishPhase;
  errorMessage: string;
  canWrite: boolean;
  isBusy: boolean;
  onModeChange: (mode: PolishMode) => void;
  onInstructionChange: (value: string) => void;
  onRequestPolish: () => void;
  onApply: () => void;
  onDiscard: () => void;
  onOpenDocument: (documentId: number, title: string) => void;
};

/**
 * REQ-014 AI 润色 / 写作引用侧边栏（Phase2B 首批，前端 half）。
 *
 * 挂文档工作区 inspector 右栏（PG-P2-003 / CMP-P2-AI-POLISH / FL-P2-008）：
 * 选区触发 → mode=polish / citation + 可选 instruction → 草稿预览 + sources → 应用（替换选区 + 版本）/ 丢弃。
 * 降级：5030→「AI 暂不可用，可重试」；无来源→output「未找到可引用来源」（成功草稿，非错误）；只读→禁用触发。
 */
export function AiPolishFeature({
  selection,
  mode,
  instruction,
  result,
  phase,
  errorMessage,
  canWrite,
  isBusy,
  onModeChange,
  onInstructionChange,
  onRequestPolish,
  onApply,
  onDiscard,
  onOpenDocument,
}: AiPolishFeatureProps) {
  // 草稿生成后把「应用 / 丢弃」滚进视野，避免按钮被 inspector-list 折叠遮挡。
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [result]);

  if (!canWrite) {
    return (
      <section className="ai-polish-block" aria-label="AI 润色">
        <div className="subsection-heading">
          <strong>AI 润色</strong>
          <span>REQ-014</span>
        </div>
        <p className="empty-state">只读文档不可润色。</p>
      </section>
    );
  }

  const canTrigger = selection != null && phase !== 'loading' && !isBusy;

  return (
    <section className="ai-polish-block" aria-label="AI 润色">
      <div className="subsection-heading">
        <strong>AI 润色</strong>
        <span>REQ-014</span>
      </div>

      <fieldset className="ai-polish-mode-fieldset">
        <legend>模式</legend>
        <div className="ai-polish-mode-group">
          <label className={mode === 'polish' ? 'ai-polish-mode active' : 'ai-polish-mode'}>
            <input
              type="radio"
              name="ai-polish-mode"
              checked={mode === 'polish'}
              onChange={() => onModeChange('polish')}
              disabled={isBusy}
            />
            <span>润色</span>
          </label>
          <label className={mode === 'citation' ? 'ai-polish-mode active' : 'ai-polish-mode'}>
            <input
              type="radio"
              name="ai-polish-mode"
              checked={mode === 'citation'}
              onChange={() => onModeChange('citation')}
              disabled={isBusy}
            />
            <span>引用</span>
          </label>
        </div>
      </fieldset>

      <label className="ai-polish-field">
        <span>要求（可选）</span>
        <input
          className="ai-polish-instruction"
          value={instruction}
          onChange={(event) => onInstructionChange(event.target.value)}
          placeholder={mode === 'citation' ? '引用 XX 相关内容' : '更简洁 / 更正式'}
          disabled={isBusy}
        />
      </label>

      <button type="button" className="ai-polish-trigger" onClick={onRequestPolish} disabled={!canTrigger}>
        {phase === 'loading' ? '生成中…' : '生成草稿'}
      </button>

      {selection == null && phase !== 'loading' ? (
        <p className="empty-state">在正文选中片段后触发。</p>
      ) : null}

      {phase === 'error' ? <p className="ai-polish-error">{errorMessage}</p> : null}

      {result ? (
        <div className="ai-polish-result">
          <div className="subsection-heading">
            <strong>草稿预览</strong>
            <span>{result.status}</span>
          </div>
          <MarkdownBlock content={result.output_md} emptyText="（空草稿）" className="compact-markdown" />
          {result.sources.length > 0 ? (
            <div className="ai-polish-sources">
              <div className="subsection-heading">
                <strong>引用来源</strong>
                <span>仅当前可见</span>
              </div>
              <ul>
                {result.sources.map((source) => (
                  <li key={source.chunk_id}>
                    <button
                      type="button"
                      className="ai-polish-source"
                      onClick={() => onOpenDocument(source.document_id, source.title)}
                      disabled={isBusy}
                    >
                      <strong>{source.title}</strong>
                      <small>{source.snippet}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div ref={actionsRef} className="ai-polish-actions">
            <button type="button" onClick={onApply} disabled={isBusy}>
              应用（替换选区）
            </button>
            <button type="button" className="secondary" onClick={onDiscard} disabled={isBusy}>
              丢弃
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
