/** 并排模式编辑/预览比例 localStorage 持久化（仿 pane-layout-store）。 */

export const SPLIT_RATIO_STORAGE_KEY = 'lumen-demo-split-ratio';

/** 默认比例：编辑约 67%、预览约 33%（与原 1.35fr / 0.65fr 一致）。 */
export const DEFAULT_SPLIT_RATIO = 0.675;

export function clampSplitRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) {
    return DEFAULT_SPLIT_RATIO;
  }
  return Math.min(0.7, Math.max(0.3, ratio));
}

export function loadSplitRatio(): number {
  try {
    const raw = window.localStorage.getItem(SPLIT_RATIO_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SPLIT_RATIO;
    }
    return clampSplitRatio(Number(raw));
  } catch {
    return DEFAULT_SPLIT_RATIO;
  }
}

export function persistSplitRatio(ratio: number): void {
  try {
    window.localStorage.setItem(SPLIT_RATIO_STORAGE_KEY, String(ratio));
  } catch {
    // localStorage 不可用（如隐私模式）时静默降级，比例仅存内存
  }
}
