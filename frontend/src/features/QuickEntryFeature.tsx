import { useRef } from 'react';
import type { FormEvent } from 'react';
import type { KnowledgeDocument, QuickEntryMode, QuickEntryView, TagView } from '../api';
import { useModalFocus } from './shared/useModalFocus';
import { QuickEntryResult } from './quick-entry/QuickEntryResult';

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
  const drawerRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { handleKeyDown: handleFocusKeyDown } = useModalFocus({
    isOpen,
    containerRef: drawerRef,
    initialFocusRef: titleInputRef,
  });

  if (!isOpen) {
    return null;
  }

  const submitDisabled =
    isBusy || title.trim().length === 0 || (mode === 'append_document' && targetDocumentId == null);

  return (
    <div className="quick-entry-overlay" onClick={onClose}>
      <aside
        ref={drawerRef}
        className="quick-entry-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="快速录入"
        onKeyDown={handleFocusKeyDown}
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
              ref={titleInputRef}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="一句话标题"
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
          <QuickEntryResult
            lastEntry={lastEntry}
            isBusy={isBusy}
            documents={documents}
            onDiscard={onDiscard}
            onOpenDocument={onOpenDocument}
          />
        ) : null}
      </aside>
    </div>
  );
}
