import { useEffect, useRef } from 'react';
import type { KnowledgeDocument, QuickEntryView } from '../../api';

type QuickEntryResultProps = {
  lastEntry: QuickEntryView;
  isBusy: boolean;
  documents: KnowledgeDocument[];
  onDiscard: () => void;
  onOpenDocument: (documentId: number, title: string) => void;
};

/**
 * 快速录入抽屉的「最近一次录入」结果区：draft 可丢弃；create / append 可打开目标文档。
 * 从 QuickEntryFeature 抽出（file-size ratchet 阈值内），DOM / 行为与拆分前一致，
 * 不新增需求 / 接口 / 验收目标，只承接 API-017 已实现契约。
 */
export function QuickEntryResult({
  lastEntry,
  isBusy,
  documents,
  onDiscard,
  onOpenDocument,
}: QuickEntryResultProps) {
  const resultRef = useRef<HTMLElement>(null);
  // 录入后结果区可能落在抽屉视口下方，自动滚入视野，避免 draft 录入后看不到反馈。
  useEffect(() => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [lastEntry]);

  const targetDocumentTitle = (id: number | null) =>
    documents.find((document) => document.id === id)?.title ?? (id == null ? '' : `文档 #${id}`);

  return (
    <section ref={resultRef} className="quick-entry-result">
      <div className="subsection-heading">
        <strong>最近一次录入</strong>
        <span>#{lastEntry.id} · {lastEntry.title}</span>
      </div>
      {lastEntry.status === 'draft' ? (
        <div className="quick-entry-result-row">
          <small>已保存为草稿（仅自己可见）。后端最小版无草稿列表，丢弃请在此操作。</small>
          <button type="button" className="secondary" onClick={onDiscard} disabled={isBusy}>
            丢弃草稿
          </button>
        </div>
      ) : null}
      {lastEntry.status === 'converted' && lastEntry.created_document_id != null ? (
        <div className="quick-entry-result-row">
          <small>已转为新文档 #{lastEntry.created_document_id}。</small>
          <button
            type="button"
            className="secondary"
            onClick={() => onOpenDocument(lastEntry.created_document_id as number, lastEntry.title)}
            disabled={isBusy}
          >
            打开文档
          </button>
        </div>
      ) : null}
      {lastEntry.status === 'converted' && lastEntry.target_document_id != null ? (
        <div className="quick-entry-result-row">
          <small>已追加到文档 #{lastEntry.target_document_id}。</small>
          <button
            type="button"
            className="secondary"
            onClick={() =>
              onOpenDocument(lastEntry.target_document_id as number, targetDocumentTitle(lastEntry.target_document_id))
            }
            disabled={isBusy}
          >
            打开文档
          </button>
        </div>
      ) : null}
    </section>
  );
}
