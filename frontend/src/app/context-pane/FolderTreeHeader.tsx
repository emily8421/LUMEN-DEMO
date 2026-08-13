type FolderTreeHeaderProps = {
  documentCount: number;
  isBusy: boolean;
  anyFolderExpanded: boolean;
  canRevealSelected: boolean;
  onCreateDocument: () => void;
  onCreateFolder: () => void;
  onToggleAllFolders: () => void;
  onRevealSelected: () => void;
};

/**
 * 左栏文件管理器头部（新建文档 / 新建文件夹 / 全部折叠展开 / 显示当前文件）。
 * E4 Slice D 从 ContextPane 拆分，处理器作为回调从父级传入（保持文档域派生逻辑留在 ContextPane）。
 */
export function FolderTreeHeader({
  documentCount,
  isBusy,
  anyFolderExpanded,
  canRevealSelected,
  onCreateDocument,
  onCreateFolder,
  onToggleAllFolders,
  onRevealSelected,
}: FolderTreeHeaderProps) {
  return (
    <section className="context-header section-title folder-header">
      <div>
        <h2>文件管理器</h2>
        <p className="empty-state">当前空间 {documentCount} 篇</p>
      </div>
      <div className="folder-header-actions">
        <button
          type="button"
          className="folder-icon-button"
          onClick={onCreateDocument}
          disabled={isBusy}
          title="新建文档"
          aria-label="新建文档"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M12 18v-6" />
            <path d="M9 15h6" />
          </svg>
        </button>
        <button
          type="button"
          className="folder-icon-button"
          onClick={onCreateFolder}
          disabled={isBusy}
          title="新建文件夹"
          aria-label="新建文件夹"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            <path d="M12 10v6" />
            <path d="M15 13h-6" />
          </svg>
        </button>
        <button
          type="button"
          className="folder-icon-button"
          onClick={onToggleAllFolders}
          disabled={isBusy}
          title={anyFolderExpanded ? '收起全部' : '展开全部'}
          aria-label={anyFolderExpanded ? '收起全部' : '展开全部'}
        >
          {anyFolderExpanded ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m7 6 5 5 5-5" />
              <path d="m7 12 5 5 5-5" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="folder-icon-button"
          onClick={onRevealSelected}
          disabled={isBusy || !canRevealSelected}
          title="显示当前文件（展开路径并定位）"
          aria-label="显示当前文件"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="2" x2="5" y1="12" y2="12" />
            <line x1="19" x2="22" y1="12" y2="12" />
            <line x1="12" x2="12" y1="2" y2="5" />
            <line x1="12" x2="12" y1="19" y2="22" />
            <circle cx="12" cy="12" r="7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
