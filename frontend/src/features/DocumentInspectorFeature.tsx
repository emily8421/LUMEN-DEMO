import { useEffect, useState } from 'react';
import type {
  DocLinkView,
  DocumentTagView,
  DocumentVersion,
  KnowledgeDocument,
  TagView,
} from '../api';
import { MarkdownBlock } from '../components/MarkdownBlock';
import { AiPolishFeature } from './AiPolishFeature';
import type { useAiPolish } from '../app/useAiPolish';

type InspectorTab = 'versions' | 'links' | 'tags' | 'ai';

type DocumentInspectorFeatureProps = {
  isCreating: boolean;
  selectedDocument: KnowledgeDocument | null;
  isBusy: boolean;
  versions: DocumentVersion[];
  backlinks: DocLinkView[];
  documents: KnowledgeDocument[];
  onOpenDocument: (documentId: number, title: string) => void;
  onRestore: (versionNo: number) => void;
  documentTags: DocumentTagView[];
  availableTags: TagView[];
  addTagSelection: number | null;
  onAddTagSelectionChange: (tagId: number | null) => void;
  onAddTag: (tagId: number | null) => void;
  onCreateAndTag: (name: string) => void;
  onRemoveTag: (tagId: number) => void;
  aiPolish: ReturnType<typeof useAiPolish>;
};

const INSPECTOR_TABS: Array<{ value: InspectorTab; label: string }> = [
  { value: 'versions', label: '版本' },
  { value: 'links', label: '链接' },
  { value: 'tags', label: '标签' },
  { value: 'ai', label: 'AI' },
];

function markdownExcerpt(content: string, maxLength = 140) {
  const trimmedContent = content.trim();
  if (trimmedContent.length <= maxLength) {
    return trimmedContent;
  }
  return `${trimmedContent.slice(0, maxLength)}...`;
}

export function DocumentInspectorFeature({
  isCreating,
  selectedDocument,
  isBusy,
  versions,
  backlinks,
  documents,
  onOpenDocument,
  onRestore,
  documentTags,
  availableTags,
  addTagSelection,
  onAddTagSelectionChange,
  onAddTag,
  onCreateAndTag,
  onRemoveTag,
  aiPolish,
}: DocumentInspectorFeatureProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('versions');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    setActiveTab('versions');
  }, [isCreating, selectedDocument?.id]);

  useEffect(() => {
    if (
      aiPolish.selection
      || aiPolish.phase === 'loading'
      || aiPolish.phase === 'error'
      || aiPolish.result
    ) {
      setActiveTab('ai');
    }
  }, [aiPolish.errorMessage, aiPolish.phase, aiPolish.result, aiPolish.selection]);

  return (
    <aside className="versions-panel inspector-pane document-inspector-pane">
      <div className="inspector-tabs" role="tablist" aria-label="文档侧栏">
        {INSPECTOR_TABS.map((tab) => (
          <button
            key={tab.value}
            id={`document-inspector-tab-${tab.value}`}
            type="button"
            role="tab"
            className={activeTab === tab.value ? 'active' : ''}
            aria-selected={activeTab === tab.value}
            aria-controls={`document-inspector-${tab.value}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`document-inspector-${activeTab}`}
        className="inspector-list document-inspector-body"
        role="tabpanel"
        aria-labelledby={`document-inspector-tab-${activeTab}`}
      >
        {activeTab === 'versions' ? (
          <>
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
          </>
        ) : null}

        {activeTab === 'links' ? (
          <section className="inspector-tab-section" aria-label="反向链接">
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
        ) : null}

        {activeTab === 'tags' ? (
          <section className="inspector-tab-section" aria-label="标签">
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
              </>
            )}
          </section>
        ) : null}

        {activeTab === 'ai' ? (
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
        ) : null}
      </div>
    </aside>
  );
}
