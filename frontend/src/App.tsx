import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  createDocument,
  createTerm,
  deleteDocument,
  deleteTerm,
  DocumentPermission,
  DocumentVersion,
  getDocument,
  importDocument,
  KnowledgeDocument,
  listDocuments,
  listSpaces,
  listTerms,
  listVersions,
  login,
  queryKnowledgeBase,
  QueryResponse,
  searchDocuments,
  SearchResponse,
  restoreVersion,
  Space,
  switchSpace,
  Term,
  TermStatus,
  TermWritePayload,
  updateDocument,
  updateTerm,
} from './api';

const permissionLabels: Record<DocumentPermission, string> = {
  private: '私有',
  team: '团队共享',
  external_readonly: '外部只读',
};

const emptyDraft = {
  title: '',
  content_md: '',
  permission: 'team' as DocumentPermission,
};

const emptyTermDraft = {
  term: '',
  definition: '',
  aliases: '',
  status: 'confirmed' as TermStatus,
};

const emptyImportDraft = {
  title: '',
  permission: 'team' as DocumentPermission,
};

type Draft = typeof emptyDraft;

type TermDraft = typeof emptyTermDraft;

type ImportDraft = typeof emptyImportDraft;

type Session = {
  token: string;
  userId: number;
  currentSpaceId: number;
};

type ActiveView = 'documents' | 'search' | 'query' | 'terms';

const workspaceViews: Array<{ id: ActiveView; label: string; description: string }> = [
  { id: 'documents', label: '文档', description: '编辑、预览、版本' },
  { id: 'search', label: '搜索', description: '全文 / 语义检索' },
  { id: 'query', label: '问答', description: 'RAG 答案与来源' },
  { id: 'terms', label: '术语', description: '空间术语维护' },
];

type MarkdownBlockProps = {
  content: string;
  emptyText?: string;
  className?: string;
};

function MarkdownBlock({ content, emptyText = '暂无内容。', className = '' }: MarkdownBlockProps) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown>{trimmedContent}</ReactMarkdown>
    </div>
  );
}

function markdownExcerpt(content: string, maxLength = 140) {
  const trimmedContent = content.trim();
  if (trimmedContent.length <= maxLength) {
    return trimmedContent;
  }
  return `${trimmedContent.slice(0, maxLength)}…`;
}

type WorkspaceViewNavProps = {
  activeView: ActiveView;
  disabled: boolean;
  onChange: (view: ActiveView) => void;
};

function WorkspaceViewNav({ activeView, disabled, onChange }: WorkspaceViewNavProps) {
  return (
    <nav className="view-nav" aria-label="工作台视图">
      {workspaceViews.map((view) => (
        <button
          key={view.id}
          type="button"
          className={activeView === view.id ? 'active' : ''}
          onClick={() => onChange(view.id)}
          disabled={disabled}
        >
          <span>{view.label}</span>
          <small>{view.description}</small>
        </button>
      ))}
    </nav>
  );
}

type StatusBarProps = {
  notice: string;
  error: string;
};

function StatusBar({ notice, error }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>{notice}</span>
      {error ? <strong>{error}</strong> : null}
    </footer>
  );
}

function App() {
  const [username, setUsername] = useState('alice');
  const [session, setSession] = useState<Session | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState('请使用 Demo 账号登录。');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termDraft, setTermDraft] = useState<TermDraft>(emptyTermDraft);
  const [importDraft, setImportDraft] = useState<ImportDraft>(emptyImportDraft);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importInputKey, setImportInputKey] = useState(0);
  const [lastImportSummary, setLastImportSummary] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('documents');

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedId) ?? null,
    [documents, selectedId],
  );

  const currentSpace = useMemo(
    () => spaces.find((space) => space.id === session?.currentSpaceId) ?? null,
    [spaces, session],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    void refreshWorkspace(session.token);
  }, [session?.token, session?.currentSpaceId]);

  useEffect(() => {
    if (isCreating) {
      setDraft(emptyDraft);
      setVersions([]);
      return;
    }

    if (selectedDocument) {
      if (selectedDocument.content_md === undefined && session) {
        void loadDocumentDetail(session.token, selectedDocument.id);
        return;
      }

      setDraft({
        title: selectedDocument.title,
        content_md: selectedDocument.content_md ?? '',
        permission: selectedDocument.permission,
      });
      if (session) {
        void loadVersions(session.token, selectedDocument.id);
      }
    }
  }, [isCreating, selectedDocument?.id, selectedDocument?.content_md, selectedDocument?.permission, selectedDocument?.title, session?.token]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction('正在登录...', async () => {
      const result = await login(username.trim());
      setSession({
        token: result.token,
        userId: result.user_id,
        currentSpaceId: result.current_space_id,
      });
      setNotice(`已登录：user_id=${result.user_id}`);
    });
  }

  async function refreshWorkspace(token = session?.token) {
    if (!token) {
      return;
    }

    const [spaceResult, documentResult, termResult] = await Promise.all([listSpaces(token), listDocuments(token), listTerms(token)]);
    setSpaces(spaceResult);
    setDocuments(documentResult);
    setTerms(termResult.items);
    setSelectedId((currentId) => {
      if (currentId && documentResult.some((document) => document.id === currentId)) {
        return currentId;
      }
      return documentResult[0]?.id ?? null;
    });
    if (documentResult.length === 0) {
      setIsCreating(true);
      setDraft(emptyDraft);
      setVersions([]);
    } else {
      setIsCreating(false);
    }
  }

  async function loadVersions(token: string, documentId: number) {
    const versionResult = await listVersions(token, documentId);
    setVersions(versionResult);
  }

  async function loadDocumentDetail(token: string, documentId: number) {
    try {
      const detail = await getDocument(token, documentId);
      setDocuments((currentDocuments) => {
        const hasDocument = currentDocuments.some((document) => document.id === detail.id);
        if (!hasDocument) {
          return [detail, ...currentDocuments];
        }
        return currentDocuments.map((document) => (document.id === detail.id ? detail : document));
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '文档详情加载失败';
      setError(message);
    }
  }

  async function handleSpaceChange(spaceId: number) {
    if (!session) {
      return;
    }

    await runAction('正在切换空间...', async () => {
      const result = await switchSpace(session.token, spaceId);
      setSession({
        ...session,
        token: result.token,
        currentSpaceId: result.current_space_id,
      });
      setSelectedId(null);
      setActiveView('documents');
      setSearchResult(null);
      setQueryResult(null);
      setSelectedTermId(null);
      setTermDraft(emptyTermDraft);
      setNotice('空间已切换，文档列表已刷新。');
    });
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    await runAction('正在搜索当前空间...', async () => {
      const result = await searchDocuments(session.token, searchQuery.trim());
      setSearchResult(result);
      setNotice(`搜索完成：${result.total} 条结果。`);
    });
  }

  async function handleQuery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    await runAction('正在问答当前空间...', async () => {
      const result = await queryKnowledgeBase(session.token, question.trim());
      setQueryResult(result);
      setNotice(`问答完成：${result.sources.length} 个来源。`);
    });
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !importFile) {
      return;
    }

    await runAction('正在导入已提取文本...', async () => {
      const result = await importDocument(session.token, {
        file: importFile,
        title: importDraft.title,
        permission: importDraft.permission,
      });
      await refreshWorkspace(session.token);
      setSelectedId(result.parsed_doc_id);
      setActiveView('documents');
      setIsCreating(false);
      setSearchResult(null);
      setQueryResult(null);
      setImportDraft(emptyImportDraft);
      setImportFile(null);
      setImportInputKey((currentKey) => currentKey + 1);
      const summary = `导入完成：文档 #${result.parsed_doc_id}，${result.chunk_count} 个 chunk（${result.mode}）`;
      setLastImportSummary(summary);
      setNotice(summary);
    });
  }

  async function handleSaveTerm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    await runAction('正在保存术语...', async () => {
      const payload = normalizeTermDraft(termDraft);
      const savedTerm = selectedTermId
        ? await updateTerm(session.token, selectedTermId, payload)
        : await createTerm(session.token, payload);
      const result = await listTerms(session.token);
      setTerms(result.items);
      setSelectedTermId(savedTerm.id);
      setTermDraft(termToDraft(savedTerm));
      setNotice(`术语已保存：${savedTerm.term}`);
    });
  }

  async function handleDeleteTerm() {
    if (!session || !selectedTermId) {
      return;
    }

    const selectedTerm = terms.find((term) => term.id === selectedTermId);
    const termLabel = selectedTerm?.term ?? `#${selectedTermId}`;
    if (!window.confirm(`确认删除术语「${termLabel}」？此操作不可撤销。`)) {
      return;
    }

    await runAction('正在删除术语...', async () => {
      await deleteTerm(session.token, selectedTermId);
      const result = await listTerms(session.token);
      setTerms(result.items);
      setSelectedTermId(null);
      setTermDraft(emptyTermDraft);
      setNotice('术语已删除。');
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    await runAction('正在保存文档...', async () => {
      const payload = normalizeDraft(draft);
      const savedDocument = isCreating || !selectedDocument
        ? await createDocument(session.token, payload)
        : await updateDocument(session.token, selectedDocument.id, payload);
      await refreshWorkspace(session.token);
      setSelectedId(savedDocument.id);
      setIsCreating(false);
      await loadVersions(session.token, savedDocument.id);
      setNotice(`已保存：${savedDocument.title}（版本 ${savedDocument.current_version}）`);
    });
  }

  function handleCreateDocument() {
    setActiveView('documents');
    setIsCreating(true);
  }

  function handleSelectDocument(documentId: number) {
    setActiveView('documents');
    setSelectedId(documentId);
    setIsCreating(false);
  }

  async function handleDelete() {
    if (!session || !selectedDocument) {
      return;
    }

    if (!window.confirm(`确认删除文档「${selectedDocument.title}」？此操作不可撤销。`)) {
      return;
    }

    await runAction('正在删除文档...', async () => {
      await deleteDocument(session.token, selectedDocument.id);
      setSelectedId(null);
      setIsCreating(false);
      await refreshWorkspace(session.token);
      setNotice('文档已删除。');
    });
  }

  async function handleRestore(versionNo: number) {
    if (!session || !selectedDocument) {
      return;
    }

    if (!window.confirm(`确认将「${selectedDocument.title}」恢复到版本 ${versionNo}？`)) {
      return;
    }

    await runAction(`正在恢复版本 ${versionNo}...`, async () => {
      const restored = await restoreVersion(session.token, selectedDocument.id, versionNo);
      await refreshWorkspace(session.token);
      setSelectedId(restored.id);
      await loadVersions(session.token, restored.id);
      setNotice(`已恢复到版本 ${versionNo}。`);
    });
  }

  async function handleOpenDocument(documentId: number | null, title: string) {
    if (!documentId) {
      setNotice('该来源为术语表记录，暂无可打开文档。');
      return;
    }

    if (!session) {
      return;
    }

    setActiveView('documents');
    setIsCreating(false);
    setSelectedId(documentId);

    const documentRecord = documents.find((document) => document.id === documentId);
    if (!documentRecord || documentRecord.content_md === undefined) {
      await runAction('正在打开来源文档...', async () => {
        await loadDocumentDetail(session.token, documentId);
        await loadVersions(session.token, documentId);
        setNotice(`已打开来源文档：${title}`);
      });
      return;
    }

    await loadVersions(session.token, documentId);
    setNotice(`已打开来源文档：${title}`);
  }

  async function runAction(progressMessage: string, action: () => Promise<void>) {
    setIsBusy(true);
    setError('');
    setNotice(progressMessage);
    try {
      await action();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '操作失败';
      setError(message);
      setNotice('操作失败，请查看错误信息。');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">LUMEN Demo</p>
          <h1>LUMEN 团队知识库工作台</h1>
        </div>
        {session ? (
          <div className="session-card">
            <span>用户 #{session.userId}</span>
            <strong>{currentSpace?.name ?? `空间 ${session.currentSpaceId}`}</strong>
          </div>
        ) : null}
      </header>

      {!session ? (
        <section className="login-panel card">
          <h2>Demo 登录</h2>
          <p>登录后前端会将 Bearer Token 附加到文档与空间接口请求中。</p>
          <form onSubmit={handleLogin}>
            <label>
              账号
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <button type="submit" disabled={isBusy || username.trim().length === 0}>登录</button>
          </form>
        </section>
      ) : (
        <div className="workspace-layout">
          <aside className="sidebar card">
            <section>
              <h2>空间</h2>
              <select
                value={session.currentSpaceId}
                onChange={(event) => void handleSpaceChange(Number(event.target.value))}
                disabled={isBusy}
              >
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>{space.name}</option>
                ))}
              </select>
            </section>

            <WorkspaceViewNav activeView={activeView} disabled={isBusy} onChange={setActiveView} />

            <section>
              <div className="section-title">
                <h2>文档</h2>
                <button type="button" onClick={handleCreateDocument} disabled={isBusy}>新建</button>
              </div>
              {documents.length === 0 ? (
                <p className="empty-state">当前空间暂无可见文档。</p>
              ) : (
                <ul className="document-list">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <button
                        type="button"
                        className={document.id === selectedId && !isCreating ? 'active' : ''}
                        onClick={() => handleSelectDocument(document.id)}
                      >
                        <span>{document.title}</span>
                        <small>{permissionLabels[document.permission]} · v{document.current_version}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="import-panel">
              <p className="eyebrow">REQ-009 / REQ-010 · 降级</p>
              <h2>导入已提取文本</h2>
              <p className="empty-state">Sprint-6 仅走通降级导入：上传 .txt / .md，真实 PDF / OCR 记录为未验证。</p>
              <form className="compact-form" onSubmit={handleImport}>
                <label>
                  文件
                  <input
                    key={importInputKey}
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label>
                  标题（可选）
                  <input
                    value={importDraft.title}
                    onChange={(event) => setImportDraft({ ...importDraft, title: event.target.value })}
                    placeholder="默认使用文件名"
                  />
                </label>
                <label>
                  权限
                  <select
                    value={importDraft.permission}
                    onChange={(event) => setImportDraft({ ...importDraft, permission: event.target.value as DocumentPermission })}
                  >
                    {Object.entries(permissionLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" disabled={isBusy || !importFile}>导入</button>
              </form>
              {lastImportSummary ? <p className="import-summary">{lastImportSummary}</p> : null}
            </section>
          </aside>

          <section className="workspace-main">
            {activeView === 'documents' ? (
              <div className="document-view-grid">
                <section className="editor-panel card">
                  <div className="section-title">
                    <div>
                      <p className="eyebrow">REQ-004 / REQ-005</p>
                      <h2>{isCreating ? '新建文档' : selectedDocument?.title ?? '选择文档'}</h2>
                    </div>
                    {selectedDocument && !isCreating ? (
                      <button type="button" className="danger" onClick={() => void handleDelete()} disabled={isBusy}>删除</button>
                    ) : null}
                  </div>

                  <form className="editor-form" onSubmit={handleSave}>
                    <label>
                      标题
                      <input
                        value={draft.title}
                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                        placeholder="输入 Markdown 文档标题"
                      />
                    </label>
                    <label>
                      权限
                      <select
                        value={draft.permission}
                        onChange={(event) => setDraft({ ...draft, permission: event.target.value as DocumentPermission })}
                      >
                        {Object.entries(permissionLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Markdown 内容
                      <textarea
                        value={draft.content_md}
                        onChange={(event) => setDraft({ ...draft, content_md: event.target.value })}
                        placeholder="输入或编辑 Markdown 内容"
                        rows={15}
                      />
                    </label>
                    <section className="markdown-preview" aria-label="Markdown 预览">
                      <div className="subsection-heading">
                        <strong>Markdown 预览</strong>
                        <span>保存前可检查标题、列表、强调与段落排版</span>
                      </div>
                      <MarkdownBlock content={draft.content_md} emptyText="暂无可预览内容。" />
                    </section>
                    <button type="submit" disabled={isBusy || draft.title.trim().length === 0}>保存</button>
                  </form>
                </section>

                <section className="versions-panel card">
                  <p className="eyebrow">REQ-006</p>
                  <h2>版本历史</h2>
                  {!selectedDocument || isCreating ? (
                    <p className="empty-state">保存文档后可查看版本历史。</p>
                  ) : versions.length === 0 ? (
                    <p className="empty-state">暂无版本记录。</p>
                  ) : (
                    <ol className="version-list">
                      {versions.map((version) => (
                        <li key={version.version_no}>
                          <div>
                            <strong>版本 {version.version_no}</strong>
                            <small>编辑者 #{version.editor_id}</small>
                          </div>
                          <MarkdownBlock content={markdownExcerpt(version.content_md)} emptyText="空内容" className="compact-markdown" />
                          <button type="button" onClick={() => void handleRestore(version.version_no)} disabled={isBusy}>
                            恢复
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            ) : null}

            {activeView === 'search' ? (
              <section className="search-panel card focus-panel">
                <p className="eyebrow">REQ-007</p>
                <h2>全文搜索</h2>
                <form className="compact-form focus-form" onSubmit={handleSearch}>
                  <label>
                    关键词
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="例如：触发延迟"
                    />
                  </label>
                  <button type="submit" disabled={isBusy || searchQuery.trim().length === 0}>搜索</button>
                </form>
                {!searchResult ? (
                  <p className="empty-state">输入关键词检索当前空间可见文档。</p>
                ) : searchResult.items.length === 0 ? (
                  <p className="empty-state">未找到匹配文档。</p>
                ) : (
                  <ul className="result-list">
                    {searchResult.items.map((item) => (
                      <li key={`${item.doc_id}-${item.chunk_id}`}>
                        <article className="result-card">
                          <button
                            type="button"
                            className="result-open-button"
                            onClick={() => void handleOpenDocument(item.doc_id, item.title)}
                            disabled={isBusy}
                          >
                            {item.title}
                          </button>
                          <small>文档 #{item.doc_id} · chunk {item.ordinal} · 点击标题打开</small>
                          <MarkdownBlock content={item.snippet} className="compact-markdown" />
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {activeView === 'query' ? (
              <section className="query-panel card focus-panel">
                <p className="eyebrow">REQ-008</p>
                <h2>RAG 问答</h2>
                <form className="compact-form focus-form" onSubmit={handleQuery}>
                  <label>
                    问题
                    <textarea
                      className="question-input"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="例如：场景联动触发延迟是多少？"
                      rows={3}
                    />
                  </label>
                  <button type="submit" disabled={isBusy || question.trim().length === 0}>提问</button>
                </form>
                {!queryResult ? (
                  <p className="empty-state">输入问题后，会基于当前空间可见文档返回降级答案。</p>
                ) : (
                  <div className="answer-box">
                    <strong>答案</strong>
                    <MarkdownBlock content={queryResult.answer} />
                    {queryResult.sources.length === 0 ? (
                      <p className="empty-state">暂无来源。</p>
                    ) : (
                      <ul className="result-list">
                        {queryResult.sources.map((source) => (
                          <li key={`${source.doc_id}-${source.snippet}`}>
                            <article className={`result-card ${source.doc_id ? '' : 'muted'}`.trim()}>
                              {source.doc_id ? (
                                <button
                                  type="button"
                                  className="result-open-button"
                                  onClick={() => void handleOpenDocument(source.doc_id, source.title)}
                                  disabled={isBusy}
                                >
                                  {source.title}
                                </button>
                              ) : (
                                <strong>{source.title}</strong>
                              )}
                              <small>{source.source_type === 'term' ? '术语表来源' : `文档 #${source.doc_id} · 点击标题打开`}</small>
                              <MarkdownBlock content={source.snippet} className="compact-markdown" />
                            </article>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>
            ) : null}

            {activeView === 'terms' ? (
              <section className="term-panel card focus-panel">
                <p className="eyebrow">REQ-036</p>
                <div className="section-title">
                  <h2>术语管理</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTermId(null);
                      setTermDraft(emptyTermDraft);
                    }}
                    disabled={isBusy}
                  >
                    新建
                  </button>
                </div>
                <div className="term-view-grid">
                  <div className="term-list-pane">
                    <div className="subsection-heading">
                      <strong>当前空间术语</strong>
                      <span>点击条目可载入到右侧编辑区</span>
                    </div>
                    {terms.length === 0 ? (
                      <p className="empty-state">当前空间暂无术语。</p>
                    ) : (
                      <ul className="term-list">
                        {terms.map((term) => (
                          <li key={term.id}>
                            <button
                              type="button"
                              className={term.id === selectedTermId ? 'active' : ''}
                              onClick={() => {
                                setSelectedTermId(term.id);
                                setTermDraft(termToDraft(term));
                              }}
                            >
                              <strong>{term.term}</strong>
                              <small>{term.space_id ? '当前空间' : '全局'} · {term.status === 'confirmed' ? '已确认' : '待确认'}</small>
                              <span>{term.definition}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="term-edit-pane">
                    <div className="subsection-heading">
                      <strong>术语编辑</strong>
                      <span>{selectedTermId ? '正在编辑已选术语' : '填写后创建当前空间术语'}</span>
                    </div>
                    <form className="compact-form" onSubmit={handleSaveTerm}>
                      <label>
                        标准名称
                        <input
                          value={termDraft.term}
                          onChange={(event) => setTermDraft({ ...termDraft, term: event.target.value })}
                          placeholder="例如：触发延迟"
                        />
                      </label>
                      <label>
                        定义
                        <textarea
                          className="question-input"
                          value={termDraft.definition}
                          onChange={(event) => setTermDraft({ ...termDraft, definition: event.target.value })}
                          placeholder="例如：从条件满足到指令发出"
                          rows={3}
                        />
                      </label>
                      <label>
                        别名（逗号分隔）
                        <input
                          value={termDraft.aliases}
                          onChange={(event) => setTermDraft({ ...termDraft, aliases: event.target.value })}
                          placeholder="例如：开关延迟, 联动延迟"
                        />
                      </label>
                      <label>
                        状态
                        <select
                          value={termDraft.status}
                          onChange={(event) => setTermDraft({ ...termDraft, status: event.target.value as TermStatus })}
                        >
                          <option value="confirmed">已确认</option>
                          <option value="pending">待确认</option>
                        </select>
                      </label>
                      <div className="button-row">
                        <button type="submit" disabled={isBusy || termDraft.term.trim().length === 0 || termDraft.definition.trim().length === 0}>保存术语</button>
                        {selectedTermId ? (
                          <button type="button" className="danger" onClick={() => void handleDeleteTerm()} disabled={isBusy}>删除</button>
                        ) : null}
                      </div>
                    </form>
                  </div>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      )}

      <StatusBar notice={notice} error={error} />
    </main>
  );
}

function normalizeDraft(draft: Draft) {
  return {
    title: draft.title.trim(),
    content_md: draft.content_md,
    permission: draft.permission,
  };
}

function normalizeTermDraft(draft: TermDraft): TermWritePayload {
  return {
    term: draft.term.trim(),
    definition: draft.definition.trim(),
    aliases: draft.aliases.split(',').map((alias) => alias.trim()).filter(Boolean),
    status: draft.status,
  };
}

function termToDraft(term: Term): TermDraft {
  return {
    term: term.term,
    definition: term.definition,
    aliases: term.aliases.join(', '),
    status: term.status,
  };
}

export default App;
