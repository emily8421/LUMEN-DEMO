import type { DocumentPermission, DocumentVersion, KnowledgeDocument } from '../api';
import type { Draft } from '../app/types';
import { permissionLabels } from '../app/constants';
import { MarkdownBlock } from '../components/MarkdownBlock';

type DocumentsFeatureProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  isBusy: boolean;
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  versions: DocumentVersion[];
  onCreateDocument: () => void;
  onDelete: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onRestore: (versionNo: number) => void;
  onDownloadMarkdown: () => void;
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
  onCreateDocument,
  onDelete,
  onSave,
  onRestore,
  onDownloadMarkdown,
}: DocumentsFeatureProps) {
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
      <div className="workspace-body document-view-grid">
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
                  value={draft.content_md}
                  onChange={(event) => onDraftChange({ ...draft, content_md: event.target.value })}
                  placeholder="输入或编辑 Markdown 内容"
                  rows={14}
                />
              </label>
              <section className="markdown-preview" aria-label="Markdown 预览">
                <div className="subsection-heading">
                  <strong>预览</strong>
                  <span>保存前检查标题、列表、强调与段落</span>
                </div>
                <MarkdownBlock content={draft.content_md} emptyText="暂无可预览内容。" />
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
          {!selectedDocument || isCreating ? (
            <p className="empty-state inspector-empty">保存文档后可查看版本历史。</p>
          ) : versions.length === 0 ? (
            <p className="empty-state inspector-empty">暂无版本记录。</p>
          ) : (
            <ol className="version-list inspector-list">
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
        </aside>
      </div>
    </section>
  );
}
