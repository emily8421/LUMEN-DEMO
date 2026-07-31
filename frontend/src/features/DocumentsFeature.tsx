import type {
  DocLinkView,
  DocumentPermission,
  DocumentTagView,
  DocumentVersion,
  KnowledgeDocument,
  TagView,
} from '../api';
import type { Draft } from '../app/types';
import { permissionLabels } from '../app/constants';
import { MarkdownBlock } from '../components/MarkdownBlock';
import { AiPolishFeature } from './AiPolishFeature';
import { useTextareaSelection } from '../app/useTextareaSelection';
import type { useAiPolish } from '../app/useAiPolish';

type DocumentsFeatureProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  isBusy: boolean;
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  versions: DocumentVersion[];
  /** 当前文档出链（outbound），供编辑预览把 [[wikilink]] 渲染成带状态可点击链接。 */
  outboundLinks: DocLinkView[];
  /** 当前文档反向链接（backlink），即引用本文的文档列表。 */
  backlinks: DocLinkView[];
  /** 当前空间可见文档，用于把反链 source_document_id 解析成可读标题。 */
  documents: KnowledgeDocument[];
  onOpenDocument: (documentId: number, title: string) => void;
  onCreateDocument: () => void;
  onDelete: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onRestore: (versionNo: number) => void;
  onDownloadMarkdown: () => void;
  /** 当前文档已打标签。 */
  documentTags: DocumentTagView[];
  /** 当前空间可见标签（打标签下拉用）。 */
  availableTags: TagView[];
  /** 打标签下拉当前选中。 */
  addTagSelection: number | null;
  onAddTagSelectionChange: (tagId: number | null) => void;
  onAddTag: (tagId: number | null) => void;
  onRemoveTag: (tagId: number) => void;
  /** REQ-014 AI 润色侧边栏状态 + handler（useAiPolish 返回）。 */
  aiPolish: ReturnType<typeof useAiPolish>;
  /** 右栏（Inspector）可见性（Doc-First §9.5，Sprint-21）。 */
  rightPaneOpen: boolean;
};

function markdownExcerpt(content: string, maxLength = 140) {
  const trimmedContent = content.trim();
  if (trimmedContent.length <= maxLength) {
    return trimmedContent;
  }
  return `${trimmedContent.slice(0, maxLength)}…`;
}

export function DocumentsFeature({
  isCreating,
  selectedDocument,
  isBusy,
  draft,
  onDraftChange,
  versions,
  outboundLinks,
  backlinks,
  documents,
  onOpenDocument,
  onCreateDocument,
  onDelete,
  onSave,
  onRestore,
  onDownloadMarkdown,
  documentTags,
  availableTags,
  addTagSelection,
  onAddTagSelectionChange,
  onAddTag,
  onRemoveTag,
  aiPolish,
  rightPaneOpen,
}: DocumentsFeatureProps) {
  const { ref: textareaRef, onSelect: handleTextareaSelect } = useTextareaSelection(
    aiPolish.changeSelection,
  );

  return (
    <section className="documents-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <p className="eyebrow">REQ-004 / REQ-005 / REQ-006</p>
          <h2>{isCreating ? '新建文档' : selectedDocument?.title ?? '选择文档'}</h2>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="secondary" onClick={onCreateDocument} disabled={isBusy}>新建</button>
          {selectedDocument && !isCreating ? (
            <>
              <button type="button" className="secondary" onClick={onDownloadMarkdown} disabled={isBusy}>下载 .md</button>
              <button type="button" className="danger" onClick={onDelete} disabled={isBusy}>删除</button>
            </>
          ) : null}
        </div>
      </div>
      <div className={`workspace-body document-view-grid${rightPaneOpen ? '' : ' pane-right-collapsed'}`}>
        <section className="editor-panel editor-pane">
          <form className="editor-form" onSubmit={onSave}>
            <div className="editor-toolbar">
              <label>
                标题
                <input
                  value={draft.title}
                  onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
                  placeholder="输入 Markdown 文档标题"
                />
              </label>
              <label>
                权限
                <select
                  value={draft.permission}
                  onChange={(event) => onDraftChange({ ...draft, permission: event.target.value as DocumentPermission })}
                >
                  {Object.entries(permissionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={isBusy || draft.title.trim().length === 0}>保存</button>
              {selectedDocument && !isCreating ? (
                <button type="button" className="danger" onClick={onDelete} disabled={isBusy}>删除</button>
              ) : null}
            </div>
            <div className="editor-content-grid">
              <label className="editor-field">
                Markdown 内容
                <textarea
                  ref={textareaRef}
                  value={draft.content_md}
                  onChange={(event) => onDraftChange({ ...draft, content_md: event.target.value })}
                  onSelect={handleTextareaSelect}
                  placeholder="输入或编辑 Markdown 内容"
                  rows={14}
                />
              </label>
              <section className="markdown-preview" aria-label="Markdown 预览">
                <div className="subsection-heading">
                  <strong>预览</strong>
                  <span>保存前检查标题、列表、强调与段落</span>
                </div>
                <MarkdownBlock
                  content={draft.content_md}
                  emptyText="暂无可预览内容。"
                  docLinks={outboundLinks}
                  onOpenDocument={onOpenDocument}
                />
              </section>
            </div>
          </form>
        </section>

        <aside className="versions-panel inspector-pane">
          <div className="inspector-header">
            <div>
              <p className="eyebrow">REQ-006</p>
              <h2>版本历史</h2>
            </div>
          </div>
          <div className="inspector-list">
            {!selectedDocument || isCreating ? (
              <p className="empty-state inspector-empty">保存文档后可查看版本历史。</p>
            ) : versions.length === 0 ? (
              <p className="empty-state inspector-empty">暂无版本记录。</p>
            ) : (
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
            )}

            <section className="backlinks-block" aria-label="反向链接">
              <div className="subsection-heading">
                <strong>反向链接</strong>
                <span>引用本文的文档</span>
              </div>
              {!selectedDocument || isCreating ? (
                <p className="empty-state inspector-empty">保存文档后可查看反向链接。</p>
              ) : backlinks.length === 0 ? (
                <p className="empty-state inspector-empty">暂无文档引用本文。</p>
              ) : (
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
              )}
            </section>

            <section className="tags-block" aria-label="标签">
              <div className="subsection-heading">
                <strong>标签</strong>
                <span>归类与组织文档</span>
              </div>
              {!selectedDocument || isCreating ? (
                <p className="empty-state inspector-empty">保存文档后可管理标签。</p>
              ) : (
                <>
                  {documentTags.length === 0 ? (
                    <p className="empty-state inspector-empty">暂未打标签。</p>
                  ) : (
                    <ul className="tag-chips">
                      {documentTags.map((tag) => (
                        <li key={tag.tag_id} className="tag-chip">
                          <span>{tag.name}</span>
                          <button
                            type="button"
                            className="chip-remove"
                            onClick={() => onRemoveTag(tag.tag_id)}
                            disabled={isBusy}
                            aria-label={`移除标签 ${tag.name}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="tag-add-row">
                    <select
                      value={addTagSelection ?? ''}
                      onChange={(event) =>
                        onAddTagSelectionChange(event.target.value ? Number(event.target.value) : null)
                      }
                      disabled={isBusy}
                    >
                      <option value="">选择标签…</option>
                      {availableTags
                        .filter((tag) => !documentTags.some((current) => current.tag_id === tag.id))
                        .map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onAddTag(addTagSelection)}
                      disabled={isBusy || addTagSelection == null}
                    >
                      打标签
                    </button>
                  </div>
                </>
              )}
            </section>

            <AiPolishFeature
              selection={aiPolish.selection}
              mode={aiPolish.mode}
              instruction={aiPolish.instruction}
              result={aiPolish.result}
              phase={aiPolish.phase}
              errorMessage={aiPolish.errorMessage}
              canWrite={aiPolish.canWrite}
              isBusy={isBusy}
              onModeChange={aiPolish.setMode}
              onInstructionChange={aiPolish.setInstruction}
              onRequestPolish={aiPolish.requestPolish}
              onApply={aiPolish.apply}
              onDiscard={aiPolish.discard}
              onOpenDocument={onOpenDocument}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
