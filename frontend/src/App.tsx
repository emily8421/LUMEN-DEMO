import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { exportSpaceZip, triggerBrowserDownload } from './api';
import { StatusBar } from './components/StatusBar';
import { WorkspaceViewNav } from './app/WorkspaceViewNav';
import { TopBar } from './app/TopBar';
import { ContextPane } from './app/ContextPane';
import { useTags } from './app/useTags';
import { useQuickEntry } from './app/useQuickEntry';
import { useSearch } from './app/useSearch';
import { useQuery } from './app/useQuery';
import { useTerms } from './app/useTerms';
import { useImport } from './app/useImport';
import { useWorkspace } from './app/useWorkspace';
import { usePaneLayout } from './app/usePaneLayout';
import { usePaneWidth } from './app/usePaneWidth';
import { useSession } from './app/useSession';
import { useDocuments } from './app/useDocuments';
import { useAiPolish } from './app/useAiPolish';
import { useFolders } from './app/useFolders';
import { useTimeline } from './app/useTimeline';
import { isAuthTokenError } from './app/session-store';
import type { LocalVaultDoc } from './app/local-vault-index';
import { QuickEntryFeature } from './features/QuickEntryFeature';
import { ImportFeature } from './features/ImportFeature';
import { WorkspaceMain } from './app/WorkspaceMain';

function App() {
  const workspace = useWorkspace();
  const paneLayout = usePaneLayout();
  const leftPaneWidth = usePaneWidth('left');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [localPreviewDoc, setLocalPreviewDoc] = useState<LocalVaultDoc | null>(null);

  const session = useSession({ runAction, setNotice: workspace.setNotice, onSpaceChanged: handleSpaceChanged });
  const token = session.session?.token;

  const folders = useFolders({
    token,
    runAction,
    setNotice: workspace.setNotice,
  });
  const documents = useDocuments({
    token,
    runAction,
    setNotice: workspace.setNotice,
    setError: workspace.setError,
    onAuthError: session.handleAuthError,
    onDocumentsChanged: async (refreshToken) => {
      await folders.reloadLoadedFolders(refreshToken);
    },
    setActiveView: workspace.setActiveView,
  });

  const aiPolish = useAiPolish({
    token,
    userId: session.session?.userId,
    selectedDocument: documents.selectedDocument,
    isCreating: documents.isCreating,
    contentMd: documents.draft.content_md,
    runAction,
    setNotice: workspace.setNotice,
    onApplyContent: documents.handleApplyPolishedContent,
  });

  const tags = useTags({
    token,
    currentSpaceId: session.session?.currentSpaceId,
    selectedDocumentId: documents.selectedId,
    runAction,
    setNotice: workspace.setNotice,
  });
  const quickEntry = useQuickEntry({
    token,
    currentSpaceId: session.session?.currentSpaceId,
    runAction,
    setNotice: workspace.setNotice,
    onDocumentsChanged: () => {
      void refreshWorkspace();
    },
  });
  const search = useSearch({ token, runAction, setNotice: workspace.setNotice });
  const query = useQuery({ token, runAction, setNotice: workspace.setNotice });
  const terms = useTerms({ token, runAction, setNotice: workspace.setNotice });
  const timeline = useTimeline({
    token,
    currentSpaceId: session.session?.currentSpaceId,
    runAction,
    setNotice: workspace.setNotice,
  });
  const imports = useImport({ token, runAction, setNotice: workspace.setNotice, onImported: handleImported });

  const currentSpace = session.spaces.find((space) => space.id === session.session?.currentSpaceId) ?? null;

  // session / 空间变化 → 刷新工作区（spaces + documents + terms）。
  useEffect(() => {
    if (!session.session) {
      return;
    }
    void refreshWorkspace().catch((caughtError) => {
      const message = caughtError instanceof Error ? caughtError.message : '';
      if (isAuthTokenError(message)) {
        session.handleAuthError();
        workspace.setNotice('登录已失效，请重新登录。');
      } else {
        workspace.setError(message || '加载工作区失败');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.session?.token, session.session?.currentSpaceId]);

  // App 级 orchestrator：各域 hook 暴露 reloadX()，统一刷新 spaces + documents + terms。
  async function refreshWorkspace() {
    if (!session.session) {
      return;
    }
    const refreshToken = session.session.token;
    await Promise.all([
      session.reloadSpaces(refreshToken),
      documents.reloadDocuments(refreshToken),
      folders.reloadLoadedFolders(refreshToken),
      terms.reloadTerms(),
    ]);
  }

  function handleSpaceChanged() {
    documents.setSelectedId(null);
    folders.resetFolders();
    workspace.setActiveView('home');
    search.setSearchResult(null);
    query.setQueryResult(null);
    terms.newTerm();
  }

  async function handleImported(firstDocId: number | null) {
    await refreshWorkspace();
    if (firstDocId) {
      documents.setSelectedId(firstDocId);
    }
    setImportModalOpen(false);
    workspace.setActiveView('documents');
    documents.setIsCreating(false);
    search.setSearchResult(null);
    query.setQueryResult(null);
  }

  function handleOpenLocalDoc(doc: LocalVaultDoc | null) {
    setLocalPreviewDoc(doc);
  }

  // 点 DB 文档时关闭本地预览（主区互斥：本地预览 vs DB 文档）
  useEffect(() => {
    if (documents.selectedId !== null) {
      setLocalPreviewDoc(null);
    }
  }, [documents.selectedId]);

  async function handleExportSpace() {
    if (!session.session) {
      return;
    }
    const exportToken = session.session.token;
    await runAction('正在导出空间备份...', async () => {
      const { blob, filename } = await exportSpaceZip(exportToken);
      triggerBrowserDownload(blob, filename);
      workspace.setNotice(`已导出空间备份：${filename}`);
    });
  }

  // cross-cutting：统一忙碌 / 通知 / 错误 + 登录失效处理（组合 workspace setters + session.handleAuthError）。
  async function runAction(progressMessage: string, action: () => Promise<void>) {
    workspace.setIsBusy(true);
    workspace.setError('');
    workspace.setNotice(progressMessage);
    try {
      await action();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '操作失败';
      workspace.setError(message);
      if (isAuthTokenError(message)) {
        session.handleAuthError();
        workspace.setNotice('登录已失效，请重新登录。');
      } else {
        workspace.setNotice('操作失败，请查看错误信息。');
      }
    } finally {
      workspace.setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <TopBar
        session={session.session}
        spaces={session.spaces}
        isBusy={workspace.isBusy}
        currentSpace={currentSpace}
        onSpaceChange={session.handleSpaceChange}
        onExportSpace={handleExportSpace}
        onQuickEntryOpen={quickEntry.open}
        leftPaneOpen={paneLayout.leftPaneOpen}
        onToggleLeftPane={paneLayout.toggleLeftPane}
        rightPaneOpen={paneLayout.rightPaneOpen}
        onToggleRightPane={paneLayout.toggleRightPane}
      />

      {!session.session ? (
        <section className="login-panel card">
          <h2>Demo 登录</h2>
          <p>登录后前端会将 Bearer Token 附加到文档与空间接口请求中。</p>
          <form onSubmit={session.handleLogin}>
            <label>
              账号
              <input value={session.username} onChange={(event) => session.setUsername(event.target.value)} />
            </label>
            <button type="submit" disabled={workspace.isBusy || session.username.trim().length === 0}>登录</button>
          </form>
        </section>
      ) : (
        <div
          className={`workspace-layout workspace-shell${paneLayout.leftPaneOpen ? '' : ' pane-left-collapsed'}`}
          style={{ '--left-pane-width': `${leftPaneWidth.width}px` } as CSSProperties}
        >
          <WorkspaceViewNav activeView={workspace.activeView} disabled={workspace.isBusy} onChange={workspace.setActiveView} />

          <ContextPane
            activeView={workspace.activeView}
            currentSpace={currentSpace}
            documents={documents.documents}
            folders={folders}
            selectedId={documents.selectedId}
            isCreating={documents.isCreating}
            isBusy={workspace.isBusy}
            onCreateDocument={documents.handleCreateDocument}
            onSelectDocument={documents.handleSelectDocument}
            onMoveDocument={documents.handleMoveDocument}
            onDeleteDocument={documents.handleDeleteDocument}
            terms={terms.terms}
            selectedTermId={terms.selectedTermId}
            onSelectTerm={terms.selectTerm}
            onNewTerm={terms.newTerm}
            token={token}
            onImported={() => handleImported(null)}
            onOpenLocalDoc={handleOpenLocalDoc}
          />

          {paneLayout.leftPaneOpen ? (
            <div
              className={leftPaneWidth.resizing ? 'pane-resizer pane-resizer-left resizing' : 'pane-resizer pane-resizer-left'}
              role="separator"
              aria-orientation="vertical"
              aria-label="调整左侧栏宽度"
              tabIndex={0}
              onPointerDown={leftPaneWidth.startResize}
              onPointerMove={leftPaneWidth.moveResize}
              onPointerUp={leftPaneWidth.endResize}
              onPointerCancel={leftPaneWidth.endResize}
              onDoubleClick={leftPaneWidth.resetWidth}
              onKeyDown={leftPaneWidth.handleKeyDown}
            />
          ) : null}

          <WorkspaceMain
            activeView={workspace.activeView}
            isBusy={workspace.isBusy}
            rightPaneOpen={paneLayout.rightPaneOpen}
            documents={documents}
            search={search}
            query={query}
            terms={terms}
            tags={tags}
            timeline={timeline}
            aiPolish={aiPolish}
            onQuickEntryOpen={quickEntry.open}
            onNavigate={workspace.setActiveView}
            onCreateDocument={documents.handleCreateDocument}
            onOpenImport={() => setImportModalOpen(true)}
            onExpandLeftPane={() => paneLayout.setLeftPaneOpen(true)}
            onExitToEmpty={() => { documents.setSelectedId(null); documents.setIsCreating(false); }}
            localPreviewDoc={localPreviewDoc}
            onCloseLocalDoc={() => setLocalPreviewDoc(null)}
          />

          <QuickEntryFeature
            isOpen={quickEntry.isOpen}
            isBusy={workspace.isBusy}
            title={quickEntry.title}
            source={quickEntry.source}
            contentMd={quickEntry.contentMd}
            tagIds={quickEntry.tagIds}
            mode={quickEntry.mode}
            targetDocumentId={quickEntry.targetDocumentId}
            tags={tags.tags}
            documents={documents.documents}
            lastEntry={quickEntry.lastEntry}
            onTitleChange={quickEntry.setTitle}
            onSourceChange={quickEntry.setSource}
            onContentMdChange={quickEntry.setContentMd}
            onToggleTag={quickEntry.toggleTag}
            onModeChange={quickEntry.changeMode}
            onTargetDocumentChange={quickEntry.setTargetDocumentId}
            onSubmit={quickEntry.handleSubmit}
            onDiscard={quickEntry.handleDiscard}
            onClose={quickEntry.close}
            onOpenDocument={documents.handleOpenDocument}
          />

          <ImportFeature
            isOpen={importModalOpen}
            isBusy={workspace.isBusy}
            importDraft={imports.importDraft}
            onImportDraftChange={imports.setImportDraft}
            importFiles={imports.importFiles}
            onImportFilesChange={imports.setImportFiles}
            importInputKey={imports.importInputKey}
            lastImportSummary={imports.lastImportSummary}
            lastImportItems={imports.lastImportItems}
            onImport={imports.handleImport}
            onClose={() => setImportModalOpen(false)}
          />
        </div>
      )}

      <StatusBar notice={workspace.notice} error={workspace.error} />
    </main>
  );
}

export default App;
