import { useState } from 'react';
import { useWorkspace } from './useWorkspace';
import { usePaneLayout } from './usePaneLayout';
import { usePaneWidth } from './usePaneWidth';
import { loadOnboardingState } from './onboarding-store';
import type { OnboardingState } from './onboarding-store';
import type { LocalVaultDoc } from '../features/local-mount/local-vault-index';

/**
 * CQ-P1-008 E4 拆分溯源：App 减压第二刀——UI/布局派生 + 局部弹窗 / 引导 state。
 *
 * 职责：跨域 UI 态（workspace / paneLayout / leftPaneWidth）+ App 级局部弹窗与引导
 * （导入弹窗 / 本地预览 / 首次引导 / 引导关闭 / 忘记密码弹窗）。原内联在 App.tsx，
 * 拆出后 useAppState 只做域 hook 编排 + 回调，App.tsx 只做装配（关联 CQ-P1-008 E4）。
 *
 * 依赖注入约定：无参数；内部只组合布局 hooks 与轻量 useState，跨域回调语义由
 * useAppState 消费 shell state / setter 编排，本 hook 不触碰域 hook。
 */
export function useAppShellState() {
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

  return {
    workspace,
    paneLayout,
    leftPaneWidth,
    leftPaneOpen,
    importModalOpen,
    openImportModal: () => setImportModalOpen(true),
    closeImportModal: () => setImportModalOpen(false),
    localPreviewDoc,
    setLocalPreviewDoc,
    onboarding,
    setOnboarding,
    guideDismissed,
    setGuideDismissed,
    resetModalOpen,
    openResetModal: () => setResetModalOpen(true),
    closeResetModal: () => setResetModalOpen(false),
  };
}
