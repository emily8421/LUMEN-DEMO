import { DocumentsFeature } from '../features/documents/DocumentsFeature';
import { LocalDocPreview } from '../features/LocalDocPreview';
import type { LocalVaultDoc } from './local-vault-index';
import type { UseLocalVaultMount } from './useLocalVaultMount';
import type { useDocuments } from './useDocuments';
import type { useTags } from './useTags';
import type { useAiPolish } from './useAiPolish';

/**
 * 工作区「文档」视图分支（Slice E 从 WorkspaceMain 抽出）。
 * 三元：本地挂载预览（localPreviewDoc 非空）→ LocalDocPreview；否则 → DocumentsFeature。
 */
export interface WorkspaceMainDocumentsProps {
  isBusy: boolean;
  /** 右栏（Inspector）可见性，透传给 DocumentsFeature。 */
  rightPaneOpen: boolean;
  /** 收起右栏，透传给 DocumentsFeature。 */
  onToggleRightPane: () => void;
  documents: ReturnType<typeof useDocuments>;
  tags: ReturnType<typeof useTags>;
  aiPolish: ReturnType<typeof useAiPolish>;
  localPreviewDoc: LocalVaultDoc | null;
  onCloseLocalDoc: () => void;
  /** REQ-049：本地挂载 vm（主区 LocalDocPreview 编辑入口）。 */
  localVault: UseLocalVaultMount;
  onOpenImport: () => void;
  /** 展开左目录（documents 空态引导按钮）。 */
  onExpandLeftPane: () => void;
  /** 返回引导卡（退出新建/取消选中）。 */
  onExitToEmpty: () => void;
}

export function WorkspaceMainDocuments({
  isBusy,
  rightPaneOpen,
  onToggleRightPane,
  documents,
  tags,
  aiPolish,
  localPreviewDoc,
  onCloseLocalDoc,
  localVault,
  onOpenImport,
  onExpandLeftPane,
  onExitToEmpty,
}: WorkspaceMainDocumentsProps) {
  if (localPreviewDoc) {
    return (
      <LocalDocPreview
        doc={localPreviewDoc}
        onClose={onCloseLocalDoc}
        editingPath={localVault.editingPath}
        editingText={localVault.editingText}
        onBeginEdit={localVault.beginEdit}
        onEditingTextChange={localVault.setEditingText}
        onSaveEdit={() => void localVault.saveEdit()}
        onCancelEdit={localVault.cancelEdit}
      />
    );
  }
  return (
    <DocumentsFeature
      isCreating={documents.isCreating}
      selectedDocument={documents.selectedDocument}
      isBusy={isBusy}
      rightPaneOpen={rightPaneOpen}
      onToggleRightPane={onToggleRightPane}
      draft={documents.draft}
      onDraftChange={documents.setDraft}
      versions={documents.versions}
      outboundLinks={documents.outboundLinks}
      backlinks={documents.backlinks}
      documents={documents.documents}
      onOpenDocument={documents.handleOpenDocument}
      onCreateDocument={documents.handleCreateDocument}
      savedRevision={documents.savedRevision}
      onSave={documents.handleSave}
      onRestore={documents.handleRestore}
      onDownloadMarkdown={documents.handleDownloadMarkdown}
      onExportPdf={documents.handleExportPdf}
      onOpenImport={onOpenImport}
      documentTags={tags.documentTags}
      availableTags={tags.tags}
      addTagSelection={tags.addTagSelection}
      onAddTagSelectionChange={tags.setAddTagSelection}
      onAddTag={tags.handleAddDocumentTag}
      onCreateAndTag={tags.handleCreateAndTag}
      onRemoveTag={tags.handleRemoveDocumentTag}
      aiPolish={aiPolish}
      onExpandLeftPane={onExpandLeftPane}
      onExitToEmpty={onExitToEmpty}
    />
  );
}
