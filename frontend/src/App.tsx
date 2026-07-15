import { useEffect, useMemo, useState } from 'react';
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
import { MarkdownBlock } from './components/MarkdownBlock';
import { StatusBar } from './components/StatusBar';
import { WorkspaceViewNav, type ActiveView } from './app/WorkspaceViewNav';
import { TopBar } from './app/TopBar';
import { ContextPane } from './app/ContextPane';
import type { Session, ImportDraft, Draft } from './app/types';
import { DocumentsFeature } from './features/DocumentsFeature';

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

type TermDraft = typeof emptyTermDraft;

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
      <TopBar session={session} spaces={spaces} isBusy={isBusy} currentSpace={currentSpace} onSpaceChange={handleSpaceChange} />

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
        <div className="workspace-layout workspace-shell">
          <WorkspaceViewNav activeView={activeView} disabled={isBusy} onChange={setActiveView} />

          <ContextPane
            activeView={activeView}
            currentSpace={currentSpace}
            documents={documents}
            selectedId={selectedId}
            isCreating={isCreating}
            isBusy={isBusy}
            onCreateDocument={handleCreateDocument}
            onSelectDocument={handleSelectDocument}
            importDraft={importDraft}
            onImportDraftChange={setImportDraft}
            importFile={importFile}
            onImportFileChange={setImportFile}
            importInputKey={importInputKey}
            lastImportSummary={lastImportSummary}
            onImport={handleImport}
            terms={terms}
            selectedTermId={selectedTermId}
            onSelectTerm={(term) => {
              setSelectedTermId(term.id);
              setTermDraft(termToDraft(term));
            }}
            onNewTerm={() => {
              setSelectedTermId(null);
              setTermDraft(emptyTermDraft);
            }}
          />

          <section className="workspace-main workspace">
            {activeView === 'documents' ? (
              <DocumentsFeature
                isCreating={isCreating}
                selectedDocument={selectedDocument}
                isBusy={isBusy}
                draft={draft}
                onDraftChange={setDraft}
                versions={versions}
                onCreateDocument={handleCreateDocument}
                onDelete={handleDelete}
                onSave={handleSave}
                onRestore={handleRestore}
              />
            ) : null}

            {activeView === 'search' ? (
              <section className="search-panel focus-panel task-workspace">
                <div className="workspace-toolbar">
                  <div className="view-title">
                    <p className="eyebrow">REQ-007</p>
                    <h2>搜索</h2>
                  </div>
                  <span className="badge">Hybrid：关键词 + 语义</span>
                </div>
                <form className="compact-form focus-form task-input" onSubmit={handleSearch}>
                  <label>
                    关键词
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="输入标题、正文关键词或语义问题"
                    />
                  </label>
                  <button type="submit" disabled={isBusy || searchQuery.trim().length === 0}>搜索</button>
                </form>
                {!searchResult ? (
                  <p className="empty-state task-empty">输入关键词检索当前空间可见文档。</p>
                ) : searchResult.items.length === 0 ? (
                  <p className="empty-state task-empty">未找到匹配文档。</p>
                ) : (
                  <ul className="result-list task-result-list">
                    {searchResult.items.map((item) => (
                      <li key={`${item.doc_id}-${item.chunk_id}-${item.ordinal}`}>
                        <article className="result-card result-row">
                          <button
                            type="button"
                            className="result-open-button"
                            onClick={() => void handleOpenDocument(item.doc_id, item.title)}
                          >
                            <strong>{item.title}</strong>
                          </button>
                          <small>doc #{item.doc_id} · chunk #{item.chunk_id} · #{item.ordinal}</small>
                          <MarkdownBlock content={item.snippet} className="compact-markdown" />
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {activeView === 'query' ? (
              <section className="query-panel focus-panel task-workspace">
                <div className="workspace-toolbar">
                  <div className="view-title">
                    <p className="eyebrow">REQ-008</p>
                    <h2>RAG 问答</h2>
                  </div>
                  <span className="badge success">答案必须带来源</span>
                </div>
                <div className="query-workspace-grid">
                  <div className="answer-pane">
                    <form className="compact-form focus-form task-input" onSubmit={handleQuery}>
                      <label>
                        问题
                        <textarea
                          className="question-input"
                          value={question}
                          onChange={(event) => setQuestion(event.target.value)}
                          placeholder="例如：场景联动触发延迟是多少？"
                          rows={2}
                        />
                      </label>
                      <button type="submit" disabled={isBusy || question.trim().length === 0}>提问</button>
                    </form>
                    {!queryResult ? (
                      <p className="empty-state task-empty">输入问题后，会基于当前空间可见文档返回答案。</p>
                    ) : (
                      <div className="answer-box answer-body">
                        <strong>答案</strong>
                        <MarkdownBlock content={queryResult.answer} />
                      </div>
                    )}
                  </div>
                  <aside className="sources-panel inspector-pane">
                    <div className="inspector-header">
                      <h2>来源</h2>
                      <span className="badge">{queryResult?.sources.length ?? 0} 条</span>
                    </div>
                    {!queryResult ? (
                      <p className="empty-state inspector-empty">答案生成后显示来源。</p>
                    ) : queryResult.sources.length === 0 ? (
                      <p className="empty-state inspector-empty">暂无来源。</p>
                    ) : (
                      <ul className="result-list inspector-list">
                        {queryResult.sources.map((source, index) => (
                          <li key={`${source.title}-${index}`}>
                            <article className={`result-card source-row ${source.doc_id ? '' : 'muted'}`.trim()}>
                              {source.doc_id ? (
                                <button
                                  type="button"
                                  className="result-open-button"
                                  onClick={() => void handleOpenDocument(source.doc_id, source.title)}
                                >
                                  <strong>{source.title}</strong>
                                </button>
                              ) : (
                                <strong>{source.title}</strong>
                              )}
                              <small>{source.source_type === 'term' ? '术语来源' : '文档来源'} · {source.doc_id ? `doc #${source.doc_id}` : '无文档 ID'}</small>
                              <MarkdownBlock content={source.snippet} className="compact-markdown" />
                            </article>
                          </li>
                        ))}
                      </ul>
                    )}
                  </aside>
                </div>
              </section>
            ) : null}

            {activeView === 'terms' ? (
              <section className="term-panel focus-panel task-workspace">
                <div className="workspace-toolbar">
                  <div className="view-title">
                    <p className="eyebrow">REQ-036</p>
                    <h2>术语管理</h2>
                  </div>
                  <div className="toolbar-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setSelectedTermId(null);
                        setTermDraft(emptyTermDraft);
                      }}
                      disabled={isBusy}
                    >
                      新建
                    </button>
                  </div>
                </div>
                <div className="term-edit-pane term-workspace-body">
                  <div className="subsection-heading">
                    <strong>术语编辑</strong>
                    <span>{selectedTermId ? '正在编辑已选术语' : '填写后创建当前空间术语'}</span>
                  </div>
                  <form className="compact-form term-form-grid" onSubmit={handleSaveTerm}>
                    <label>
                      标准名称
                      <input
                        value={termDraft.term}
                        onChange={(event) => setTermDraft({ ...termDraft, term: event.target.value })}
                        placeholder="例如：触发延迟"
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
                    <label className="wide-field">
                      定义
                      <textarea
                        className="question-input"
                        value={termDraft.definition}
                        onChange={(event) => setTermDraft({ ...termDraft, definition: event.target.value })}
                        placeholder="例如：从条件满足到指令发出"
                        rows={4}
                      />
                    </label>
                    <label className="wide-field">
                      别名（逗号分隔）
                      <input
                        value={termDraft.aliases}
                        onChange={(event) => setTermDraft({ ...termDraft, aliases: event.target.value })}
                        placeholder="例如：开关延迟, 联动延迟"
                      />
                    </label>
                    <div className="button-row wide-field">
                      <button type="submit" disabled={isBusy || termDraft.term.trim().length === 0 || termDraft.definition.trim().length === 0}>保存术语</button>
                      {selectedTermId ? (
                        <button type="button" className="danger" onClick={() => void handleDeleteTerm()} disabled={isBusy}>删除</button>
                      ) : null}
                    </div>
                  </form>
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
