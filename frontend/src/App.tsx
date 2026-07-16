import { useEffect, useMemo, useState } from 'react';
import {
  createDocument,
  createTerm,
  deleteDocument,
  deleteTerm,
  DocumentPermission,
  DocumentVersion,
  getDocument,
  ImportBatchItem,
  importBatchDocuments,
  downloadDocumentMarkdown,
  exportSpaceZip,
  triggerBrowserDownload,
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
import { StatusBar } from './components/StatusBar';
import { WorkspaceViewNav, type ActiveView } from './app/WorkspaceViewNav';
import { TopBar } from './app/TopBar';
import { ContextPane } from './app/ContextPane';
import type { Session, ImportDraft, Draft, ImportFileSelection, TermDraft } from './app/types';
import { DocumentsFeature } from './features/DocumentsFeature';
import { SearchFeature } from './features/SearchFeature';
import { QueryFeature } from './features/QueryFeature';
import { TermsFeature } from './features/TermsFeature';

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
  permission: 'team' as DocumentPermission,
};

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
  const [importFiles, setImportFiles] = useState<ImportFileSelection[]>([]);
  const [importInputKey, setImportInputKey] = useState(0);
  const [lastImportSummary, setLastImportSummary] = useState('');
  const [lastImportItems, setLastImportItems] = useState<ImportBatchItem[]>([]);
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
    if (!session || importFiles.length === 0) {
      return;
    }

    await runAction(`正在批量导入 ${importFiles.length} 个文本...`, async () => {
      const result = await importBatchDocuments(session.token, {
        files: importFiles,
        permission: importDraft.permission,
      });
      await refreshWorkspace(session.token);
      const firstImportedItem = result.items.find((item) => item.parsed_doc_id != null);
      if (firstImportedItem?.parsed_doc_id) {
        setSelectedId(firstImportedItem.parsed_doc_id);
      }
      setActiveView('documents');
      setIsCreating(false);
      setSearchResult(null);
      setQueryResult(null);
      setImportDraft(emptyImportDraft);
      setImportFiles([]);
      setLastImportItems(result.items);
      setImportInputKey((currentKey) => currentKey + 1);
      const summary = `批量导入完成：成功 ${result.success_count}，失败 ${result.failed_count}，跳过 ${result.skipped_count}`;
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

  async function handleDownloadMarkdown() {
    if (!session || !selectedDocument) {
      return;
    }

    await runAction('正在下载文档...', async () => {
      const { blob, filename } = await downloadDocumentMarkdown(session.token, selectedDocument.id);
      triggerBrowserDownload(blob, filename);
      setNotice(`已下载：${filename}`);
    });
  }

  async function handleExportSpace() {
    if (!session) {
      return;
    }

    await runAction('正在导出空间备份...', async () => {
      const { blob, filename } = await exportSpaceZip(session.token);
      triggerBrowserDownload(blob, filename);
      setNotice(`已导出空间备份：${filename}`);
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
      <TopBar session={session} spaces={spaces} isBusy={isBusy} currentSpace={currentSpace} onSpaceChange={handleSpaceChange} onExportSpace={handleExportSpace} />

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
            importFiles={importFiles}
            onImportFilesChange={setImportFiles}
            importInputKey={importInputKey}
            lastImportSummary={lastImportSummary}
            lastImportItems={lastImportItems}
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
                onDownloadMarkdown={handleDownloadMarkdown}
              />
            ) : null}

            {activeView === 'search' ? (
              <SearchFeature
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchResult={searchResult}
                isBusy={isBusy}
                onSearch={handleSearch}
                onOpenDocument={handleOpenDocument}
              />
            ) : null}

            {activeView === 'query' ? (
              <QueryFeature
                question={question}
                onQuestionChange={setQuestion}
                queryResult={queryResult}
                isBusy={isBusy}
                onQuery={handleQuery}
                onOpenDocument={handleOpenDocument}
              />
            ) : null}

            {activeView === 'terms' ? (
              <TermsFeature
                selectedTermId={selectedTermId}
                isBusy={isBusy}
                termDraft={termDraft}
                onTermDraftChange={setTermDraft}
                onSaveTerm={handleSaveTerm}
                onDeleteTerm={handleDeleteTerm}
                onNewTerm={() => {
                  setSelectedTermId(null);
                  setTermDraft(emptyTermDraft);
                }}
              />
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
