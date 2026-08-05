import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/workspace.css';
import './styles/document-mode.css';
import './styles/document-inspector.css';
import './styles/welcome.css';
import './styles/panels.css';
import './styles/import-modal.css';
import './styles/markdown.css';
import './styles/tags.css';
import './styles/timeline.css';
import './styles/quick-entry.css';
import './styles/ai-polish.css';
import './styles/responsive.css';
import './styles/local-mount.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
