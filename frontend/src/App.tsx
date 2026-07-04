import { useEffect, useMemo, useState } from 'react';
import {
  createDocument,
  deleteDocument,
  DocumentPermission,
  DocumentVersion,
  getDocument,
  KnowledgeDocument,
  listDocuments,
  listSpaces,
  listVersions,
  login,
  restoreVersion,
  Space,
  switchSpace,
  updateDocument,
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

type Draft = typeof emptyDraft;

type Session = {
  token: string;
  userId: number;
  currentSpaceId: number;
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

    const [spaceResult, documentResult] = await Promise.all([listSpaces(token), listDocuments(token)]);
    setSpaces(spaceResult);
    setDocuments(documentResult);
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
      setDocuments((currentDocuments) => currentDocuments.map((document) => (
        document.id === detail.id ? detail : document
      )));
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
      setNotice('空间已切换，文档列表已刷新。');
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

  async function handleDelete() {
    if (!session || !selectedDocument) {
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

    await runAction(`正在恢复版本 ${versionNo}...`, async () => {
      const restored = await restoreVersion(session.token, selectedDocument.id, versionNo);
      await refreshWorkspace(session.token);
      setSelectedId(restored.id);
      await loadVersions(session.token, restored.id);
      setNotice(`已恢复到版本 ${versionNo}。`);
    });
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
          <p className="eyebrow">LUMEN Demo · Sprint-2</p>
          <h1>文档管理与版本历史</h1>
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
        <div className="workspace-grid">
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

            <section>
              <div className="section-title">
                <h2>文档</h2>
                <button type="button" onClick={() => setIsCreating(true)} disabled={isBusy}>新建</button>
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
                        onClick={() => {
                          setSelectedId(document.id);
                          setIsCreating(false);
                        }}
                      >
                        <span>{document.title}</span>
                        <small>{permissionLabels[document.permission]} · v{document.current_version}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

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
              <button type="submit" disabled={isBusy || draft.title.trim().length === 0}>保存</button>
            </form>
          </section>

          <aside className="versions-panel card">
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
                    <p>{version.content_md.slice(0, 48) || '空内容'}</p>
                    <button type="button" onClick={() => void handleRestore(version.version_no)} disabled={isBusy}>
                      恢复
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      )}

      <footer className="status-bar">
        <span>{notice}</span>
        {error ? <strong>{error}</strong> : null}
      </footer>
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

export default App;
