import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Draft } from './types';
import type { ActiveView } from './WorkspaceViewNav';
import type { DocLinkView, DocumentVersion, KnowledgeDocument } from '../api';
import {
  createDocument,
  deleteDocument,
  downloadDocumentMarkdown,
  exportDocumentPdf,
  getDocument,
  listDocLinks,
  listDocuments,
  listVersions,
  moveDocument,
  restoreVersion,
  triggerBrowserDownload,
  updateDocument,
} from '../api';
import { emptyDraft, normalizeDraft } from './drafts';
import { isAuthTokenError } from './session-store';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseDocumentsArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
  setError: (message: string) => void;
  onAuthError: () => void;
  onDocumentsChanged?: (token: string) => Promise<void>;
  setActiveView: (view: ActiveView) => void;
};

/**
 * 文档域 state + handler（REQ-004/005/006：CRUD / 行内编辑 / 版本）。
 *
 * 抽成独立 hook（APP-SIZE-C-011），App.tsx 最大的一摊。封装文档列表 / 选中 / 版本 /
 * 出入链 / 反链 / 草稿 / 新建态 + selectedDocument effect（同步 draft/versions/links）
 * + 文档 CRUD / 版本恢复 / 下载 / 打开 / reloadDocuments。
 *
 * 写操作经 App 注入的 runAction 包装；文档变更后经 refreshWorkspace 回调刷新工作区；
 * doc-links 加载遇登录失效经 onAuthError 回调交回 App。
 */
export function useDocuments({
  token,
  runAction,
  setNotice,
  setError,
  onAuthError,
  onDocumentsChanged,
  setActiveView,
}: UseDocumentsArgs) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [outboundLinks, setOutboundLinks] = useState<DocLinkView[]>([]);
  const [backlinks, setBacklinks] = useState<DocLinkView[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isCreating, setIsCreating] = useState(false);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedId) ?? null,
    [documents, selectedId],
  );

  // 新建态 / 选中文档变化 → 同步草稿、版本、出入链与反链。
  useEffect(() => {
    if (isCreating) {
      setDraft(emptyDraft);
      setVersions([]);
      setOutboundLinks([]);
      setBacklinks([]);
      return;
    }

    if (selectedDocument) {
      if (selectedDocument.content_md === undefined && token) {
        void loadDocumentDetail(token, selectedDocument.id);
        return;
      }

      setDraft({
        title: selectedDocument.title,
        content_md: selectedDocument.content_md ?? '',
        permission: selectedDocument.permission,
      });
      if (token) {
        void loadVersions(token, selectedDocument.id);
        void loadDocLinks(token, selectedDocument.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreating, selectedDocument?.id, selectedDocument?.content_md, selectedDocument?.permission, selectedDocument?.title, token]);

  async function loadVersions(loadToken: string, documentId: number) {
    setVersions(await listVersions(loadToken, documentId));
  }

  async function loadDocLinks(loadToken: string, documentId: number) {
    try {
      const [outbound, back] = await Promise.all([
        listDocLinks(loadToken, documentId, 'outbound'),
        listDocLinks(loadToken, documentId, 'backlink'),
      ]);
      setOutboundLinks(outbound);
      setBacklinks(back);
    } catch (caughtError) {
      // doc-links 加载失败不阻塞文档编辑；仅处理登录失效，其余静默以免覆盖主流程错误提示。
      const message = caughtError instanceof Error ? caughtError.message : '';
      if (isAuthTokenError(message)) {
        onAuthError();
        setNotice('登录已失效，请重新登录。');
      }
    }
  }

  async function loadDocumentDetail(loadToken: string, documentId: number) {
    try {
      const detail = await getDocument(loadToken, documentId);
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

  // 拉取文档列表 + 仅保留有效 selectedId（不自动选首篇；无选中由引导卡引导，Doc-First §9.5.7 F-impl-10）。供 refreshWorkspace 调用。
  async function reloadDocuments(loadToken: string) {
    const documentResult = await listDocuments(loadToken);
    setDocuments(documentResult);
    setSelectedId((currentId) => {
      if (currentId && documentResult.some((document) => document.id === currentId)) {
        return currentId;
      }
      return null;
    });
    setIsCreating(false);
    if (documentResult.length === 0) {
      // 空间无文档：清空草稿/版本，由 DocumentEmptyState 引导新建（Doc-First §9.5.7 F-impl-10）。
      setDraft(emptyDraft);
      setVersions([]);
    }
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    void runAction('正在保存文档...', async () => {
      const payload = normalizeDraft(draft);
      const savedDocument =
        isCreating || !selectedDocument
          ? await createDocument(token, payload)
          : await updateDocument(token, selectedDocument.id, payload);
      await reloadDocuments(token);
      setSelectedId(savedDocument.id);
      setIsCreating(false);
      await loadVersions(token, savedDocument.id);
      setNotice(`已保存：${savedDocument.title}（版本 ${savedDocument.current_version}）`);
    });
  };

  /** AI 润色应用（REQ-014）：把选区替换为润色结果后保存（PUT update → 版本）。 */
  const handleApplyPolishedContent = (newContentMd: string) => {
    if (!token || !selectedDocument || isCreating) {
      return;
    }
    void runAction('正在应用 AI 润色...', async () => {
      const payload = normalizeDraft({ ...draft, content_md: newContentMd });
      const savedDocument = await updateDocument(token, selectedDocument.id, payload);
      setDraft({
        title: savedDocument.title,
        content_md: savedDocument.content_md ?? newContentMd,
        permission: savedDocument.permission,
      });
      await reloadDocuments(token);
      setSelectedId(savedDocument.id);
      await loadVersions(token, savedDocument.id);
      setNotice(`已应用 AI 润色（版本 ${savedDocument.current_version}）`);
    });
  };

  const handleCreateDocument = () => {
    setActiveView('documents');
    setIsCreating(true);
  };

  const handleSelectDocument = (documentId: number) => {
    setActiveView('documents');
    setSelectedId(documentId);
    setIsCreating(false);
  };

  const handleMoveDocument = (document: KnowledgeDocument, targetFolderId: number | null) => {
    if (!token || document.folder_id === targetFolderId) {
      return;
    }

    void runAction('正在移动文档...', async () => {
      const moved = await moveDocument(token, document.id, targetFolderId);
      await reloadDocuments(token);
      await onDocumentsChanged?.(token);
      setSelectedId(moved.id);
      setIsCreating(false);
      setNotice(`已移动文档：${moved.title}`);
    });
  };

  const handleDelete = () => {
    if (!token || !selectedDocument) {
      return;
    }
    if (!window.confirm(`确认删除文档「${selectedDocument.title}」？此操作不可撤销。`)) {
      return;
    }
    void runAction('正在删除文档...', async () => {
      await deleteDocument(token, selectedDocument.id);
      setSelectedId(null);
      setIsCreating(false);
      await reloadDocuments(token);
      setNotice('文档已删除。');
    });
  };

  const handleRestore = (versionNo: number) => {
    if (!token || !selectedDocument) {
      return;
    }
    if (!window.confirm(`确认将「${selectedDocument.title}」恢复到版本 ${versionNo}？`)) {
      return;
    }
    void runAction(`正在恢复版本 ${versionNo}...`, async () => {
      const restored = await restoreVersion(token, selectedDocument.id, versionNo);
      await reloadDocuments(token);
      setSelectedId(restored.id);
      await loadVersions(token, restored.id);
      setNotice(`已恢复到版本 ${versionNo}。`);
    });
  };

  const handleDownloadMarkdown = () => {
    if (!token || !selectedDocument) {
      return;
    }
    void runAction('正在下载文档...', async () => {
      const { blob, filename } = await downloadDocumentMarkdown(token, selectedDocument.id);
      triggerBrowserDownload(blob, filename);
      setNotice(`已下载：${filename}`);
    });
  };

  const handleExportPdf = () => {
    if (!token || !selectedDocument) {
      return;
    }
    void runAction('正在导出 PDF...', async () => {
      const result = await exportDocumentPdf(token, selectedDocument.id);
      if (result.status === 'done' && result.artifact_path) {
        setNotice(`PDF 已生成：${result.artifact_path}`);
        return;
      }
      setNotice(`PDF 导出任务 ${result.export_id}：${result.status}`);
    });
  };

  const handleOpenDocument = async (documentId: number | null, title: string) => {
    if (!documentId) {
      setNotice('该来源为术语表记录，暂无可打开文档。');
      return;
    }
    if (!token) {
      return;
    }

    setActiveView('documents');
    setIsCreating(false);
    setSelectedId(documentId);

    const documentRecord = documents.find((document) => document.id === documentId);
    if (!documentRecord || documentRecord.content_md === undefined) {
      await runAction('正在打开来源文档...', async () => {
        await loadDocumentDetail(token, documentId);
        await loadVersions(token, documentId);
        setNotice(`已打开来源文档：${title}`);
      });
      return;
    }

    await loadVersions(token, documentId);
    setNotice(`已打开来源文档：${title}`);
  };

  return {
    documents,
    selectedId,
    setSelectedId,
    versions,
    outboundLinks,
    backlinks,
    draft,
    setDraft,
    isCreating,
    setIsCreating,
    selectedDocument,
    reloadDocuments,
    handleSave,
    handleApplyPolishedContent,
    handleCreateDocument,
    handleSelectDocument,
    handleMoveDocument,
    handleDelete,
    handleRestore,
    handleDownloadMarkdown,
    handleExportPdf,
    handleOpenDocument,
  };
}
