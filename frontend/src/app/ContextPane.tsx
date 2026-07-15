import type { DocumentPermission, KnowledgeDocument, Space, Term } from '../api';
import type { ImportDraft } from './types';
import type { ActiveView } from './WorkspaceViewNav';
import { permissionLabels } from './constants';

type ContextPaneProps = {
  activeView: ActiveView;
  currentSpace: Space | null;
  documents: KnowledgeDocument[];
  selectedId: number | null;
  isCreating: boolean;
  isBusy: boolean;
  onCreateDocument: () => void;
  onSelectDocument: (documentId: number) => void;
  importDraft: ImportDraft;
  onImportDraftChange: (draft: ImportDraft) => void;
  importFile: File | null;
  onImportFileChange: (file: File | null) => void;
  importInputKey: number;
  lastImportSummary: string;
  onImport: (event: React.FormEvent<HTMLFormElement>) => void;
  terms: Term[];
  selectedTermId: number | null;
  onSelectTerm: (term: Term) => void;
  onNewTerm: () => void;
};

export function ContextPane({
  activeView,
  currentSpace,
  documents,
  selectedId,
  isCreating,
  isBusy,
  onCreateDocument,
  onSelectDocument,
  importDraft,
  onImportDraftChange,
  importFile,
  onImportFileChange,
  importInputKey,
  lastImportSummary,
  onImport,
  terms,
  selectedTermId,
  onSelectTerm,
  onNewTerm,
}: ContextPaneProps) {
  return (
    <aside className={`sidebar context-pane context-${activeView}`.trim()}>
      {activeView === 'documents' ? (
        <>
          <section className="context-header section-title">
            <div>
              <h2>文档</h2>
              <p className="empty-state">当前空间 {documents.length} 篇</p>
            </div>
            <button type="button" onClick={onCreateDocument} disabled={isBusy}>新建</button>
          </section>
          {documents.length === 0 ? (
            <p className="empty-state context-empty">当前空间暂无可见文档。</p>
          ) : (
            <ul className="document-list context-list">
              {documents.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    className={document.id === selectedId && !isCreating ? 'active' : ''}
                    onClick={() => onSelectDocument(document.id)}
                  >
                    <span>{document.title}</span>
                    <small>{permissionLabels[document.permission]} · v{document.current_version}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <section className="import-panel context-footer">
            <div className="subsection-heading">
              <strong>导入文本</strong>
              <span>仅 .txt / .md；真实 PDF / OCR 后续阶段</span>
            </div>
            <form className="compact-form" onSubmit={onImport}>
              <label>
                文件
                <input
                  key={importInputKey}
                  type="file"
                  accept=".md,.txt,text/markdown,text/plain"
                  onChange={(event) => onImportFileChange(event.target.files?.[0] ?? null)}
                />
              </label>
              <label>
                标题（可选）
                <input
                  value={importDraft.title}
                  onChange={(event) => onImportDraftChange({ ...importDraft, title: event.target.value })}
                  placeholder="留空则使用文件名"
                />
              </label>
              <label>
                权限
                <select
                  value={importDraft.permission}
                  onChange={(event) => onImportDraftChange({ ...importDraft, permission: event.target.value as DocumentPermission })}
                >
                  {Object.entries(permissionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={isBusy || !importFile}>导入</button>
            </form>
            {lastImportSummary ? <p className="import-summary">{lastImportSummary}</p> : null}
          </section>
        </>
      ) : null}

      {activeView === 'search' ? (
        <>
          <section className="context-header">
            <div className="section-title stacked">
              <h2>搜索上下文</h2>
              <p className="empty-state">筛选与最近任务，不挤占结果区。</p>
            </div>
          </section>
          <div className="context-list info-list">
            <article className="info-row active">
              <strong>全部可见文档</strong>
              <span>权限过滤以后端返回为准。</span>
            </article>
            <article className="info-row">
              <strong>Hybrid Search</strong>
              <span>关键词 + ts_vector + pgvector 语义召回。</span>
            </article>
            <article className="info-row">
              <strong>最近查询</strong>
              <span>触发延迟 / RAG 来源 / 权限过滤</span>
            </article>
          </div>
        </>
      ) : null}

      {activeView === 'query' ? (
        <>
          <section className="context-header">
            <div className="section-title stacked">
              <h2>问答上下文</h2>
              <p className="empty-state">当前空间：{currentSpace?.name ?? '未知空间'}</p>
            </div>
          </section>
          <div className="context-list info-list">
            <article className="info-row active">
              <strong>回答红线</strong>
              <span>库外问题必须返回“未找到”，不编造。</span>
            </article>
            <article className="info-row">
              <strong>来源要求</strong>
              <span>答案必须附文档或术语来源。</span>
            </article>
            <article className="info-row">
              <strong>术语注入</strong>
              <span>空间术语优先于全局同名术语。</span>
            </article>
          </div>
        </>
      ) : null}

      {activeView === 'terms' ? (
        <>
          <section className="context-header section-title">
            <div>
              <h2>术语</h2>
              <p className="empty-state">当前空间 {terms.length} 条</p>
            </div>
            <button
              type="button"
              onClick={onNewTerm}
              disabled={isBusy}
            >
              新建
            </button>
          </section>
          {terms.length === 0 ? (
            <p className="empty-state context-empty">当前空间暂无术语。</p>
          ) : (
            <ul className="term-list context-list">
              {terms.map((term) => (
                <li key={term.id}>
                  <button
                    type="button"
                    className={term.id === selectedTermId ? 'active' : ''}
                    onClick={() => onSelectTerm(term)}
                  >
                    <strong>{term.term}</strong>
                    <small>{term.space_id ? '当前空间' : '全局'} · {term.status === 'confirmed' ? '已确认' : '待确认'}</small>
                    <span>{term.definition}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </aside>
  );
}
