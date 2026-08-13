import { useEffect, useState } from 'react';
import { exportSpaceZip, triggerBrowserDownload } from './api';
import { StatusBar } from './components/StatusBar';
import { TopBar } from './app/TopBar';
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
import { useCommandPalette } from './app/useCommandPalette';
import { useAiAssistant } from './app/useAiAssistant';
import { useLocalVaultMount } from './app/useLocalVaultMount';
import { WorkspaceShell } from './app/WorkspaceShell';
import { OverlayShell } from './app/OverlayShell';
import { AuthShell } from './features/auth/AuthShell';
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
  const [resetModalOpen, setResetModalOpen] = useState(false);

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

  // REQ-049：本地挂载 vm 提升到 App——LocalMountPane（左栏）与 LocalDocPreview（主区编辑）共享同一实例。
  const localVault = useLocalVaultMount();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应 token 变化（登录/登出/换账号）；aiAssistant/session.role/workspace 不列入依赖，避免对象引用每次渲染变化触发跨用户重置
  }, [session.session?.token]);

  // session / 空间变化 → 刷新工作区（spaces + documents + terms）。
  useEffect(() => {
    if (!session.session) {
      return;
    }
    void refreshWorkspace().catch((caughtError) => {
      const message = caughtError instanceof Error ? caughtError.message : '';
      if (isAuthTokenError(caughtError)) {
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
  // ⑥：透传 folderId，支撑文件夹右键「在此新建文档」。
  function handleCreateDocument(folderId?: number | null) {
    setLocalPreviewDoc(null);
    documents.handleCreateDocument(folderId);
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
      if (isAuthTokenError(caughtError)) {
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
        <AuthShell
          session={session}
          isBusy={workspace.isBusy}
          resetModalOpen={resetModalOpen}
          onOpenResetModal={() => setResetModalOpen(true)}
          onCloseResetModal={() => setResetModalOpen(false)}
        />
      ) : (
        <WorkspaceShell
          workspace={workspace}
          paneLayout={paneLayout}
          leftPaneWidth={leftPaneWidth}
          currentSpace={currentSpace}
          token={token}
          documents={documents}
          folders={folders}
          tags={tags}
          terms={terms}
          termCategories={termCategories}
          search={search}
          query={query}
          timeline={timeline}
          aiPolish={aiPolish}
          adminUsers={adminUsers}
          spaceMembers={spaceMembers}
          quickEntry={quickEntry}
          imports={imports}
          importModalOpen={importModalOpen}
          onOpenImport={() => setImportModalOpen(true)}
          onCloseImport={() => setImportModalOpen(false)}
          onboarding={onboarding}
          guideDismissed={guideDismissed}
          localVault={localVault}
          localPreviewDoc={localPreviewDoc}
          handleCreateDocument={handleCreateDocument}
          handleImported={handleImported}
          handleOnboardingStep={handleOnboardingStep}
          handleSkipOnboarding={handleSkipOnboarding}
          handleDismissGuide={() => setGuideDismissed(true)}
          handleOpenLocalDoc={handleOpenLocalDoc}
          handleCloseLocalDoc={() => setLocalPreviewDoc(null)}
        />
      )}

      <OverlayShell
        sessionActive={Boolean(session.session)}
        palette={palette}
        aiAssistant={aiAssistant}
        handleOpenDocument={documents.handleOpenDocument}
      />
      <StatusBar notice={workspace.notice} error={workspace.error} />
    </main>
  );
}

export default App;
