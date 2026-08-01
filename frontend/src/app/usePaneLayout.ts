import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PANE_LAYOUT,
  loadStoredPaneLayout,
  persistPaneLayout,
  type PaneLayout,
} from './pane-layout-store';

type UsePaneLayout = {
  leftPaneOpen: boolean;
  rightPaneOpen: boolean;
  toggleLeftPane: () => void;
  toggleRightPane: () => void;
  setLeftPaneOpen: (open: boolean) => void;
  setRightPaneOpen: (open: boolean) => void;
};

/**
 * 侧栏可见性（Doc-First §9.5，Sprint-21）：左目录 / 右栏 open 状态 +
 * 快捷键唤出（Ctrl+B 左 / Ctrl+R 右；input/textarea/contenteditable 聚焦时不触发）+
 * localStorage 记忆偏好。默认收起（沉浸阅读）。
 */
export function usePaneLayout(): UsePaneLayout {
  const [layout, setLayout] = useState<PaneLayout>(
    () => loadStoredPaneLayout() ?? DEFAULT_PANE_LAYOUT,
  );

  const toggleLeftPane = useCallback(() => {
    setLayout((prev) => {
      const next = { ...prev, leftPaneOpen: !prev.leftPaneOpen };
      persistPaneLayout(next);
      return next;
    });
  }, []);

  const toggleRightPane = useCallback(() => {
    setLayout((prev) => {
      const next = { ...prev, rightPaneOpen: !prev.rightPaneOpen };
      persistPaneLayout(next);
      return next;
    });
  }, []);

  const setLeftPaneOpen = useCallback((open: boolean) => {
    setLayout((prev) => {
      if (prev.leftPaneOpen === open) {
        return prev;
      }
      const next = { ...prev, leftPaneOpen: open };
      persistPaneLayout(next);
      return next;
    });
  }, []);

  const setRightPaneOpen = useCallback((open: boolean) => {
    setLayout((prev) => {
      if (prev.rightPaneOpen === open) {
        return prev;
      }
      const next = { ...prev, rightPaneOpen: open };
      persistPaneLayout(next);
      return next;
    });
  }, []);

  // Ctrl+B 左目录 / Ctrl+R 右栏；输入框聚焦时不触发，避免误触打字
  // （textarea 里 Ctrl+R 仍走浏览器刷新，见 task-021 偏差 F-impl-1）。
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        toggleLeftPane();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        toggleRightPane();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleLeftPane, toggleRightPane]);

  return {
    leftPaneOpen: layout.leftPaneOpen,
    rightPaneOpen: layout.rightPaneOpen,
    toggleLeftPane,
    toggleRightPane,
    setLeftPaneOpen,
    setRightPaneOpen,
  };
}
