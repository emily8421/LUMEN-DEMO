/**
 * 主题单点（2026-08-16 主题试点，UI-G-003 四套已确认）：
 * light（默认）/ dark / paper / legacy（试点前原稿冻结对照）。
 * 契约：index.html 内联预置脚本读同一 localStorage key 防首帧闪烁（FOUC）；
 * tokens.css 以 [data-theme='...'] 提供四套变量。新增主题须同时改
 * tokens.css、本文件 THEMES、index.html 预置脚本三处。
 */

export const THEME_STORAGE_KEY = 'lumen-theme';

export const THEMES = [
  { value: 'light', label: '浅色（默认）' },
  { value: 'dark', label: '深色' },
  { value: 'paper', label: '暖米纸' },
  { value: 'legacy', label: '原稿（对照）' },
] as const;

export type Theme = (typeof THEMES)[number]['value'];

const THEME_VALUES = new Set<string>(THEMES.map((theme) => theme.value));

function normalize(value: string | null | undefined): Theme {
  return value && THEME_VALUES.has(value) ? (value as Theme) : 'light';
}

export function readStoredTheme(): Theme {
  try {
    return normalize(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

/** 初始化（main.tsx 挂载前调用一次）：与 index.html 预置脚本幂等对齐。 */
export function initTheme(): Theme {
  const theme = readStoredTheme();
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage 不可用（隐私模式等）时仅本次会话生效，不中断
  }
}
