import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentTagView } from '../api';
import { listDocumentTags } from '../api';
import { createResponseOwnership } from './response-ownership';

type UseDocumentTagsArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  selectedDocumentId: number | null;
};

export function useDocumentTags({ token, currentSpaceId, selectedDocumentId }: UseDocumentTagsArgs) {
  const [documentTags, setDocumentTags] = useState<DocumentTagView[]>([]);
  const responseOwnership = useRef(createResponseOwnership());
  const scopeFor = useCallback(
    (documentId: number | null) => JSON.stringify([token ?? null, currentSpaceId ?? null, documentId]),
    [token, currentSpaceId],
  );
  const scope = scopeFor(selectedDocumentId);
  responseOwnership.current.setScope(scope);

  const reloadDocumentTags = useCallback(async (loadToken: string, documentId: number) => {
    if (!responseOwnership.current.isCurrentScope(scopeFor(documentId))) {
      return;
    }
    const ticket = responseOwnership.current.begin();
    const rows = await listDocumentTags(loadToken, documentId);
    if (responseOwnership.current.owns(ticket)) {
      setDocumentTags(rows);
    }
  }, [scopeFor]);

  useEffect(() => {
    if (!token || selectedDocumentId == null) {
      setDocumentTags([]);
      return;
    }
    void reloadDocumentTags(token, selectedDocumentId).catch(() => {
      // Document tag loading must not block editing.
    });
  }, [token, selectedDocumentId, reloadDocumentTags]);

  return { documentTags, reloadDocumentTags };
}
