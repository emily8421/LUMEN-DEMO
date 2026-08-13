import type { DocumentVersion, KnowledgeDocument } from '../../api';
import { MarkdownBlock } from '../../components/MarkdownBlock';

function markdownExcerpt(content: string, maxLength = 140) {
  const trimmedContent = content.trim();
  if (trimmedContent.length <= maxLength) {
    return trimmedContent;
  }
  return `${trimmedContent.slice(0, maxLength)}...`;
}

type InspectorVersionsTabProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  versions: DocumentVersion[];
  isBusy: boolean;
  onRestore: (versionNo: number) => void;
};

/**
 * 文档侧栏「版本」tab：版本历史列表 + 内容摘要 + 恢复按钮。
 * E4 Slice D 从 DocumentInspectorFeature 拆分。
 */
export function InspectorVersionsTab({
  isCreating,
  selectedDocument,
  versions,
  isBusy,
  onRestore,
}: InspectorVersionsTabProps) {
  if (!selectedDocument || isCreating) {
    return <p className="empty-state inspector-empty">保存文档后可查看版本历史。</p>;
  }
  if (versions.length === 0) {
    return <p className="empty-state inspector-empty">暂无版本记录。</p>;
  }

  return (
    <ol className="version-list">
      {versions.map((version) => (
        <li key={version.id}>
          <div>
            <strong>v{version.version_no}</strong>
            <small>{new Date(version.created_at).toLocaleString()} · editor #{version.editor_id}</small>
          </div>
          <MarkdownBlock content={markdownExcerpt(version.content_md)} emptyText="空内容" className="compact-markdown" />
          <button type="button" onClick={() => onRestore(version.version_no)} disabled={isBusy}>
            恢复
          </button>
        </li>
      ))}
    </ol>
  );
}
