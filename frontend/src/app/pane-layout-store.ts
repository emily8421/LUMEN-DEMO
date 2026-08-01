/** 侧栏可见性偏好 localStorage 持久化（Doc-First §9.5，Sprint-21）。 */

export const PANE_LAYOUT_STORAGE_KEY = 'lumen-demo-pane-layout';

export type PaneLayout = {
  leftPaneOpen: boolean;
  rightPaneOpen: boolean;
};

/** 默认收起（Doc-First §9.5.1：宽屏也默认收起，沉浸阅读）。 */
export const DEFAULT_PANE_LAYOUT: PaneLayout = {
  leftPaneOpen: false,
  rightPaneOpen: false,
};

export function loadStoredPaneLayout(): PaneLayout | null {
  try {
    const raw = window.localStorage.getItem(PANE_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PaneLayout>;
    if (typeof parsed.leftPaneOpen !== 'boolean' || typeof parsed.rightPaneOpen !== 'boolean') {
      return null;
    }
    return { leftPaneOpen: parsed.leftPaneOpen, rightPaneOpen: parsed.rightPaneOpen };
  } catch {
    return null;
  }
}

export function persistPaneLayout(layout: PaneLayout): void {
  try {
    window.localStorage.setItem(PANE_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // localStorage 不可用（如隐私模式）时静默降级，偏好仅存内存
  }
}
