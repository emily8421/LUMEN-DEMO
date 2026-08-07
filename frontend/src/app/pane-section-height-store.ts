/** 左栏上下分区高度 localStorage 持久化（垂直拖拽调高，仿 local-mount-height-store）。

    「下分区」高度（术语视图 = 空间领域树区），上分区自动占满剩余空间。
    参数化 storageKey 以区分不同视图（文档视图本地挂载 vs 术语视图领域树）。 */

export const TERM_CATEGORIES_HEIGHT_STORAGE_KEY = 'lumen-demo-term-categories-height';
export const DEFAULT_TERM_CATEGORIES_HEIGHT = 420;
const MIN_SECTION_HEIGHT = 120;
const MAX_SECTION_HEIGHT = 760;

export function clampSectionHeight(height: number, min: number, max: number): number {
  if (!Number.isFinite(height)) {
    return DEFAULT_TERM_CATEGORIES_HEIGHT;
  }
  return Math.min(max, Math.max(min, height));
}

export function loadSectionHeight(storageKey: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return fallback;
    }
    return clampSectionHeight(Number(JSON.parse(raw)), MIN_SECTION_HEIGHT, MAX_SECTION_HEIGHT);
  } catch {
    return fallback;
  }
}

export function persistSectionHeight(storageKey: string, height: number): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(clampSectionHeight(height, MIN_SECTION_HEIGHT, MAX_SECTION_HEIGHT)));
  } catch {
    // localStorage 不可用（如隐私模式）时静默降级，高度仅存内存
  }
}
