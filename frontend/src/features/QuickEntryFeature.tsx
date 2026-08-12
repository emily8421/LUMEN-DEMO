import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import type { KnowledgeDocument, QuickEntryMode, QuickEntryView, TagView } from '../api';

const MODE_OPTIONS: Array<{ value: QuickEntryMode; label: string; hint: string }> = [
  { value: 'create_document', label: '转为新文档', hint: '新建私有文档并入列' },
  { value: 'append_document', label: '追加到已有文档', hint: '拼到目标文档末尾' },
];

type QuickEntryFeatureProps = {
  isOpen: boolean;
  isBusy: boolean;
  title: string;
  source: string;
  contentMd: string;
  tagIds: number[];
  mode: QuickEntryMode;
  targetDocumentId: number | null;
  tags: TagView[];
  documents: KnowledgeDocument[];
  lastEntry: QuickEntryView | null;
  onTitleChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onContentMdChange: (value: string) => void;
  onToggleTag: (tagId: number) => void;
  onModeChange: (mode: QuickEntryMode) => void;
  onTargetDocumentChange: (id: number | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDiscard: () => void;
  onClose: () => void;
  onOpenDocument: (documentId: number, title: string) => void;
};

/**
 * REQ-025 快速录入抽屉（Phase2A 最小版）。
 *
 * 顶部胶囊触发，侧滑抽屉表单：标题 / 来源 / 摘要 / tag_ids / mode（draft / create / append）。
 * 录入后结果区：draft 可丢弃；create / append 可打开目标文档。
 * 不新增需求 / 接口 / 验收目标，只承接 API-017（后端 Task A f771e02）已实现契约。
 */
export function QuickEntryFeature({
  isOpen,
  isBusy,
  title,
  source,
  contentMd,
  tagIds,
  mode,
  targetDocumentId,
  tags,
  documents,
  lastEntry,
  onTitleChange,
  onSourceChange,
  onContentMdChange,
  onToggleTag,
  onModeChange,
  onTargetDocumentChange,
  onSubmit,
  onDiscard,
  onClose,
  onOpenDocument,
}: QuickEntryFeatureProps) {
  const resultRef = useRef<HTMLElement>(null);
  // 录入后结果区可能落在抽屉视口下方，自动滚入视野，避免 draft 录入后看不到反馈。
  // hooks 必须在 early return 之前调用（rules-of-hooks）；isOpen=false 时 ref.current=null，可选链不操作。
  useEffect(() => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [lastEntry]);

  if (!isOpen) {
    return null;
  }

  const submitDisabled =
    isBusy || title.trim().length === 0 || (mode === 'append_document' && targetDocumentId == null);
  const targetDocumentTitle = (id: number | null) =>
    documents.find((document) => document.id === id)?.title ?? (id == null ? '' : `文档 #${id}`);

  return (
    <div className="quick-entry-overlay" onClick={onClose}>
      <aside
        className="quick-entry-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="快速录入"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="quick-entry-header">
          <div className="view-title">
            <h2>快速录入</h2>
          </div>
          <button type="button" className="chip-remove quick-entry-close" aria-label="关闭" onClick={onClose}>
            ✕
          </button>
        </header>

        <form className="quick-entry-form" onSubmit={onSubmit}>
          <label className="quick-entry-field">
            <span>标题</span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="一句话标题"
              autoFocus
            />
          </label>

          <label className="quick-entry-field">
            <span>来源（可选）</span>
            <input
              value={source}
              onChange={(event) => onSourceChange(event.target.value)}
              placeholder="会议 / 链接 / 口述..."
            />
          </label>

          <label className="quick-entry-field">
            <span>摘要（可选）</span>
            <textarea
              value={contentMd}
              onChange={(event) => onContentMdChange(event.target.value)}
              placeholder="要点或正文片段"
              rows={3}
            />
          </label>

          <fieldset className="quick-entry-field">
            <legend>标签</legend>
            {tags.length === 0 ? (
              <p className="empty-state">暂无标签，可在「标签」视图新建后再关联。</p>
            ) : (
              <ul className="quick-entry-tag-list">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <label className={tagIds.includes(tag.id) ? 'quick-entry-tag checked' : 'quick-entry-tag'}>
                      <input
                        type="checkbox"
                        checked={tagIds.includes(tag.id)}
                        onChange={() => onToggleTag(tag.id)}
                        disabled={isBusy}
                      />
                      <span>{tag.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="quick-entry-field">
            <legend>处理方式</legend>
            <div className="quick-entry-mode-group">
              {MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={mode === option.value ? 'quick-entry-mode active' : 'quick-entry-mode'}
                >
                  <input
                    type="radio"
                    name="quick-entry-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => onModeChange(option.value)}
                    disabled={isBusy}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {mode === 'append_document' ? (
            <label className="quick-entry-field">
              <span>目标文档</span>
              <select
                value={targetDocumentId ?? ''}
                onChange={(event) =>
                  onTargetDocumentChange(event.target.value === '' ? null : Number(event.target.value))
                }
                disabled={isBusy}
              >
                <option value="">选择要追加的文档…</option>
                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button type="submit" disabled={submitDisabled}>
            录入
          </button>
        </form>

        {lastEntry ? (
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
        ) : null}
      </aside>
    </div>
  );
}
