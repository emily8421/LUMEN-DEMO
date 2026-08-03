import type { KnowledgeDocument, Space, Term } from '../api';
import type { ActiveView } from './WorkspaceViewNav';
import { FolderTree } from './FolderTree';
import type { FolderManager } from './useFolders';

type ContextPaneProps = {
  activeView: ActiveView;
  currentSpace: Space | null;
  documents: KnowledgeDocument[];
  folders: FolderManager;
  selectedId: number | null;
  isCreating: boolean;
  isBusy: boolean;
  onCreateDocument: () => void;
  onSelectDocument: (documentId: number) => void;
  onMoveDocument: (document: KnowledgeDocument, targetFolderId: number | null) => void;
  terms: Term[];
  selectedTermId: number | null;
  onSelectTerm: (term: Term) => void;
  onNewTerm: () => void;
};

export function ContextPane({
  activeView,
  currentSpace,
  documents,
  folders,
  selectedId,
  isCreating,
  isBusy,
  onCreateDocument,
  onSelectDocument,
  onMoveDocument,
  terms,
  selectedTermId,
  onSelectTerm,
  onNewTerm,
}: ContextPaneProps) {
  return (
    <aside className={`sidebar context-pane context-${activeView}`.trim()}>
      {activeView === 'documents' ? (
        <>
          <section className="context-header section-title folder-header">
            <div>
              <h2>文件管理器</h2>
              <p className="empty-state">当前空间 {documents.length} 篇</p>
            </div>
            <div className="folder-header-actions">
              <button
                type="button"
                className="folder-icon-button"
                onClick={onCreateDocument}
                disabled={isBusy}
                title="新建文档"
                aria-label="新建文档"
              >
                <span aria-hidden="true">✎</span>
              </button>
              <button
                type="button"
                className="folder-icon-button"
                onClick={() => folders.beginCreateFolder(null)}
                disabled={isBusy}
                title="新建文件夹"
                aria-label="新建文件夹"
              >
                <span aria-hidden="true">▣</span>
              </button>
              <button
                type="button"
                className="folder-icon-button"
                onClick={folders.collapseAll}
                disabled={isBusy}
                title="收起全部"
                aria-label="收起全部"
              >
                <span aria-hidden="true">⌃</span>
              </button>
            </div>
          </section>
          <FolderTree
            documents={documents}
            selectedId={selectedId}
            isCreating={isCreating}
            isBusy={isBusy}
            folders={folders}
            onSelectDocument={onSelectDocument}
            onMoveDocument={onMoveDocument}
          />
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
