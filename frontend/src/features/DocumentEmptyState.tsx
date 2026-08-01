interface DocumentEmptyStateProps {
  isBusy: boolean;
  /** 新建文档（复用 documents.handleCreateDocument）。 */
  onCreateDocument: () => void;
  /** 展开左目录（paneLayout.setLeftPaneOpen(true)，强制展开不误触收起）。 */
  onExpandLeftPane: () => void;
}

/**
 * documents 视图空态引导（Doc-First §9.5，Sprint-21 slice 3c smoke 修复）：
 * 无选中文档时替代空表单，提示从左侧选文档或新建，避免「主体空」。
 */
export function DocumentEmptyState({ isBusy, onCreateDocument, onExpandLeftPane }: DocumentEmptyStateProps) {
  return (
    <div className="document-empty-state">
      <h3>未选择文档</h3>
      <p>请从左侧目录选一篇，或新建一篇开始。</p>
      <div className="document-empty-state-actions">
        <button type="button" className="secondary" onClick={onExpandLeftPane} disabled={isBusy}>
          展开左目录
        </button>
        <button type="button" onClick={onCreateDocument} disabled={isBusy}>
          新建文档
        </button>
      </div>
    </div>
  );
}
