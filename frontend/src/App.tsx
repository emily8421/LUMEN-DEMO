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
import { useTermCategories } from './app/useTermCategories';
import { useImport } from './app/useImport';
import { useWorkspace } from './app/useWorkspace';
import { usePaneLayout } from './app/usePaneLayout';
import { usePaneWidth } from './app/usePaneWidth';
import { useSession } from './app/useSession';
import { useDocuments } from './app/useDocuments';
import { useAiPolish } from './app/useAiPolish';
import { useFolders } from './app/useFolders';
import { useAdminUsers } from './app/useAdminUsers';
import { useSpaceMembers } from './app/useSpaceMembers';
import { useTimeline } from './app/useTimeline';
import { isAuthTokenError } from './app/session-store';
import type { LocalVaultDoc } from './app/local-vault-index';
import { QuickEntryFeature } from './features/QuickEntryFeature';
import { ImportFeature } from './features/ImportFeature';
import { WorkspaceMain } from './app/WorkspaceMain';
import { useCommandPalette } from './app/useCommandPalette';
import { useAiAssistant } from './app/useAiAssistant';
import { CommandPalette } from './features/CommandPalette';
import { AiAssistant } from './features/AiAssistant';
import { OnboardingGuide } from './features/OnboardingGuide';
import { ONBOARDING_STEPS, isOnboardingDone, loadOnboardingState, persistOnboardingState } from './app/onboarding-store';
import type { OnboardingState, OnboardingStepId } from './app/onboarding-store';

function App() {
  const workspace = useWorkspace();
  const paneLayout = usePaneLayout();
  const leftPaneWidth = usePaneWidth('left');
  // 左栏仅在「文档/搜索/问答/术语」等有左栏内容的视图显示；
  // 首页 / 标签 / 时间线无左栏内容，永远收起（toggle / Ctrl+B 只改偏好，无内容视图不显形）。
  const leftPaneHasContent =
    workspace.activeView === 'documents' ||
    workspace.activeView === 'search' ||
    workspace.activeView === 'query' ||
    workspace.activeView === 'terms';
  const leftPaneOpen = leftPaneHasContent && paneLayout.leftPaneOpen;
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [localPreviewDoc, setLocalPreviewDoc] = useState<LocalVaultDoc | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState>(() => loadOnboardingState());
  // 本次会话引导是否已关闭（未全部完成时下次登录重新弹，Sprint-25 Flow-H-001）。
  const [guideDismissed, setGuideDismissed] = useState(false);

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
  const termCategories = useTermCategories({ token, runAction, setNotice: workspace.setNotice });
  const timeline = useTimeline({
    token,
    currentSpaceId: session.session?.currentSpaceId,
    runAction,
    setNotice: workspace.setNotice,
  });
  const imports = useImport({ token, runAction, setNotice: workspace.setNotice, onImported: handleImported });
  const adminUsers = useAdminUsers({ token, runAction, setNotice: workspace.setNotice });
  const spaceMembers = useSpaceMembers({
    token,
    currentSpaceId: session.session?.currentSpaceId,
    currentUserId: session.session?.userId,
    globalRole: session.session?.role ?? 'member',
    runAction,
    setNotice: workspace.setNotice,
  });

  const aiAssistant = useAiAssistant({ token });

  const palette = useCommandPalette({
    token,
    onOpenDocument: documents.handleOpenDocument,
    onNavigate: workspace.setActiveView,
    onCreateDocument: handleCreateDocument,
    onOpenImport: () => setImportModalOpen(true),
    // 批3：命令面板「问 AI」由跳问答视图改为打开 AI 抽屉并带入问题（保留问答页作完整视图）。
    onAskAi: (queryText) => {
      aiAssistant.open(queryText);
    },
  });

  const currentSpace = session.spaces.find((space) => space.id === session.session?.currentSpaceId) ?? null;

  // 登录态变化 → 重置本次会话的首次引导显示（未完成时下次登录重新弹）。
  useEffect(() => {
    setGuideDismissed(false);
    // 用户切换（登录 / 登出 / 换账号）→ 清空 AI 助手对话，避免跨用户残留前用户可见文档的来源（跨用户隔离红线）。
    aiAssistant.reset();
    // Sprint-28：非 admin 登录后不滞留用户管理页（后端仍强制鉴权，此处仅体验收敛）。
    if (session.session?.role !== 'admin' && workspace.activeView === 'admin-users') {
      workspace.setActiveView('home');
    }
  }, [session.session?.token]);

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
      termCategories.reloadRoot(refreshToken),
    ]);
  }

  function handleSpaceChanged() {
    documents.setSelectedId(null);
    folders.resetFolders();
    termCategories.resetCategories();
    workspace.setActiveView('home');
    search.setSearchResult(null);
    query.setQueryResult(null);
    aiAssistant.reset();
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

  // ②：新建文档时关闭本地预览——新建态 selectedId 保持 null，App 互斥 effect 不触发，
  // 需在此显式清空，否则主区一直显示本地预览、看不到新建文档编辑视图。
  function handleCreateDocument() {
    setLocalPreviewDoc(null);
    documents.handleCreateDocument();
  }

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

  // Sprint-25 首次引导：标记步骤完成；全部完成 → completed（不再弹出）。
  function handleOnboardingStep(stepId: OnboardingStepId) {
    setOnboarding((current) => {
      const steps = { ...current.steps, [stepId]: true };
      const next: OnboardingState = { completed: isOnboardingDone({ ...current, steps }), steps };
      persistOnboardingState(next);
      return next;
    });
    const step = ONBOARDING_STEPS.find((item) => item.id === stepId);
    if (!step) {
      return;
    }
    if (stepId === 'create') {
      handleCreateDocument();
    } else {
      workspace.setActiveView(step.view);
    }
  }

  function handleSkipOnboarding() {
    const next: OnboardingState = { completed: true, steps: { create: true, search: true, query: true } };
    persistOnboardingState(next);
    setOnboarding(next);
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
        leftPaneOpen={leftPaneOpen}
        onToggleLeftPane={paneLayout.toggleLeftPane}
        rightPaneOpen={paneLayout.rightPaneOpen}
        onToggleRightPane={paneLayout.toggleRightPane}
        onLogout={session.handleLogout}
        canManageUsers={session.session?.role === 'admin'}
        onOpenUserManagement={() => workspace.setActiveView('admin-users')}
        onOpenSearchPalette={palette.open}
      />

      {!session.session ? (
        <section className="login-panel card">
          <div className="auth-tabs" role="tablist" aria-label="登录或注册">
            <button
              type="button"
              className={session.authMode === 'login' ? 'active' : ''}
              onClick={() => session.setAuthMode('login')}
            >
              登录
            </button>
            <button
              type="button"
              className={session.authMode === 'register' ? 'active' : ''}
              onClick={() => session.setAuthMode('register')}
            >
              注册
            </button>
          </div>
          {session.authMode === 'login' ? (
            <form onSubmit={session.handleLogin}>
              <h2>登录</h2>
              <p>演示账号 alice / kira / brightlite-member（密码 demo-pass-1234），或使用注册邮箱登录。</p>
              <label>
                账号（邮箱或 external_id）
                <input value={session.loginId} onChange={(event) => session.setLoginId(event.target.value)} />
              </label>
              <label>
                密码
                <input type="password" value={session.password} onChange={(event) => session.setPassword(event.target.value)} />
              </label>
              <button type="submit" disabled={workspace.isBusy || session.loginId.trim().length === 0}>登录</button>
            </form>
          ) : (
            <form onSubmit={session.handleRegister}>
              <h2>注册新账号</h2>
              <p>注册后自动创建个人空间并登录（REQ-040）。</p>
              <label>
                邮箱
                <input type="email" value={session.registerEmail} onChange={(event) => session.setRegisterEmail(event.target.value)} />
              </label>
              <label>
                显示名
                <input value={session.registerName} onChange={(event) => session.setRegisterName(event.target.value)} />
              </label>
              <label>
                密码（至少 8 位）
                <input type="password" value={session.registerPassword} onChange={(event) => session.setRegisterPassword(event.target.value)} />
              </label>
              <button
                type="submit"
                disabled={
                  workspace.isBusy ||
                  session.registerEmail.trim().length === 0 ||
                  session.registerName.trim().length === 0 ||
                  session.registerPassword.length < 8
                }
              >
                注册并登录
              </button>
            </form>
          )}
        </section>
      ) : (
        <div
          className={`workspace-layout workspace-shell${leftPaneOpen ? '' : ' pane-left-collapsed'}`}
          style={{ '--left-pane-width': `${leftPaneWidth.width}px` } as CSSProperties}
        >
          <WorkspaceViewNav
            activeView={workspace.activeView}
            disabled={workspace.isBusy}
            onChange={workspace.setActiveView}
            showMembers={spaceMembers.canManageMembers}
          />

          <ContextPane
            activeView={workspace.activeView}
            currentSpace={currentSpace}
            documents={documents.documents}
            folders={folders}
            selectedId={documents.selectedId}
            isCreating={documents.isCreating}
            isBusy={workspace.isBusy}
            onCreateDocument={handleCreateDocument}
            onSelectDocument={documents.handleSelectDocument}
            onMoveDocument={documents.handleMoveDocument}
            onDeleteDocument={documents.handleDeleteDocument}
            terms={terms.terms}
            selectedTermId={terms.selectedTermId}
            onSelectTerm={terms.selectTerm}
            onNewTerm={terms.newTerm}
            termCategories={termCategories}
            token={token}
            onImported={() => handleImported(null)}
            onOpenLocalDoc={handleOpenLocalDoc}
            onToggleLeftPane={paneLayout.toggleLeftPane}
          />

          {leftPaneOpen ? (
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
            onToggleRightPane={paneLayout.toggleRightPane}
            documents={documents}
            search={search}
            query={query}
            terms={terms}
            termCategories={termCategories}
            tags={tags}
            timeline={timeline}
            aiPolish={aiPolish}
            adminUsers={adminUsers}
            spaceMembers={spaceMembers}
            currentSpaceName={currentSpace?.name ?? ''}
            onQuickEntryOpen={quickEntry.open}
            onNavigate={workspace.setActiveView}
            onCreateDocument={handleCreateDocument}
            onOpenImport={() => setImportModalOpen(true)}
            onExpandLeftPane={() => paneLayout.setLeftPaneOpen(true)}
            onExitToEmpty={() => { documents.setSelectedId(null); documents.setIsCreating(false); }}
            localPreviewDoc={localPreviewDoc}
            onCloseLocalDoc={() => setLocalPreviewDoc(null)}
            onboardingSteps={onboarding.steps}
            onOnboardingStep={handleOnboardingStep}
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

          {session.session && !onboarding.completed && !guideDismissed ? (
            <OnboardingGuide
              isBusy={workspace.isBusy}
              steps={onboarding.steps}
              onStep={handleOnboardingStep}
              onSkip={handleSkipOnboarding}
              onDismiss={() => setGuideDismissed(true)}
            />
          ) : null}
        </div>
      )}

      {session.session ? (
        <CommandPalette
          isOpen={palette.isOpen}
          query={palette.query}
          searching={palette.searching}
          items={palette.items}
          activeIndex={palette.activeIndex}
          onQueryChange={palette.setQuery}
          onActiveIndexChange={palette.setActiveIndex}
          onKeyDown={palette.onKeyDown}
          onExecute={palette.execute}
          onClose={palette.close}
        />
      ) : null}

      {session.session ? (
        <AiAssistant
          isOpen={aiAssistant.isOpen}
          messages={aiAssistant.messages}
          draft={aiAssistant.draft}
          sending={aiAssistant.sending}
          useKnowledgeBase={aiAssistant.useKnowledgeBase}
          llmConfigs={aiAssistant.llmConfigs}
          llmProvider={aiAssistant.llmProvider}
          onLlmProviderChange={aiAssistant.setLlmProvider}
          onOpen={() => aiAssistant.open()}
          onClose={aiAssistant.close}
          onDraftChange={aiAssistant.setDraft}
          onToggleKnowledgeBase={aiAssistant.toggleKnowledgeBase}
          onSend={() => void aiAssistant.handleSend()}
          onOpenDocument={documents.handleOpenDocument}
        />
      ) : null}
      <StatusBar notice={workspace.notice} error={workspace.error} />
    </main>
  );
}

export default App;
