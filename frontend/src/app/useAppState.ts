import { useEffect } from 'react';
import { exportSpaceZip, triggerBrowserDownload } from '../api';
import { useSession } from './useSession';
import { useFolders } from './useFolders';
import { useDocuments } from './useDocuments';
import { useAiPolish } from './useAiPolish';
import { useTags } from './useTags';
import { useQuickEntry } from './useQuickEntry';
import { useSearch } from './useSearch';
import { useQuery } from './useQuery';
import { useTerms } from './useTerms';
import { useTermCategories } from './useTermCategories';
import { useTimeline } from './useTimeline';
import { useImport } from './useImport';
import { useAdminUsers } from './useAdminUsers';
import { useSpaceMembers } from './useSpaceMembers';
import { useAiAssistant } from './useAiAssistant';
import { useLocalVaultMount } from './useLocalVaultMount';
import { useCommandPalette } from './useCommandPalette';
import { isAuthTokenError } from './session-store';
import { useAppShellState } from './useAppShellState';
import { ONBOARDING_STEPS, isOnboardingDone, persistOnboardingState } from './onboarding-store';
import type { OnboardingState, OnboardingStepId } from './onboarding-store';
import type { LocalVaultDoc } from '../features/local-mount/local-vault-index';

/**
 * CQ-P1-008 E4 拆分溯源：App 减压第三刀——域 hook 编排 + cross-cutting 回调 + effects。
 *
 * 职责：初始化全部域 hook（session / folders / documents / aiPolish / tags / quickEntry /
 * search / query / terms / termCategories / timeline / imports / adminUsers / spaceMembers /
 * aiAssistant / localVault / palette）+ 跨域回调（runAction / refreshWorkspace /
 * handleSpaceChanged / handleImported / handleExportSpace / onboarding handlers / 本地预览
 * handlers）+ 3 个 App 级 effects（登录态重置 / 工作区刷新 / 本地预览互斥）。App.tsx 只做装配。
 *
 * 依赖注入约定：UI/布局与弹窗 state 来自 useAppShellState；域 hook 通过 props 注入
 * token / runAction / setNotice 等；runAction 等回调用函数声明（hoisted），域 hook 可在
 * 其文本定义前引用——**搬移时必须保持函数提升顺序原样**，否则运行时 error。
 *
 * 跨域回调语义：runAction 统一 busy/notice/error + 登录失效；refreshWorkspace 编排
 * spaces/documents/folders/terms/termCategories 五域 reload。
 */
export function useAppState() {
  const shell = useAppShellState();
  const {
    workspace,
    paneLayout,
    leftPaneWidth,
    leftPaneOpen,
    importModalOpen,
    openImportModal,
    closeImportModal,
    localPreviewDoc,
    setLocalPreviewDoc,
    onboarding,
    setOnboarding,
    guideDismissed,
    setGuideDismissed,
    resetModalOpen,
    openResetModal,
    closeResetModal,
  } = shell;

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
    closeImportModal();
    workspace.setActiveView('documents');
    documents.setIsCreating(false);
    search.setSearchResult(null);
    query.setQueryResult(null);
  }

  // 双向互斥（正向）：开本地预览清 DB 选中，防 selectedId 不变时互斥 effect 不触发（2026-08-15 实测）。
  function handleOpenLocalDoc(doc: LocalVaultDoc | null) {
    if (doc) documents.setSelectedId(null);
    setLocalPreviewDoc(doc);
  }

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

  // 域 hook 初始化（保持原顺序：folders 先于 documents，因 documents 的 onDocumentsChanged 引用 folders）。
  const session = useSession({ runAction, setNotice: workspace.setNotice, onSpaceChanged: handleSpaceChanged });
  const token = session.session?.token;

  const folders = useFolders({ token, currentSpaceId: session.session?.currentSpaceId, runAction, setNotice: workspace.setNotice });
  const documents = useDocuments({
    token, currentSpaceId: session.session?.currentSpaceId,
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
  const terms = useTerms({ token, currentSpaceId: session.session?.currentSpaceId, runAction, setNotice: workspace.setNotice });
  const termCategories = useTermCategories({ token, currentSpaceId: session.session?.currentSpaceId, runAction, setNotice: workspace.setNotice });
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
    onOpenImport: () => openImportModal(),
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

  // 点 DB 文档时关闭本地预览（主区互斥）。兜底 effect 覆盖常规路径；同 ID 重选由 handleOpenLocalDoc 正向清（见上）。
  useEffect(() => {
    if (documents.selectedId !== null) setLocalPreviewDoc(null);
  }, [documents.selectedId, setLocalPreviewDoc]);

  return {
    workspace,
    paneLayout,
    leftPaneWidth,
    leftPaneOpen,
    importModalOpen,
    onOpenImport: () => openImportModal(),
    onCloseImport: () => closeImportModal(),
    localPreviewDoc,
    handleOpenLocalDoc,
    handleCloseLocalDoc: () => setLocalPreviewDoc(null),
    onboarding,
    handleOnboardingStep,
    handleSkipOnboarding,
    handleDismissGuide: () => setGuideDismissed(true),
    guideDismissed,
    resetModalOpen,
    onOpenResetModal: () => openResetModal(),
    onCloseResetModal: () => closeResetModal(),
    session,
    token,
    currentSpace,
    folders,
    documents,
    aiPolish,
    tags,
    quickEntry,
    search,
    query,
    terms,
    termCategories,
    timeline,
    imports,
    adminUsers,
    spaceMembers,
    aiAssistant,
    localVault,
    palette,
    handleCreateDocument,
    handleImported,
    handleExportSpace,
  };
}

export type UseAppState = ReturnType<typeof useAppState>;
