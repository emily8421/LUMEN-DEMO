import { DocumentsFeature } from '../features/DocumentsFeature';
import { LocalDocPreview } from '../features/LocalDocPreview';
import type { LocalVaultDoc } from './local-vault-index';
import type { UseLocalVaultMount } from './useLocalVaultMount';
import { SearchFeature } from '../features/SearchFeature';
import { QueryFeature } from '../features/QueryFeature';
import { TermsFeature } from '../features/TermsFeature';
import { TagsFeature } from '../features/TagsFeature';
import { TimelineFeature } from '../features/TimelineFeature';
import { WelcomeFeature } from '../features/WelcomeFeature';
import { AdminUsersFeature } from '../features/AdminUsersFeature';
import { MembersFeature } from '../features/MembersFeature';
import type { ActiveView } from './WorkspaceViewNav';
import { useDocuments } from './useDocuments';
import { useSearch } from './useSearch';
import { useQuery } from './useQuery';
import { useTerms } from './useTerms';
import { useTermCategories } from './useTermCategories';
import { useTags } from './useTags';
import { useTimeline } from './useTimeline';
import type { useAiPolish } from './useAiPolish';
import type { useAdminUsers } from './useAdminUsers';
import type { useSpaceMembers } from './useSpaceMembers';
import type { OnboardingState, OnboardingStepId } from './onboarding-store';

interface WorkspaceMainProps {
  activeView: string;
  isBusy: boolean;
  /** 右栏（Inspector）可见性，透传给 DocumentsFeature（Doc-First §9.5，Sprint-21）。 */
  rightPaneOpen: boolean;
  /** 收起右栏（批1，点1），透传给 DocumentsFeature。 */
  onToggleRightPane: () => void;
  documents: ReturnType<typeof useDocuments>;
  search: ReturnType<typeof useSearch>;
  query: ReturnType<typeof useQuery>;
  terms: ReturnType<typeof useTerms>;
  /** 术语领域树（REQ-036 增强，migration 017）：knownCategories 供主区下拉。 */
  termCategories: ReturnType<typeof useTermCategories>;
  tags: ReturnType<typeof useTags>;
  timeline: ReturnType<typeof useTimeline>;
  aiPolish: ReturnType<typeof useAiPolish>;
  adminUsers: ReturnType<typeof useAdminUsers>;
  spaceMembers: ReturnType<typeof useSpaceMembers>;
  /** 当前空间名称（成员视图副标题）。 */
  currentSpaceName: string;
  onQuickEntryOpen: () => void;
  /** 视图切换（首页卡片，Doc-First §9.5.2，Sprint-21 slice 3c）。 */
  onNavigate: (view: ActiveView) => void;
  /** 新建文档（首页卡片，复用 documents.handleCreateDocument）。 */
  onCreateDocument: () => void;
  /** 打开导入弹窗（Doc-First §9.5.8，Sprint-21 slice 3d）。 */
  onOpenImport: () => void;
  /** 展开左目录（documents 空态引导按钮，Sprint-21 slice 3c）。 */
  onExpandLeftPane: () => void;
  /** 返回引导卡（退出新建/取消选中）。 */
  onExitToEmpty: () => void;
  localPreviewDoc: LocalVaultDoc | null;
  onCloseLocalDoc: () => void;
  /** REQ-049：本地挂载 vm（主区 LocalDocPreview 编辑入口）。 */
  localVault: UseLocalVaultMount;
  /** 新手清单进度（Sprint-25 L1）。 */
  onboardingSteps: OnboardingState['steps'];
  /** 新手清单条目：标记完成 + 直达对应视图（Sprint-25 L1）。 */
  onOnboardingStep: (stepId: OnboardingStepId) => void;
}

export function WorkspaceMain({
  activeView,
  isBusy,
  rightPaneOpen,
  onToggleRightPane,
  documents,
  search,
  query,
  terms,
  termCategories,
  tags,
  timeline,
  aiPolish,
  adminUsers,
  spaceMembers,
  currentSpaceName,
  onQuickEntryOpen,
  onNavigate,
  onCreateDocument,
  onOpenImport,
  onExpandLeftPane,
  onExitToEmpty,
  localPreviewDoc,
  onCloseLocalDoc,
  localVault,
  onboardingSteps,
  onOnboardingStep,
}: WorkspaceMainProps) {
  return (
    <section className="workspace-main workspace">
      {activeView === 'home' ? (
        <WelcomeFeature
          isBusy={isBusy}
          onNavigate={onNavigate}
          onCreateDocument={onCreateDocument}
          onOpenQuickEntry={onQuickEntryOpen}
          onboardingSteps={onboardingSteps}
          onOnboardingStep={onOnboardingStep}
        />
      ) : null}

      {activeView === 'documents' ? (
        localPreviewDoc ? (
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
        ) : (
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
        )
      ) : null}

      {activeView === 'search' ? (
        <SearchFeature
          searchQuery={search.searchQuery}
          onSearchQueryChange={search.setSearchQuery}
          searchResult={search.searchResult}
          isBusy={isBusy}
          onSearch={search.handleSearch}
          onOpenDocument={documents.handleOpenDocument}
          onCreateDocument={onCreateDocument}
          onOpenImport={onOpenImport}
        />
      ) : null}

      {activeView === 'query' ? (
        <QueryFeature
          question={query.question}
          onQuestionChange={query.setQuestion}
          queryResult={query.queryResult}
          isBusy={isBusy}
          onQuery={query.handleQuery}
          onOpenDocument={documents.handleOpenDocument}
          onCreateDocument={onCreateDocument}
          onOpenImport={onOpenImport}
        />
      ) : null}

      {activeView === 'terms' ? (
        <TermsFeature
          terms={terms.terms}
          selectedTermId={terms.selectedTermId}
          isBusy={isBusy}
          termDraft={terms.termDraft}
          paneMode={terms.paneMode}
          onBeginEdit={terms.beginEdit}
          onTermDraftChange={terms.setTermDraft}
          onSaveTerm={terms.handleSaveTerm}
          onDeleteTerm={terms.handleDeleteTerm}
          onNewTerm={terms.newTerm}
          categories={termCategories.knownCategories}
        />
      ) : null}

      {activeView === 'tags' ? (
        <TagsFeature
          isBusy={isBusy}
          tags={tags.tags}
          selectedTagId={tags.selectedTagId}
          tagDocuments={tags.tagDocuments}
          newTagName={tags.newTagName}
          onNewTagNameChange={tags.setNewTagName}
          onSelectTag={tags.handleSelectTag}
          onCreateTag={tags.handleCreateTag}
          onOpenDocument={documents.handleOpenDocument}
          onGoToDocuments={() => onNavigate('documents')}
          editingTagId={tags.editingTagId}
          editDraft={tags.editDraft}
          onEditDraftChange={tags.setEditDraft}
          onBeginEditTag={tags.beginEditTag}
          onCancelEditTag={tags.cancelEditTag}
          onUpdateTag={tags.handleUpdateTag}
          onArchiveTag={tags.handleArchiveTag}
        />
      ) : null}

      {activeView === 'timeline' ? (
        <TimelineFeature
          isBusy={isBusy}
          timelineQuery={timeline.timelineQuery}
          selectedTagIds={timeline.selectedTagIds}
          timelineResult={timeline.timelineResult}
          tags={tags.tags}
          onTimelineQueryChange={timeline.setTimelineQuery}
          onToggleTag={timeline.toggleTimelineTag}
          onClearFilters={timeline.clearTimelineFilters}
          onLoadTimeline={timeline.handleLoadTimeline}
          onOpenDocument={documents.handleOpenDocument}
          onGoToDocuments={() => onNavigate('documents')}
        />
      ) : null}

      {activeView === 'members' ? (
        <MembersFeature
          isBusy={isBusy}
          spaceName={currentSpaceName}
          members={spaceMembers.members}
          canManageMembers={spaceMembers.canManageMembers}
          searchQuery={spaceMembers.searchQuery}
          searchResults={spaceMembers.searchResults}
          addEmail={spaceMembers.addEmail}
          addRole={spaceMembers.addRole}
          onSearchQueryChange={spaceMembers.handleSearchQueryChange}
          onAddEmailChange={spaceMembers.setAddEmail}
          onAddRoleChange={spaceMembers.setAddRole}
          onAdd={spaceMembers.handleAdd}
          onRoleChange={spaceMembers.handleRoleChange}
          onRemove={spaceMembers.handleRemove}
        />
      ) : null}

      {activeView === 'admin-users' ? (
        <AdminUsersFeature
          isBusy={isBusy}
          users={adminUsers.users}
          filterQ={adminUsers.filterQ}
          filterRole={adminUsers.filterRole}
          filterStatus={adminUsers.filterStatus}
          onFilterQChange={adminUsers.setFilterQ}
          onFilterRoleChange={adminUsers.setFilterRole}
          onFilterStatusChange={adminUsers.setFilterStatus}
          onRoleChange={adminUsers.handleRoleChange}
          onStatusToggle={adminUsers.handleStatusToggle}
        />
      ) : null}
    </section>
  );
}
