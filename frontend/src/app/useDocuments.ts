import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Draft } from './types';
import type { ActiveView } from './WorkspaceViewNav';
import type { KnowledgeDocument } from '../api';
import {
  createDocument,
  deleteDocument,
  isDocumentDetail,
  moveDocument,
  restoreVersion,
  updateDocument,
} from '../api';
import { emptyDraft, normalizeDraft } from './drafts';
import { useDocumentSideData } from './useDocumentSideData';
import { createDownloadActions } from './download-actions';
import { useDocumentReload } from './useDocumentReload';
import type { RunAction } from './types';

type UseDocumentsArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
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
 * 抽成独立 hook（APP-SIZE-C-011），App.tsx 最大的一摊。封装文档列表 / 选中 / 草稿 /
 * 新建态 / selectedDocument draft 同步 effect + 文档 CRUD / 版本恢复 / 下载 / 打开 /
 * reloadDocuments。版本 / 出入链 / 反链侧数据在 useDocumentSideData（E4 拆分）。
 *
 * 写操作经 App 注入的 runAction 包装；文档变更后经 onDocumentsChanged 回调刷新工作区；
 * 登录失效经 onAuthError 回调交回 App。
 */
export function useDocuments({
  token,
  currentSpaceId,
  runAction,
  setNotice,
  setError,
  onAuthError,
  onDocumentsChanged,
  setActiveView,
}: UseDocumentsArgs) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isCreating, setIsCreating] = useState(false);
  // ⑥：新建目标文件夹（文件夹右键「在此新建文档」传入；null=根目录）。
  const [creatingFolderId, setCreatingFolderId] = useState<number | null>(null);
  const [savedRevision, setSavedRevision] = useState(0);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedId) ?? null,
    [documents, selectedId],
  );

  const sideData = useDocumentSideData({
    token,
    currentSpaceId,
    selectedDocument,
    isCreating,
    onAuthError,
    setNotice,
    setError,
    onDetailLoaded: (detail) => {
      setDocuments((currentDocuments) => {
        const hasDocument = currentDocuments.some((document) => document.id === detail.id);
        if (!hasDocument) {
          return [detail, ...currentDocuments];
        }
        return currentDocuments.map((document) => (document.id === detail.id ? detail : document));
      });
    },
  });

  // 新建态 / 选中文档变化 → 同步草稿（版本 / 出入链 / 反链同步在 useDocumentSideData）。
  useEffect(() => {
    if (isCreating) {
      // ⑥：新建草稿携带目标文件夹（文件夹右键新建时设置 creatingFolderId）。
      setDraft({ ...emptyDraft, folder_id: creatingFolderId ?? null });
      return;
    }

    if (selectedDocument) {
      if (!isDocumentDetail(selectedDocument)) {
        // 详情加载中（useDocumentSideData 负责 loadDocumentDetail），草稿不动。
        return;
      }

      setDraft({
        title: selectedDocument.title,
        content_md: selectedDocument.content_md,
        permission: selectedDocument.permission,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreating, creatingFolderId, selectedDocument?.id, selectedDocument && isDocumentDetail(selectedDocument), selectedDocument?.permission, selectedDocument?.title, token]);

  const reloadDocuments = useDocumentReload({
    token,
    currentSpaceId,
    setDocuments,
    setSelectedId,
    setIsCreating,
    setDraft,
    resetSideData: sideData.resetSideData,
  });

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
      await sideData.loadVersions(token, savedDocument.id);
      setNotice(`已保存：${savedDocument.title}（版本 ${savedDocument.current_version}）`);
      setSavedRevision((revision) => revision + 1);
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
        content_md: savedDocument.content_md,
        permission: savedDocument.permission,
      });
      await reloadDocuments(token);
      setSelectedId(savedDocument.id);
      await sideData.loadVersions(token, savedDocument.id);
      setNotice(`已应用 AI 润色（版本 ${savedDocument.current_version}）`);
    });
  };

  /** 新建文档；folderId 传入时在指定文件夹下新建（⑥，文件夹右键入口），缺省=根目录。 */
  const handleCreateDocument = (folderId?: number | null) => {
    setActiveView('documents');
    setCreatingFolderId(folderId ?? null);
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

  const handleDeleteDocument = (documentId: number) => {
    if (!token) {
      return;
    }
    const target = documents.find((document) => document.id === documentId);
    if (!target) {
      return;
    }
    if (!window.confirm(`确认删除文档「${target.title}」？此操作不可撤销。`)) {
      return;
    }
    void runAction('正在删除文档...', async () => {
      await deleteDocument(token, documentId);
      if (selectedId === documentId) {
        setSelectedId(null);
      }
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
      await sideData.loadVersions(token, restored.id);
      setNotice(`已恢复到版本 ${versionNo}。`);
    });
  };

  const downloadActions = createDownloadActions({
    token,
    selectedDocument,
    runAction,
    setNotice,
  });

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
    if (!documentRecord || !isDocumentDetail(documentRecord)) {
      await runAction('正在打开来源文档...', async () => {
        await sideData.loadDocumentDetail(token, documentId);
        await sideData.loadVersions(token, documentId);
        setNotice(`已打开来源文档：${title}`);
      });
      return;
    }

    await sideData.loadVersions(token, documentId);
    setNotice(`已打开来源文档：${title}`);
  };

  return {
    documents,
    selectedId,
    setSelectedId,
    versions: sideData.versions,
    outboundLinks: sideData.outboundLinks,
    backlinks: sideData.backlinks,
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
    handleDeleteDocument,
    handleRestore,
    handleDownloadMarkdown: downloadActions.handleDownloadMarkdown,
    handleExportPdf: downloadActions.handleExportPdf,
    handleOpenDocument,
    savedRevision,
  };
}
