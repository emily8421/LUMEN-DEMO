import type { CSSProperties } from 'react';
import type { KnowledgeDocument, Space, Term } from '../../api';
import type { ActiveView } from '../WorkspaceViewNav';
import { FolderTree } from '../folder-tree/FolderTree';
import { PaneEdgeToggle } from '../PaneEdgeToggle';
import type { FolderManager } from '../useFolders';
import type { TermCategoryManager } from '../useTermCategories';
import { LocalMountPane } from '../../features/LocalMountPane';
import type { UseLocalVaultMount } from '../useLocalVaultMount';
import { useLocalMountHeight } from '../useLocalMountHeight';
import { usePaneSectionHeight } from '../usePaneSectionHeight';
import { TERM_CATEGORIES_HEIGHT_STORAGE_KEY, DEFAULT_TERM_CATEGORIES_HEIGHT } from '../pane-section-height-store';
import type { LocalVaultDoc } from '../local-vault-index';
import { FolderTreeHeader } from './FolderTreeHeader';
import { TermsContextPane } from './TermsContextPane';
import { ContextInfoList } from './ContextInfoList';

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

/**
 * 左栏上下文面板（documents / search / query / terms 四视图切换）。
 * E4 Slice D 拆分：文件管理器头部 → FolderTreeHeader、术语视图 → TermsContextPane、
 * 搜索/问答 info-list → ContextInfoList；本组件保留文档域派生逻辑与装配。
 */
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
          <FolderTreeHeader
            documentCount={documents.length}
            isBusy={isBusy}
            anyFolderExpanded={anyFolderExpanded}
            canRevealSelected={selectedId != null}
            onCreateDocument={() => onCreateDocument()}
            onCreateFolder={() => folders.beginCreateFolder(null)}
            onToggleAllFolders={handleToggleAllFolders}
            onRevealSelected={handleRevealSelected}
          />
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
        <ContextInfoList
          title="搜索上下文"
          subtitle="筛选与最近任务，不挤占结果区。"
          items={[
            { label: '全部可见文档', description: '权限过滤以后端返回为准。', active: true },
            { label: 'Hybrid Search', description: '关键词 + ts_vector + pgvector 语义召回。' },
            { label: '最近查询', description: '触发延迟 / RAG 来源 / 权限过滤' },
          ]}
        />
      ) : null}

      {activeView === 'query' ? (
        <ContextInfoList
          title="问答上下文"
          subtitle={`当前空间：${currentSpace?.name ?? '未知空间'}`}
          items={[
            { label: '回答红线', description: '库外问题必须返回"未找到"，不编造。', active: true },
            { label: '来源要求', description: '答案必须附文档或术语来源。' },
            { label: '术语注入', description: '空间术语优先于全局同名术语。' },
          ]}
        />
      ) : null}

      {activeView === 'terms' ? (
        <TermsContextPane
          terms={terms}
          selectedTermId={selectedTermId}
          isBusy={isBusy}
          onSelectTerm={onSelectTerm}
          onNewTerm={onNewTerm}
          termCategories={termCategories}
          termCategoriesHeight={termCategoriesHeight}
        />
      ) : null}
    </aside>
  );
}
