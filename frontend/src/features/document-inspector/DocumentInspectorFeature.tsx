import { useEffect, useState } from 'react';
import type {
  DocLinkView,
  DocumentTagView,
  DocumentVersion,
  KnowledgeDocument,
  TagView,
} from '../../api';
import { AiPolishFeature } from '../AiPolishFeature';
import { PaneEdgeToggle } from '../../app/PaneEdgeToggle';
import type { useAiPolish } from '../../app/useAiPolish';
import { InspectorVersionsTab } from './InspectorVersionsTab';
import { InspectorLinksTab } from './InspectorLinksTab';
import { InspectorTagsTab } from './InspectorTagsTab';

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
  /** 收起右栏（批1，点1：右栏左边缘就近折叠）。 */
  onToggleRightPane: () => void;
};

const INSPECTOR_TABS: Array<{ value: InspectorTab; label: string }> = [
  { value: 'versions', label: '版本' },
  { value: 'links', label: '链接' },
  { value: 'tags', label: '标签' },
  { value: 'ai', label: 'AI' },
];

/**
 * 文档侧栏（版本 / 链接 / 标签 / AI 四 tab，tab 状态 + 切换 + AI tab 装配）。
 * E4 Slice D 拆分：版本 / 链接 / 标签分别移入 document-inspector 子文件。
 */
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
  onToggleRightPane,
}: DocumentInspectorFeatureProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('versions');

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
      <PaneEdgeToggle side="right" onToggle={onToggleRightPane} label="收起右栏（Ctrl+R）" />
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
          <InspectorVersionsTab
            isCreating={isCreating}
            selectedDocument={selectedDocument}
            versions={versions}
            isBusy={isBusy}
            onRestore={onRestore}
          />
        ) : null}

        {activeTab === 'links' ? (
          <InspectorLinksTab
            isCreating={isCreating}
            selectedDocument={selectedDocument}
            backlinks={backlinks}
            documents={documents}
            onOpenDocument={onOpenDocument}
          />
        ) : null}

        {activeTab === 'tags' ? (
          <InspectorTagsTab
            isCreating={isCreating}
            selectedDocument={selectedDocument}
            documentTags={documentTags}
            availableTags={availableTags}
            addTagSelection={addTagSelection}
            onAddTagSelectionChange={onAddTagSelectionChange}
            onAddTag={onAddTag}
            onCreateAndTag={onCreateAndTag}
            onRemoveTag={onRemoveTag}
            isBusy={isBusy}
          />
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
