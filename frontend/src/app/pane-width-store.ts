/** 左右侧栏宽度 localStorage 持久化（仿 pane-layout-store）。 */

export type PaneSide = 'left' | 'right';

export const PANE_WIDTH_STORAGE_KEY = 'lumen-demo-pane-widths';

export const DEFAULT_PANE_WIDTHS: Record<PaneSide, number> = {
  left: 240,
  right: 240,
};

const PANE_WIDTH_RANGE: Record<PaneSide, { min: number; max: number }> = {
  left: { min: 180, max: 420 },
  right: { min: 220, max: 480 },
};

export function clampPaneWidth(side: PaneSide, width: number): number {
  if (!Number.isFinite(width)) {
    return DEFAULT_PANE_WIDTHS[side];
  }
  const range = PANE_WIDTH_RANGE[side];
  return Math.min(range.max, Math.max(range.min, width));
}

export function loadPaneWidths(): Record<PaneSide, number> {
  try {
    const raw = window.localStorage.getItem(PANE_WIDTH_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PANE_WIDTHS };
    }
    const parsed = JSON.parse(raw) as Partial<Record<PaneSide, number>>;
    return {
      left: clampPaneWidth('left', Number(parsed.left ?? DEFAULT_PANE_WIDTHS.left)),
      right: clampPaneWidth('right', Number(parsed.right ?? DEFAULT_PANE_WIDTHS.right)),
    };
  } catch {
    return { ...DEFAULT_PANE_WIDTHS };
  }
}

export function persistPaneWidths(widths: Record<PaneSide, number>): void {
  try {
    window.localStorage.setItem(PANE_WIDTH_STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // localStorage 不可用（如隐私模式）时静默降级，宽度仅存内存
  }
}
