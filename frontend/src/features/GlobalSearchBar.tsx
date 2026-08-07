type GlobalSearchBarProps = {
  onOpen: () => void;
};

/**
 * 顶栏全局搜索入口（批2a，点2）：按钮形态的"搜索框"，点击或 ⌘K 唤起命令面板。
 * 不直接承载输入——输入在 CommandPalette 浮层里，避免顶栏常驻输入占用空间与焦点。
 */
export function GlobalSearchBar({ onOpen }: GlobalSearchBarProps) {
  return (
    <button
      type="button"
      className="global-search-bar"
      onClick={onOpen}
      aria-label="搜索文档或问 AI（⌘K）"
      title="搜索文档或问 AI（⌘K）"
    >
      <span className="global-search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <span className="global-search-placeholder">搜索文档或问 AI…</span>
      <kbd className="global-search-kbd">⌘K</kbd>
    </button>
  );
}
