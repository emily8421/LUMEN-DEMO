import type { DocLinkView, KnowledgeDocument } from '../../api';

type InspectorLinksTabProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  backlinks: DocLinkView[];
  documents: KnowledgeDocument[];
  onOpenDocument: (documentId: number, title: string) => void;
};

/**
 * 文档侧栏「链接」tab：反向链接列表（来源文档 + 引用文本）。
 * E4 Slice D 从 DocumentInspectorFeature 拆分。
 */
export function InspectorLinksTab({
  isCreating,
  selectedDocument,
  backlinks,
  documents,
  onOpenDocument,
}: InspectorLinksTabProps) {
  if (!selectedDocument || isCreating) {
    return <p className="empty-state inspector-empty">保存文档后可查看反向链接。</p>;
  }
  if (backlinks.length === 0) {
    return <p className="empty-state inspector-empty">暂无文档引用本文。</p>;
  }

  return (
    <section className="inspector-tab-section" aria-label="反向链接">
      <ol className="backlink-list">
        {backlinks.map((link) => {
          const sourceTitle = documents.find((document) => document.id === link.source_document_id)?.title
            ?? `文档 #${link.source_document_id}`;
          return (
            <li key={link.id}>
              <button
                type="button"
                className="backlink-link"
                onClick={() => onOpenDocument(link.source_document_id, sourceTitle)}
              >
                <strong>{sourceTitle}</strong>
                <small>以「{link.link_text}」引用</small>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
