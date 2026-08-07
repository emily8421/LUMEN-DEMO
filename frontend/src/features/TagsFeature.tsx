import type { FormEvent } from 'react';
import type { KnowledgeDocument, TagView } from '../api';
import { permissionLabels } from '../app/constants';

type TagsFeatureProps = {
  isBusy: boolean;
  tags: TagView[];
  selectedTagId: number | null;
  tagDocuments: KnowledgeDocument[];
  newTagName: string;
  onNewTagNameChange: (name: string) => void;
  onSelectTag: (tagId: number | null) => void;
  onCreateTag: (event: FormEvent<HTMLFormElement>) => void;
  onOpenDocument: (documentId: number, title: string) => void;
  /** 空态引导：去文档视图新建 / 导入（Sprint-25 L1）。 */
  onGoToDocuments: () => void;
  /** 标签 CRUD（批2b 步2，API-027）。 */
  editingTagId: number | null;
  editDraft: { name: string; description: string; color: string };
  onEditDraftChange: (draft: { name: string; description: string; color: string }) => void;
  onBeginEditTag: (tag: TagView) => void;
  onCancelEditTag: () => void;
  onUpdateTag: (event: FormEvent<HTMLFormElement>) => void;
  onArchiveTag: (tag: TagView) => void;
};

export function TagsFeature({
  isBusy,
  tags,
  selectedTagId,
  tagDocuments,
  newTagName,
  onNewTagNameChange,
  onSelectTag,
  onCreateTag,
  onOpenDocument,
  onGoToDocuments,
  editingTagId,
  editDraft,
  onEditDraftChange,
  onBeginEditTag,
  onCancelEditTag,
  onUpdateTag,
  onArchiveTag,
}: TagsFeatureProps) {
  return (
    <section className="tag-panel focus-panel task-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>标签</h2>
        </div>
        <form className="toolbar-actions" onSubmit={onCreateTag}>
          <input
            value={newTagName}
            onChange={(event) => onNewTagNameChange(event.target.value)}
            placeholder="输入标签名，回车或点新建"
          />
          <button type="submit" className="secondary" disabled={isBusy || newTagName.trim().length === 0}>
            新建
          </button>
        </form>
      </div>
      <div className="tag-workspace-body">
        <div className="tag-list-pane">
          <div className="subsection-heading">
            <strong>空间标签</strong>
            <span>点击查看该标签下文档</span>
          </div>
          {tags.length === 0 ? (
            <div className="empty-state">
              <p>暂无标签，新建一个开始组织文档。</p>
              <button type="button" className="secondary" onClick={onGoToDocuments} disabled={isBusy}>
                还没有内容？先去新建或导入文档 →
              </button>
            </div>
          ) : (
            <ul className="tag-list">
              {tags.map((tag) =>
                editingTagId === tag.id ? (
                  <li key={tag.id} className="tag-edit-row">
                    <form className="tag-edit-form" onSubmit={onUpdateTag}>
                      <label>
                        名称
                        <input
                          value={editDraft.name}
                          onChange={(event) => onEditDraftChange({ ...editDraft, name: event.target.value })}
                          placeholder="标签名"
                        />
                      </label>
                      <label>
                        描述
                        <input
                          value={editDraft.description}
                          onChange={(event) => onEditDraftChange({ ...editDraft, description: event.target.value })}
                          placeholder="标签用途（可选）"
                        />
                      </label>
                      <label>
                        颜色
                        <input
                          type="color"
                          value={editDraft.color || '#2563eb'}
                          onChange={(event) => onEditDraftChange({ ...editDraft, color: event.target.value })}
                          aria-label="标签颜色"
                        />
                      </label>
                      <div className="tag-edit-actions">
                        <button type="submit" disabled={isBusy || editDraft.name.trim().length === 0}>保存</button>
                        <button type="button" className="secondary" onClick={onCancelEditTag} disabled={isBusy}>取消</button>
                        <button type="button" className="danger" onClick={() => onArchiveTag(tag)} disabled={isBusy}>归档</button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li key={tag.id}>
                    <button
                      type="button"
                      className={selectedTagId === tag.id ? 'tag-item active' : 'tag-item'}
                      onClick={() => onSelectTag(selectedTagId === tag.id ? null : tag.id)}
                    >
                      <strong>{tag.name}</strong>
                      <small>{tag.document_count} 篇文档</small>
                    </button>
                    <button
                      type="button"
                      className="tag-edit-button"
                      onClick={() => onBeginEditTag(tag)}
                      disabled={isBusy}
                      title="重命名 / 编辑标签"
                      aria-label={`编辑标签 ${tag.name}`}
                    >
                      ✎
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>

        <div className="tag-documents-pane">
          <div className="subsection-heading">
            <strong>{selectedTagId ? '标签下文档' : '选择标签'}</strong>
            <span>{selectedTagId ? `共 ${tagDocuments.length} 篇可见文档` : '点击左侧标签查看'}</span>
          </div>
          {!selectedTagId ? (
            <p className="empty-state">点击左侧任一标签，查看该标签下你可见的文档。</p>
          ) : tagDocuments.length === 0 ? (
            <p className="empty-state">该标签下暂无你可见的文档。</p>
          ) : (
            <ol className="tag-document-list">
              {tagDocuments.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    className="tag-document-link"
                    onClick={() => onOpenDocument(doc.id, doc.title)}
                  >
                    <strong>{doc.title}</strong>
                    <small>{permissionLabels[doc.permission]}</small>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}