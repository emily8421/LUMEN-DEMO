import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initTheme } from './theme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/topbar.css';
import './styles/workspace-layout.css';
import './styles/workspace.css';
import './styles/tree.css';
import './styles/editor.css';
import './styles/document-mode.css';
import './styles/document-inspector.css';
import './styles/welcome.css';
import './styles/panels.css';
import './styles/import-modal.css';
import './styles/markdown.css';
import './styles/tags.css';
import './styles/terms.css';
import './styles/timeline.css';
import './styles/quick-entry.css';
import './styles/ai-polish.css';
import './styles/responsive.css';
import './styles/onboarding.css';
import './styles/local-mount-pane.css';
import './styles/local-mount-tree.css';
import './styles/local-doc-preview.css';
import './styles/local-mount-menu.css';
import './styles/members.css';
import './styles/admin-drawer.css';
import './styles/command-palette.css';
import './styles/ai-assistant.css';
import './styles/auth.css';
import './styles/error-boundary.css';

// 主题初始化（与 index.html 内联预置脚本幂等）：React 接管前对齐 data-theme，防首帧闪烁
initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
