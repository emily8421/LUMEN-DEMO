type PaneTogglesProps = {
  leftPaneOpen: boolean;
  onToggleLeftPane: () => void;
  rightPaneOpen: boolean;
  onToggleRightPane: () => void;
};

/**
 * 顶栏左右栏折叠开关（目录 Ctrl+B / 右栏 Ctrl+R）。E4 Slice D 从 TopBar 拆分。
 */
export function PaneToggles({
  leftPaneOpen,
  onToggleLeftPane,
  rightPaneOpen,
  onToggleRightPane,
}: PaneTogglesProps) {
  return (
    <div className="pane-toggles">
      <button
        type="button"
        className={`pane-toggle${leftPaneOpen ? ' active' : ''}`}
        onClick={onToggleLeftPane}
        aria-label={leftPaneOpen ? '收起目录' : '展开目录'}
        aria-pressed={leftPaneOpen}
        title="目录（Ctrl+B）"
      >
        <svg className="pane-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
      <button
        type="button"
        className={`pane-toggle${rightPaneOpen ? ' active' : ''}`}
        onClick={onToggleRightPane}
        aria-label={rightPaneOpen ? '收起右栏' : '展开右栏'}
        aria-pressed={rightPaneOpen}
        title="右栏（Ctrl+R）"
      >
        <svg className="pane-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M15 3v18" />
        </svg>
      </button>
    </div>
  );
}
