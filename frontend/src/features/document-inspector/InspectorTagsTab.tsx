import { useState } from 'react';
import type { DocumentTagView, KnowledgeDocument, TagView } from '../../api';

type InspectorTagsTabProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  documentTags: DocumentTagView[];
  availableTags: TagView[];
  addTagSelection: number | null;
  onAddTagSelectionChange: (tagId: number | null) => void;
  onAddTag: (tagId: number | null) => void;
  onCreateAndTag: (name: string) => void;
  onRemoveTag: (tagId: number) => void;
  isBusy: boolean;
};

/**
 * 文档侧栏「标签」tab：现有标签 chips + 下拉打标签 + 新建并打标签。
 * E4 Slice D 从 DocumentInspectorFeature 拆分（newTagName state 随迁本组件）。
 */
export function InspectorTagsTab({
  isCreating,
  selectedDocument,
  documentTags,
  availableTags,
  addTagSelection,
  onAddTagSelectionChange,
  onAddTag,
  onCreateAndTag,
  onRemoveTag,
  isBusy,
}: InspectorTagsTabProps) {
  const [newTagName, setNewTagName] = useState('');

  if (!selectedDocument || isCreating) {
    return <p className="empty-state inspector-empty">保存文档后可管理标签。</p>;
  }

  return (
    <section className="inspector-tab-section" aria-label="标签">
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
                x
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
          <option value="">选择标签...</option>
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
      <div className="tag-add-row tag-create-row">
        <input
          type="text"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="或输入新标签名"
          disabled={isBusy}
        />
        <button
          type="button"
          className="secondary"
          onClick={() => {
            onCreateAndTag(newTagName);
            setNewTagName('');
          }}
          disabled={isBusy || newTagName.trim().length === 0}
        >
          新建并打标签
        </button>
      </div>
    </section>
  );
}
