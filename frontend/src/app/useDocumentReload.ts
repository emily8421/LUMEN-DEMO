import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Draft } from './types';
import type { KnowledgeDocument } from '../api';
import { listDocuments } from '../api';
import { emptyDraft } from './drafts';
import { createResponseOwnership } from './response-ownership';

type UseDocumentReloadArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  setDocuments: Dispatch<SetStateAction<KnowledgeDocument[]>>;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
  setIsCreating: Dispatch<SetStateAction<boolean>>;
  setDraft: Dispatch<SetStateAction<Draft>>;
  resetSideData: () => void;
};

export function useDocumentReload({
  token,
  currentSpaceId,
  setDocuments,
  setSelectedId,
  setIsCreating,
  setDraft,
  resetSideData,
}: UseDocumentReloadArgs) {
  const responseOwnership = useRef(createResponseOwnership());
  const scope = JSON.stringify([token ?? null, currentSpaceId ?? null]);
  responseOwnership.current.setScope(scope);

  return async function reloadDocuments(loadToken: string) {
    if (!responseOwnership.current.isCurrentScope(JSON.stringify([loadToken, currentSpaceId ?? null]))) {
      return;
    }
    const ticket = responseOwnership.current.begin();
    const documents = await listDocuments(loadToken);
    if (!responseOwnership.current.owns(ticket)) {
      return;
    }
    setDocuments(documents);
    setSelectedId((currentId) => (currentId && documents.some((document) => document.id === currentId) ? currentId : null));
    setIsCreating(false);
    if (documents.length === 0) {
      setDraft(emptyDraft);
      resetSideData();
    }
  };
}
