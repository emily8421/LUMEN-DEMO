import { useEffect, useRef, useState } from 'react';
import type { DocLinkView, DocumentVersion, KnowledgeDocument } from '../api';
import { getDocument, isDocumentDetail, listDocLinks, listVersions } from '../api';
import { isAuthTokenError } from './session-store';
import { createResponseOwnership } from './response-ownership';

type UseDocumentSideDataArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  selectedDocument: KnowledgeDocument | null;
  isCreating: boolean;
  onAuthError: () => void;
  setNotice: (message: string) => void;
  setError: (message: string) => void;
  /** 详情加载回调：子 hook 拿到完整文档后写回主 hook 的 documents state。 */
  onDetailLoaded: (detail: KnowledgeDocument) => void;
};

/**
 * 文档「侧数据」state + 加载（E4 拆分溯源：useDocuments.ts 拆分——版本 / 出入链 / 反链）。
 *
 * 职责：versions / outboundLinks / backlinks 三个 state + loadVersions / loadDocLinks /
 * loadDocumentDetail + 选中态变化的 side-data 同步 effect（清空 / 加载）。draft 同步
 * effect 留在 useDocuments（主 hook 管草稿，本 hook 管侧数据，职责不重叠）。
 *
 * 依赖注入约定：onAuthError / setNotice / setError 由 useDocuments 透传（doc-links 失败
 * 不阻塞主流程）；loadDocumentDetail 的结果经 onDetailLoaded 回写 documents state。
 */
export function useDocumentSideData({
  token,
  currentSpaceId,
  selectedDocument,
  isCreating,
  onAuthError,
  setNotice,
  setError,
  onDetailLoaded,
}: UseDocumentSideDataArgs) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [outboundLinks, setOutboundLinks] = useState<DocLinkView[]>([]);
  const [backlinks, setBacklinks] = useState<DocLinkView[]>([]);
  const versionsResponseOwnership = useRef(createResponseOwnership());
  const linksResponseOwnership = useRef(createResponseOwnership());
  const detailResponseOwnership = useRef(createResponseOwnership());
  const currentDocumentId = selectedDocument?.id ?? null;
  const scopeFor = (documentId: number | null) =>
    JSON.stringify([token ?? null, currentSpaceId ?? null, documentId]);
  const scope = scopeFor(currentDocumentId);
  versionsResponseOwnership.current.setScope(scope);
  linksResponseOwnership.current.setScope(scope);
  detailResponseOwnership.current.setScope(scope);

  async function loadVersions(loadToken: string, documentId: number) {
    if (!versionsResponseOwnership.current.isCurrentScope(scopeFor(documentId))) {
      return;
    }
    const ticket = versionsResponseOwnership.current.begin();
    const rows = await listVersions(loadToken, documentId);
    if (versionsResponseOwnership.current.owns(ticket)) {
      setVersions(rows);
    }
  }

  async function loadDocLinks(loadToken: string, documentId: number) {
    if (!linksResponseOwnership.current.isCurrentScope(scopeFor(documentId))) {
      return;
    }
    const ticket = linksResponseOwnership.current.begin();
    try {
      const [outbound, back] = await Promise.all([
        listDocLinks(loadToken, documentId, 'outbound'),
        listDocLinks(loadToken, documentId, 'backlink'),
      ]);
      if (linksResponseOwnership.current.owns(ticket)) {
        setOutboundLinks(outbound);
        setBacklinks(back);
      }
    } catch (caughtError) {
      // doc-links 加载失败不阻塞文档编辑；仅处理登录失效，其余静默以免覆盖主流程错误提示。
      if (linksResponseOwnership.current.owns(ticket) && isAuthTokenError(caughtError)) {
        onAuthError();
        setNotice('登录已失效，请重新登录。');
      }
    }
  }

  async function loadDocumentDetail(loadToken: string, documentId: number) {
    if (!detailResponseOwnership.current.isCurrentScope(scopeFor(documentId))) {
      return;
    }
    const ticket = detailResponseOwnership.current.begin();
    try {
      const detail = await getDocument(loadToken, documentId);
      if (detailResponseOwnership.current.owns(ticket)) {
        onDetailLoaded(detail);
      }
    } catch (caughtError) {
      if (detailResponseOwnership.current.owns(ticket)) {
        const message = caughtError instanceof Error ? caughtError.message : '文档详情加载失败';
        setError(message);
      }
    }
  }

  // 新建态 / 选中文档变化 → 清空或加载侧数据（draft 同步在主 hook effect）。
  useEffect(() => {
    if (isCreating) {
      setVersions([]);
      setOutboundLinks([]);
      setBacklinks([]);
      return;
    }

    if (selectedDocument) {
      if (!isDocumentDetail(selectedDocument) && token) {
        void loadDocumentDetail(token, selectedDocument.id);
        return;
      }

      if (token) {
        void loadVersions(token, selectedDocument.id);
        void loadDocLinks(token, selectedDocument.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreating, selectedDocument?.id, selectedDocument && isDocumentDetail(selectedDocument), token]);

  /** 空间无文档时清空侧数据（reloadDocuments 调用）。 */
  function resetSideData() {
    setVersions([]);
    setOutboundLinks([]);
    setBacklinks([]);
  }

  return {
    versions,
    outboundLinks,
    backlinks,
    loadVersions,
    loadDocLinks,
    loadDocumentDetail,
    resetSideData,
  };
}
