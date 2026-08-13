interface PendingImport {
  path: string;
  label: string;
  count: number;
}

/**
 * 本地挂载的导入确认条 / 导入操作条（Slice E 从 LocalMountPane 抽出）。
 * pendingImport 非空 → 确认条（文件夹/全部先确认数量）；否则若存在选中或文档 → 操作条（导入此篇 / 导入全部）。
 */
interface LocalMountImportBarProps {
  pendingImport: PendingImport | null;
  canImport: boolean;
  importing: boolean;
  hasSelection: boolean;
  hasDocs: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onImportSelected: () => void;
  onImportAll: () => void;
}

export function LocalMountImportBar({
  pendingImport,
  canImport,
  importing,
  hasSelection,
  hasDocs,
  onConfirm,
  onCancel,
  onImportSelected,
  onImportAll,
}: LocalMountImportBarProps) {
  if (pendingImport) {
    return (
      <div className="local-mount-confirm-bar">
        <span>
          将导入「{pendingImport.label}」的 <strong>{pendingImport.count}</strong> 个文件到 LUMEN（保留目录结构）。
        </span>
        <span className="local-mount-confirm-actions">
          <button type="button" onClick={onConfirm} disabled={importing}>确认导入</button>
          <button type="button" onClick={onCancel} disabled={importing}>取消</button>
        </span>
      </div>
    );
  }
  if (!hasSelection && !hasDocs) {
    return null;
  }
  return (
    <div className="local-mount-import-bar">
      <button
        type="button"
        className="local-mount-import"
        onClick={onImportSelected}
        disabled={!canImport || !hasSelection}
        title="把选中的本地文件导入 LUMEN（走 API-029，获得搜索 / RAG / 团队能力）"
      >
        导入此篇
      </button>
      <button
        type="button"
        className="local-mount-import"
        onClick={onImportAll}
        disabled={!canImport || !hasDocs}
        title="把整个本地挂载导入 LUMEN（保留目录结构；将先确认文件数）"
      >
        导入全部
      </button>
    </div>
  );
}
