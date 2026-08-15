/** 侧栏可见性偏好 localStorage 持久化（Doc-First §9.5，Sprint-21）。
 *  key v2（2026-08-14）：左栏默认值翻转为展开（用户裁决，见 §9.5.1 修订），升版让老偏好作废重置到新默认。 */

export const PANE_LAYOUT_STORAGE_KEY = 'lumen-demo-pane-layout-v2';

export type PaneLayout = {
  leftPaneOpen: boolean;
  rightPaneOpen: boolean;
};

/** 左栏默认展开（2026-08-14 用户裁决修订 §9.5.1 原「宽屏也默认收起」；首页等无左栏视图由 useAppShellState 过滤）；右栏维持默认收起。 */
export const DEFAULT_PANE_LAYOUT: PaneLayout = {
  leftPaneOpen: true,
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
