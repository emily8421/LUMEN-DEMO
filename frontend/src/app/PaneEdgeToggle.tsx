type PaneEdgeToggleProps = {
  /** 哪一侧栏：left = 左目录右边缘（收起左栏），right = 右栏左边缘（收起右栏）。 */
  side: 'left' | 'right';
  onToggle: () => void;
  label: string;
};

/**
 * 侧栏边缘折叠按钮（批1，点1）：栏可见时在栏边缘就近收起。
 * 左栏收起态（context-pane display:none）下本按钮随之隐藏；唤起走顶栏 toggle / Ctrl+B。
 * 右栏同理（inspector-pane 在 pane-right-collapsed 下 display:none）。
 * 对标 Notion / 语雀的边缘折叠箭头。
 */
export function PaneEdgeToggle({ side, onToggle, label }: PaneEdgeToggleProps) {
  const isLeft = side === 'left';
  return (
    <button
      type="button"
      className={`pane-edge-toggle pane-edge-${side}`}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isLeft ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </button>
  );
}
