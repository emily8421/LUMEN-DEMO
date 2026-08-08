import type { KnowledgeDocument, Space, Term } from '../api';
import type { ActiveView } from './WorkspaceViewNav';
import { FolderTree } from './FolderTree';
import { PaneEdgeToggle } from './PaneEdgeToggle';
import type { FolderManager } from './useFolders';
import { TermCategoryTree } from './TermCategoryTree';
import type { TermCategoryManager } from './useTermCategories';
import { LocalMountPane } from '../features/LocalMountPane';
import type { UseLocalVaultMount } from './useLocalVaultMount';
import { useLocalMountHeight } from './useLocalMountHeight';
import { usePaneSectionHeight } from './usePaneSectionHeight';
import { TERM_CATEGORIES_HEIGHT_STORAGE_KEY, DEFAULT_TERM_CATEGORIES_HEIGHT } from './pane-section-height-store';
import type { CSSProperties } from 'react';
import type { LocalVaultDoc } from './local-vault-index';

type ContextPaneProps = {
  activeView: ActiveView;
  currentSpace: Space | null;
  documents: KnowledgeDocument[];
  folders: FolderManager;
  selectedId: number | null;
  isCreating: boolean;
  isBusy: boolean;
  /** 新建文档；folderId 传入时在指定文件夹下新建（⑥，文件夹右键「在此新建文档」）。 */
  onCreateDocument: (folderId?: number | null) => void;
  onSelectDocument: (documentId: number) => void;
  onMoveDocument: (document: KnowledgeDocument, targetFolderId: number | null) => void;
  onDeleteDocument: (documentId: number) => void;
  terms: Term[];
  selectedTermId: number | null;
  onSelectTerm: (term: Term) => void;
  /** 新建术语；``categoryId`` 非空时预填到该领域（右键「在此新建术语」）。 */
  onNewTerm: (categoryId?: number | null) => void;
  /** 术语领域树（REQ-036 增强，migration 017）。 */
  termCategories: TermCategoryManager;
  token: string | undefined;
  onImported: () => void;
  onOpenLocalDoc: (doc: LocalVaultDoc | null) => void;
  /** 收起左目录（批1，点1：左栏右边缘就近折叠）。 */
  onToggleLeftPane: () => void;
  /** REQ-049：本地挂载 vm（App 提升共享，LocalMountPane 与主区 LocalDocPreview 同一实例）。 */
  localVault: UseLocalVaultMount;
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
  onDeleteDocument,
  terms,
  selectedTermId,
  onSelectTerm,
  onNewTerm,
  termCategories,
  token,
  onImported,
  onOpenLocalDoc,
  onToggleLeftPane,
  localVault,
}: ContextPaneProps) {
  const selectedDocument = documents.find((document) => document.id === selectedId) ?? null;
  const mountHeight = useLocalMountHeight();
  const termCategoriesHeight = usePaneSectionHeight(TERM_CATEGORIES_HEIGHT_STORAGE_KEY, DEFAULT_TERM_CATEGORIES_HEIGHT);
  const anyFolderExpanded = folders.expandedFolderIds.size > 0;

  const handleToggleAllFolders = () => {
    if (anyFolderExpanded) {
      folders.collapseAll();
    } else {
      folders.expandAll();
    }
  };

  const handleRevealSelected = () => {
    if (!selectedDocument) {
      return;
    }
    const folderId = selectedDocument.folder_id ?? null;
    if (folderId !== null) {
      const chain: number[] = [];
      const seen = new Set<number>();
      let current: number | null = folderId;
      while (current !== null && !seen.has(current)) {
        seen.add(current);
        chain.push(current);
        const folder = folders.knownFolders.find((item) => item.id === current);
        current = folder?.parent_id ?? null;
      }
      for (let index = chain.length - 1; index >= 0; index -= 1) {
        const folderIdToExpand = chain[index];
        if (!folders.expandedFolderIds.has(folderIdToExpand)) {
          folders.toggleFolder(folderIdToExpand);
        }
      }
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-document-id="${selectedDocument.id}"]`)?.scrollIntoView({ block: 'nearest' });
      });
    });
  };

  return (
    <aside className={`sidebar context-pane context-${activeView}`.trim()}>
      <PaneEdgeToggle side="left" onToggle={onToggleLeftPane} label="收起目录（Ctrl+B）" />
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
                onClick={() => onCreateDocument()}
                disabled={isBusy}
                title="新建文档"
                aria-label="新建文档"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M12 18v-6" />
                  <path d="M9 15h6" />
                </svg>
              </button>
              <button
                type="button"
                className="folder-icon-button"
                onClick={() => folders.beginCreateFolder(null)}
                disabled={isBusy}
                title="新建文件夹"
                aria-label="新建文件夹"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  <path d="M12 10v6" />
                  <path d="M15 13h-6" />
                </svg>
              </button>
              <button
                type="button"
                className="folder-icon-button"
                onClick={handleToggleAllFolders}
                disabled={isBusy}
                title={anyFolderExpanded ? '收起全部' : '展开全部'}
                aria-label={anyFolderExpanded ? '收起全部' : '展开全部'}
              >
                {anyFolderExpanded ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m7 15 5 5 5-5" />
                    <path d="m7 9 5-5 5 5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m7 6 5 5 5-5" />
                    <path d="m7 12 5 5 5-5" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="folder-icon-button"
                onClick={handleRevealSelected}
                disabled={isBusy || selectedId == null}
                title="显示当前文件（展开路径并定位）"
                aria-label="显示当前文件"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="2" x2="5" y1="12" y2="12" />
                  <line x1="19" x2="22" y1="12" y2="12" />
                  <line x1="12" x2="12" y1="2" y2="5" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                  <circle cx="12" cy="12" r="7" />
                </svg>
              </button>
            </div>
          </section>
          <div
            className="context-tree-split"
            style={{ '--local-mount-height': `${mountHeight.height}px` } as CSSProperties}
          >
            <div className="context-tree-upper">
              <FolderTree
            documents={documents}
            selectedId={selectedId}
            isCreating={isCreating}
            isBusy={isBusy}
            folders={folders}
            onSelectDocument={onSelectDocument}
            onCreateDocumentInFolder={onCreateDocument}
            onMoveDocument={onMoveDocument}
            onDeleteDocument={onDeleteDocument}
          />
            </div>
            <div
              className={mountHeight.resizing ? 'pane-resizer pane-resizer-row resizing' : 'pane-resizer pane-resizer-row'}
              role="separator"
              aria-orientation="horizontal"
              aria-label="调整本地挂载分区高度"
              tabIndex={0}
              onPointerDown={mountHeight.startResize}
              onPointerMove={mountHeight.moveResize}
              onPointerUp={mountHeight.endResize}
              onPointerCancel={mountHeight.endResize}
              onDoubleClick={mountHeight.resetHeight}
              onKeyDown={mountHeight.handleKeyDown}
            />
              <LocalMountPane token={token} onImported={onImported} onOpenLocalDoc={onOpenLocalDoc} localVault={localVault} />
          </div>
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
              className="secondary"
              onClick={() => onNewTerm()}
              disabled={isBusy}
            >
              新建
            </button>
          </section>

          <div className="context-tree-split">
            <div className="context-tree-upper">
              {(() => {
                const globalTerms = terms.filter((term) => term.space_id == null);
                if (globalTerms.length === 0) {
                  return <p className="empty-state context-empty">暂无全局术语。</p>;
                }
                return (
                  <>
                    <div className="subsection-heading">
                      <strong>全局术语</strong>
                      <span>{globalTerms.length}</span>
                    </div>
                    <ul className="term-list context-list">
                      {globalTerms.map((term) => (
                        <li key={term.id}>
                          <button
                            type="button"
                            className={term.id === selectedTermId ? 'active' : ''}
                            onClick={() => onSelectTerm(term)}
                          >
                            <strong>{term.term}</strong>
                            <small>全局 · {term.status === 'confirmed' ? '已确认' : '待确认'}</small>
                            <span>{term.definition}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                );
              })()}
            </div>

            <div
              className={termCategoriesHeight.resizing ? 'pane-resizer pane-resizer-row resizing' : 'pane-resizer pane-resizer-row'}
              role="separator"
              aria-orientation="horizontal"
              aria-label="调整领域分区高度"
              tabIndex={0}
              onPointerDown={termCategoriesHeight.startResize}
              onPointerMove={termCategoriesHeight.moveResize}
              onPointerUp={termCategoriesHeight.endResize}
              onPointerCancel={termCategoriesHeight.endResize}
              onDoubleClick={termCategoriesHeight.resetHeight}
              onKeyDown={termCategoriesHeight.handleKeyDown}
            />

            <div
              className="term-categories-zone"
              style={{ '--term-categories-height': `${termCategoriesHeight.height}px` } as CSSProperties}
            >
              <div className="subsection-heading term-categories-heading">
                <strong>空间领域</strong>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => termCategories.beginCreateCategory(null)}
                  disabled={isBusy}
                >
                  ＋ 新建领域
                </button>
              </div>
              <TermCategoryTree
                terms={terms.filter((term) => term.space_id != null)}
                selectedTermId={selectedTermId}
                isBusy={isBusy}
                categories={termCategories}
                onSelectTerm={onSelectTerm}
                onNewTermInCategory={(categoryId) => onNewTerm(categoryId)}
              />
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}
