import type { QueryResponse } from '../api';
import { MarkdownBlock } from '../components/MarkdownBlock';

type QueryFeatureProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  queryResult: QueryResponse | null;
  isBusy: boolean;
  onQuery: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenDocument: (documentId: number | null, title: string) => void;
  /** 空态引导：去新建文档（Sprint-25 L1）。 */
  onCreateDocument: () => void;
  /** 空态引导：去导入（Sprint-25 L1）。 */
  onOpenImport: () => void;
};

export function QueryFeature({
  question,
  onQuestionChange,
  queryResult,
  isBusy,
  onQuery,
  onOpenDocument,
  onCreateDocument,
  onOpenImport,
}: QueryFeatureProps) {
  return (
    <section className="query-panel focus-panel task-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>RAG 问答</h2>
        </div>
        <span className="badge success">答案必须带来源</span>
      </div>
      <div className="query-workspace-grid">
        <div className="answer-pane">
          <form className="compact-form focus-form task-input" onSubmit={onQuery}>
            <label>
              问题
              <textarea
                className="question-input"
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                placeholder="例如：场景联动触发延迟是多少？"
                rows={2}
              />
            </label>
            <button type="submit" disabled={isBusy || question.trim().length === 0}>提问</button>
          </form>
          {!queryResult ? (
            <div className="empty-state-guide task-empty">
              <p>先新建或导入文档——示例文档<strong>未建索引</strong>，只有新建 / 导入的文档才会进入问答。</p>
              <div className="empty-state-actions">
                <button type="button" className="secondary" onClick={onCreateDocument} disabled={isBusy}>去新建文档</button>
                <button type="button" className="secondary" onClick={onOpenImport} disabled={isBusy}>去导入</button>
              </div>
            </div>
          ) : (
            <div className="answer-box answer-body">
              <strong>答案</strong>
              <MarkdownBlock content={queryResult.answer} />
            </div>
          )}
        </div>
        <aside className="sources-panel inspector-pane">
          <div className="inspector-header">
            <h2>来源</h2>
            <span className="badge">{queryResult?.sources.length ?? 0} 条</span>
          </div>
          {!queryResult ? (
            <p className="empty-state inspector-empty">答案生成后显示来源。</p>
          ) : queryResult.sources.length === 0 ? (
            <p className="empty-state inspector-empty">暂无来源。</p>
          ) : (
            <ul className="result-list inspector-list">
              {queryResult.sources.map((source, index) => (
                <li key={`${source.title}-${index}`}>
                  <article className={`result-card source-row ${source.doc_id ? '' : 'muted'}`.trim()}>
                    {source.doc_id ? (
                      <button
                        type="button"
                        className="result-open-button"
                        onClick={() => onOpenDocument(source.doc_id, source.title)}
                      >
                        <strong>{source.title}</strong>
                      </button>
                    ) : (
                      <strong>{source.title}</strong>
                    )}
                    <small>{source.source_type === 'term' ? '术语来源' : '文档来源'} · {source.doc_id ? `doc #${source.doc_id}` : '无文档 ID'}</small>
                    <MarkdownBlock content={source.snippet} className="compact-markdown" />
                  </article>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}