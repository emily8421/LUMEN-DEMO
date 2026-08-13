import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type {
  DocLinkView,
  DocumentTagView,
  DocumentVersion,
  KnowledgeDocument,
  TagView,
} from '../../api';
import type { Draft } from '../../app/types';
import { DocumentEmptyState } from '../DocumentEmptyState';
import { DocumentInspectorFeature } from '../document-inspector/DocumentInspectorFeature';
import { usePaneWidth } from '../../app/usePaneWidth';
import type { useAiPolish } from '../../app/useAiPolish';
import { DocumentEditorForm } from './DocumentEditorForm';
import { DocumentPreviewPane } from './DocumentPreviewPane';

type DocumentMode = 'read' | 'edit' | 'split';

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
  /** 保存成功次数（useDocuments 自增），用于保存后自动回到阅读态。 */
  savedRevision: number;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onRestore: (versionNo: number) => void;
  onDownloadMarkdown: () => void;
  onExportPdf: () => void;
  onOpenImport: () => void;
  /** 当前文档已打标签。 */
  documentTags: DocumentTagView[];
  /** 当前空间可见标签（打标签下拉用）。 */
  availableTags: TagView[];
  /** 打标签下拉当前选中。 */
  addTagSelection: number | null;
  onAddTagSelectionChange: (tagId: number | null) => void;
  onAddTag: (tagId: number | null) => void;
  onCreateAndTag: (name: string) => void;
  onRemoveTag: (tagId: number) => void;
  /** REQ-014 AI 润色侧边栏状态 + handler（useAiPolish 返回）。 */
  aiPolish: ReturnType<typeof useAiPolish>;
  /** 右栏（Inspector）可见性（Doc-First §9.5，Sprint-21）。 */
  rightPaneOpen: boolean;
  /** 收起右栏（批1，点1），透传给 DocumentInspectorFeature 边缘按钮。 */
  onToggleRightPane: () => void;
  /** 展开左目录（空态引导按钮，Doc-First §9.5，Sprint-21 slice 3c）。 */
  onExpandLeftPane: () => void;
  /** 返回引导卡（退出新建态 / 取消选中，Doc-First §9.5.7 F-impl-10）。 */
  onExitToEmpty: () => void;
};

const DOCUMENT_MODES: Array<{ value: DocumentMode; label: string }> = [
  { value: 'read', label: '阅读' },
  { value: 'edit', label: '编辑' },
  { value: 'split', label: '并排' },
];

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
  savedRevision,
  onSave,
  onRestore,
  onDownloadMarkdown,
  onExportPdf,
  onOpenImport,
  documentTags,
  availableTags,
  addTagSelection,
  onAddTagSelectionChange,
  onAddTag,
  onCreateAndTag,
  onRemoveTag,
  aiPolish,
  rightPaneOpen,
  onToggleRightPane,
  onExpandLeftPane,
  onExitToEmpty,
}: DocumentsFeatureProps) {
  const rightPaneWidth = usePaneWidth('right');
  const [documentMode, setDocumentMode] = useState<DocumentMode>('read');

  useEffect(() => {
    if (isCreating) {
      setDocumentMode('edit');
      return;
    }
    if (selectedDocument) {
      setDocumentMode('read');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应 selectedDocument.id 变化（切换文档）；selectedDocument 整对象不列入，避免同文档刷新触发多余 mode 重置
  }, [isCreating, selectedDocument?.id]);

  // 并排模式：自动收起右栏（Inspector 与编辑/预览抢横向空间），把宽度留给两侧，避免挤压变形。
  // 切回阅读/编辑态不影响右栏偏好（可手动 Ctrl+R 或点边缘按钮再展开）。
  useEffect(() => {
    if (documentMode === 'split' && rightPaneOpen) {
      onToggleRightPane();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentMode]);

  // 保存成功后回到阅读态（编辑/并排保存同一文档时 id 不变，需显式信号）。
  useEffect(() => {
    if (savedRevision > 0 && !isCreating) {
      setDocumentMode('read');
    }
  }, [savedRevision, isCreating]);

  const canShowModes = Boolean(selectedDocument || isCreating);
  const effectiveMode = isCreating && documentMode === 'read' ? 'edit' : documentMode;

  return (
    <section className="documents-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>{isCreating ? '新建文档' : selectedDocument?.title ?? '选择文档'}</h2>
        </div>
        <div className="toolbar-actions">
          {canShowModes ? (
            <div className="document-mode-switch" role="group" aria-label="文档模式">
              {DOCUMENT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={effectiveMode === mode.value ? 'active' : ''}
                  onClick={() => setDocumentMode(mode.value)}
                  disabled={isBusy || (isCreating && mode.value === 'read')}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          ) : null}
          {selectedDocument || isCreating ? (
            <button type="button" className="secondary" onClick={onExitToEmpty} disabled={isBusy}>返回</button>
          ) : null}
          <button type="button" className="secondary" onClick={onOpenImport} disabled={isBusy}>导入</button>
          <button type="button" className="secondary" onClick={onCreateDocument} disabled={isBusy}>新建</button>
          {selectedDocument && !isCreating ? (
            <>
              <button type="button" className="secondary" onClick={onDownloadMarkdown} disabled={isBusy}>下载 .md</button>
              <button type="button" className="secondary" onClick={onExportPdf} disabled={isBusy}>导出 PDF</button>
            </>
          ) : null}
        </div>
      </div>
      <div
        className={`workspace-body document-view-grid${rightPaneOpen ? '' : ' pane-right-collapsed'}`}
        style={{ '--right-pane-width': `${rightPaneWidth.width}px` } as CSSProperties}
      >
        <section className="editor-panel editor-pane">
          {!selectedDocument && !isCreating ? (
            <DocumentEmptyState
              isBusy={isBusy}
              onCreateDocument={onCreateDocument}
              onExpandLeftPane={onExpandLeftPane}
            />
          ) : effectiveMode === 'read' ? (
            <DocumentPreviewPane draft={draft} outboundLinks={outboundLinks} onOpenDocument={onOpenDocument} effectiveMode={effectiveMode} />
          ) : (
            <DocumentEditorForm
              draft={draft}
              onDraftChange={onDraftChange}
              onSave={onSave}
              isBusy={isBusy}
              effectiveMode={effectiveMode}
              aiPolish={aiPolish}
              outboundLinks={outboundLinks}
              onOpenDocument={onOpenDocument}
            />
          )}
        </section>

        {rightPaneOpen ? (
          <div
            className={rightPaneWidth.resizing ? 'pane-resizer pane-resizer-right resizing' : 'pane-resizer pane-resizer-right'}
            role="separator"
            aria-orientation="vertical"
            aria-label="调整右侧栏宽度"
            tabIndex={0}
            onPointerDown={rightPaneWidth.startResize}
            onPointerMove={rightPaneWidth.moveResize}
            onPointerUp={rightPaneWidth.endResize}
            onPointerCancel={rightPaneWidth.endResize}
            onDoubleClick={rightPaneWidth.resetWidth}
            onKeyDown={rightPaneWidth.handleKeyDown}
          />
        ) : null}

        <DocumentInspectorFeature
          isCreating={isCreating}
          selectedDocument={selectedDocument}
          isBusy={isBusy}
          versions={versions}
          backlinks={backlinks}
          documents={documents}
          onOpenDocument={onOpenDocument}
          onRestore={onRestore}
          documentTags={documentTags}
          availableTags={availableTags}
          addTagSelection={addTagSelection}
          onAddTagSelectionChange={onAddTagSelectionChange}
          onAddTag={onAddTag}
          onCreateAndTag={onCreateAndTag}
          onToggleRightPane={onToggleRightPane}
          onRemoveTag={onRemoveTag}
          aiPolish={aiPolish}
        />
      </div>
    </section>
  );
}
