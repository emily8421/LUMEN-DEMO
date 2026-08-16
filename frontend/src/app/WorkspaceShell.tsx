// CQ-P1-008 App 减压：已登录主工作区容器（原 App.tsx workspace shell 段）。
// props 传聚合对象（useXxx hook 返回引用），内部原样转发给子组件，App 只做装配。
import type { CSSProperties } from 'react';
import { WorkspaceViewNav } from './WorkspaceViewNav';
import { ContextPane } from './context-pane/ContextPane';
import { WorkspaceMain } from './WorkspaceMain';
import { QuickEntryFeature } from '../features/QuickEntryFeature';
import { ImportFeature } from '../features/ImportFeature';
import { OnboardingGuide } from '../features/OnboardingGuide';
import type { useWorkspace } from './useWorkspace';
import type { usePaneLayout } from './usePaneLayout';
import type { usePaneWidth } from './usePaneWidth';
import type { useSession } from './useSession';
import type { useDocuments } from './useDocuments';
import type { useFolders } from './useFolders';
import type { useTags } from './useTags';
import type { useTerms } from './useTerms';
import type { useTermCategories } from './useTermCategories';
import type { useSearch } from './useSearch';
import type { useQuery } from './useQuery';
import type { useTimeline } from './useTimeline';
import type { useAiPolish } from './useAiPolish';
import type { useAdminUsers } from './useAdminUsers';
import type { useSpaceMembers } from './useSpaceMembers';
import type { useQuickEntry } from './useQuickEntry';
import type { useImport } from './useImport';
import type { useLocalVaultMount } from './useLocalVaultMount';
import type { OnboardingState, OnboardingStepId } from './onboarding-store';
import type { LocalVaultDoc } from './local-vault-index';

interface WorkspaceShellProps {
  workspace: ReturnType<typeof useWorkspace>;
  paneLayout: ReturnType<typeof usePaneLayout>;
  leftPaneWidth: ReturnType<typeof usePaneWidth>;
  /** 左栏实际可见性（useAppShellState 派生：无左栏内容的视图恒 false，勿直接用 paneLayout.leftPaneOpen 渲染）。 */
  leftPaneOpen: boolean;
  currentSpace: ReturnType<typeof useSession>['spaces'][number] | null;
  token: string | undefined;
  documents: ReturnType<typeof useDocuments>;
  folders: ReturnType<typeof useFolders>;
  tags: ReturnType<typeof useTags>;
  terms: ReturnType<typeof useTerms>;
  termCategories: ReturnType<typeof useTermCategories>;
  search: ReturnType<typeof useSearch>;
  query: ReturnType<typeof useQuery>;
  timeline: ReturnType<typeof useTimeline>;
  aiPolish: ReturnType<typeof useAiPolish>;
  adminUsers: ReturnType<typeof useAdminUsers>;
  spaceMembers: ReturnType<typeof useSpaceMembers>;
  quickEntry: ReturnType<typeof useQuickEntry>;
  imports: ReturnType<typeof useImport>;
  importModalOpen: boolean;
  onOpenImport: () => void;
  onCloseImport: () => void;
  onboarding: OnboardingState;
  guideDismissed: boolean;
  localVault: ReturnType<typeof useLocalVaultMount>;
  localPreviewDoc: LocalVaultDoc | null;
  handleCreateDocument: (folderId?: number | null) => void;
  handleImported: (firstDocId: number | null) => void;
  handleOnboardingStep: (stepId: OnboardingStepId) => void;
  handleSkipOnboarding: () => void;
  handleDismissGuide: () => void;
  handleOpenLocalDoc: (doc: LocalVaultDoc | null) => void;
  handleCloseLocalDoc: () => void;
}

export function WorkspaceShell(props: WorkspaceShellProps) {
  const {
    workspace,
    paneLayout,
    leftPaneWidth,
    leftPaneOpen,
    currentSpace,
    token,
    documents,
    folders,
    tags,
    terms,
    termCategories,
    search,
    query,
    timeline,
    aiPolish,
    adminUsers,
    spaceMembers,
    quickEntry,
    imports,
    importModalOpen,
    onOpenImport,
    onCloseImport,
    onboarding,
    guideDismissed,
    localVault,
    localPreviewDoc,
    handleCreateDocument,
    handleImported,
    handleOnboardingStep,
    handleSkipOnboarding,
    handleDismissGuide,
    handleOpenLocalDoc,
    handleCloseLocalDoc,
  } = props;

  return (
    <div
      className={`workspace-layout workspace-shell${leftPaneOpen ? '' : ' pane-left-collapsed'}`}
      style={{ '--left-pane-width': `${leftPaneWidth.width}px` } as CSSProperties}
    >
      <WorkspaceViewNav
        activeView={workspace.activeView}
        disabled={workspace.isBusy}
        onChange={workspace.setActiveView}
        showMembers={spaceMembers.canManageMembers}
      />

      <ContextPane
        activeView={workspace.activeView}
        currentSpace={currentSpace}
        documents={documents.documents}
        folders={folders}
        selectedId={documents.selectedId}
        isCreating={documents.isCreating}
        isBusy={workspace.isBusy}
        onCreateDocument={handleCreateDocument}
        onSelectDocument={documents.handleSelectDocument}
        onMoveDocument={documents.handleMoveDocument}
        onDeleteDocument={documents.handleDeleteDocument}
        terms={terms.terms}
        selectedTermId={terms.selectedTermId}
        onSelectTerm={terms.selectTerm}
        onNewTerm={terms.newTerm}
        termCategories={termCategories}
        token={token}
        onImported={() => handleImported(null)}
        onOpenLocalDoc={handleOpenLocalDoc}
        onToggleLeftPane={paneLayout.toggleLeftPane}
        localVault={localVault}
      />

      {leftPaneOpen ? (
        <div
          className={leftPaneWidth.resizing ? 'pane-resizer pane-resizer-left resizing' : 'pane-resizer pane-resizer-left'}
          role="separator"
          aria-orientation="vertical"
          aria-label="调整左侧栏宽度"
          tabIndex={0}
          onPointerDown={leftPaneWidth.startResize}
          onPointerMove={leftPaneWidth.moveResize}
          onPointerUp={leftPaneWidth.endResize}
          onPointerCancel={leftPaneWidth.endResize}
          onDoubleClick={leftPaneWidth.resetWidth}
          onKeyDown={leftPaneWidth.handleKeyDown}
        />
      ) : null}

      <WorkspaceMain
        activeView={workspace.activeView}
        isBusy={workspace.isBusy}
        rightPaneOpen={paneLayout.rightPaneOpen}
        onToggleRightPane={paneLayout.toggleRightPane}
        documents={documents}
        search={search}
        query={query}
        terms={terms}
        termCategories={termCategories}
        tags={tags}
        timeline={timeline}
        aiPolish={aiPolish}
        adminUsers={adminUsers}
        spaceMembers={spaceMembers}
        currentSpaceName={currentSpace?.name ?? ''}
        onQuickEntryOpen={quickEntry.open}
        onNavigate={workspace.setActiveView}
        onCreateDocument={handleCreateDocument}
        onOpenImport={onOpenImport}
        onExpandLeftPane={() => paneLayout.setLeftPaneOpen(true)}
        onExitToEmpty={() => {
          documents.setSelectedId(null);
          documents.setIsCreating(false);
        }}
        localPreviewDoc={localPreviewDoc}
        onCloseLocalDoc={handleCloseLocalDoc}
        onboardingSteps={onboarding.steps}
        onOnboardingStep={handleOnboardingStep}
        localVault={localVault}
      />

      <QuickEntryFeature
        isOpen={quickEntry.isOpen}
        isBusy={workspace.isBusy}
        title={quickEntry.title}
        source={quickEntry.source}
        contentMd={quickEntry.contentMd}
        tagIds={quickEntry.tagIds}
        mode={quickEntry.mode}
        targetDocumentId={quickEntry.targetDocumentId}
        tags={tags.tags}
        documents={documents.documents}
        lastEntry={quickEntry.lastEntry}
        onTitleChange={quickEntry.setTitle}
        onSourceChange={quickEntry.setSource}
        onContentMdChange={quickEntry.setContentMd}
        onToggleTag={quickEntry.toggleTag}
        onModeChange={quickEntry.changeMode}
        onTargetDocumentChange={quickEntry.setTargetDocumentId}
        onSubmit={quickEntry.handleSubmit}
        onDiscard={quickEntry.handleDiscard}
        onClose={quickEntry.close}
        onOpenDocument={documents.handleOpenDocument}
      />

      <ImportFeature
        isOpen={importModalOpen}
        isBusy={workspace.isBusy}
        importDraft={imports.importDraft}
        onImportDraftChange={imports.setImportDraft}
        importFiles={imports.importFiles}
        onImportFilesChange={imports.setImportFiles}
        importInputKey={imports.importInputKey}
        lastImportSummary={imports.lastImportSummary}
        lastImportItems={imports.lastImportItems}
        onImport={imports.handleImport}
        onClose={onCloseImport}
      />

      {!onboarding.completed && !guideDismissed ? (
        <OnboardingGuide
          isBusy={workspace.isBusy}
          steps={onboarding.steps}
          onStep={handleOnboardingStep}
          onSkip={handleSkipOnboarding}
          onDismiss={handleDismissGuide}
        />
      ) : null}
    </div>
  );
}
