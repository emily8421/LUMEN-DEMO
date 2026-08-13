import type { DocLinkView } from '../../api';
import type { Draft } from '../../app/types';
import { MarkdownBlock } from '../../components/MarkdownBlock';

/**
 * 文档预览面板（Slice E 从 DocumentsFeature 抽出）。
 * 阅读态全宽（含 TOC + document-reading-preview 样式）；编辑/并排态窄栏（带「预览」小标题，无 TOC）。
 */
interface DocumentPreviewPaneProps {
  draft: Draft;
  outboundLinks: DocLinkView[];
  onOpenDocument: (documentId: number, title: string) => void;
  /** 'read' 阅读态；'edit' / 'split' 编辑·并排态。 */
  effectiveMode: 'read' | 'edit' | 'split';
}

export function DocumentPreviewPane({ draft, outboundLinks, onOpenDocument, effectiveMode }: DocumentPreviewPaneProps) {
  return (
    <section
      className={effectiveMode === 'read' ? 'markdown-preview document-reading-preview' : 'markdown-preview'}
      aria-label={effectiveMode === 'read' ? '文档阅读' : 'Markdown 预览'}
    >
      {effectiveMode !== 'read' ? (
        <div className="subsection-heading">
          <strong>预览</strong>
          <span>保存前检查标题、列表、强调与段落</span>
        </div>
      ) : null}
      <MarkdownBlock
        content={draft.content_md}
        emptyText="暂无可预览内容。"
        docLinks={outboundLinks}
        onOpenDocument={onOpenDocument}
        showToc={effectiveMode === 'read'}
      />
    </section>
  );
}
