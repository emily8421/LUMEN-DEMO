// CQ-P1-008 E4 拆分溯源：App 减压完成——只做装配。
// 域 hook 编排 + cross-cutting 回调 + effects 在 app/useAppState.ts；
// UI/布局派生 + 局部弹窗/引导 state 在 app/useAppShellState.ts。
import { useAppState } from './app/useAppState';
import { StatusBar } from './components/StatusBar';
import { TopBar } from './app/TopBar';
import { WorkspaceShell } from './app/WorkspaceShell';
import { OverlayShell } from './app/OverlayShell';
import { AuthShell } from './features/auth/AuthShell';

function App() {
  const app = useAppState();

  return (
    <main className="app-shell">
      <TopBar
        session={app.session.session}
        spaces={app.session.spaces}
        isBusy={app.workspace.isBusy}
        currentSpace={app.currentSpace}
        onSpaceChange={app.session.handleSpaceChange}
        onExportSpace={app.handleExportSpace}
        onQuickEntryOpen={app.quickEntry.open}
        leftPaneOpen={app.leftPaneOpen}
        onToggleLeftPane={app.paneLayout.toggleLeftPane}
        rightPaneOpen={app.paneLayout.rightPaneOpen}
        onToggleRightPane={app.paneLayout.toggleRightPane}
        onLogout={app.session.handleLogout}
        canManageUsers={app.session.session?.role === 'admin'}
        onOpenUserManagement={() => app.workspace.setActiveView('admin-users')}
        onOpenSearchPalette={app.palette.open}
      />

      {!app.session.session ? (
        <AuthShell
          session={app.session}
          isBusy={app.workspace.isBusy}
          resetModalOpen={app.resetModalOpen}
          onOpenResetModal={app.onOpenResetModal}
          onCloseResetModal={app.onCloseResetModal}
        />
      ) : (
        <WorkspaceShell
          workspace={app.workspace}
          paneLayout={app.paneLayout}
          leftPaneWidth={app.leftPaneWidth}
          currentSpace={app.currentSpace}
          token={app.token}
          documents={app.documents}
          folders={app.folders}
          tags={app.tags}
          terms={app.terms}
          termCategories={app.termCategories}
          search={app.search}
          query={app.query}
          timeline={app.timeline}
          aiPolish={app.aiPolish}
          adminUsers={app.adminUsers}
          spaceMembers={app.spaceMembers}
          quickEntry={app.quickEntry}
          imports={app.imports}
          importModalOpen={app.importModalOpen}
          onOpenImport={app.onOpenImport}
          onCloseImport={app.onCloseImport}
          onboarding={app.onboarding}
          guideDismissed={app.guideDismissed}
          localVault={app.localVault}
          localPreviewDoc={app.localPreviewDoc}
          handleCreateDocument={app.handleCreateDocument}
          handleImported={app.handleImported}
          handleOnboardingStep={app.handleOnboardingStep}
          handleSkipOnboarding={app.handleSkipOnboarding}
          handleDismissGuide={app.handleDismissGuide}
          handleOpenLocalDoc={app.handleOpenLocalDoc}
          handleCloseLocalDoc={app.handleCloseLocalDoc}
        />
      )}

      <OverlayShell
        sessionActive={Boolean(app.session.session)}
        palette={app.palette}
        aiAssistant={app.aiAssistant}
        handleOpenDocument={app.documents.handleOpenDocument}
      />
      <StatusBar notice={app.workspace.notice} error={app.workspace.error} />
    </main>
  );
}

export default App;
