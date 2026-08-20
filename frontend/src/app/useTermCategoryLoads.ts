import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { TermCategoryView } from '../api';
import { listTermCategories } from '../api';
import { createKeyedResponseOwnership } from './response-ownership';

export function parentKey(parentId: number | null): string {
  return parentId === null ? 'root' : String(parentId);
}

type UseTermCategoryLoadsArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  setCategoriesByParent: Dispatch<SetStateAction<Record<string, TermCategoryView[]>>>;
};

export function useTermCategoryLoads({ token, currentSpaceId, setCategoriesByParent }: UseTermCategoryLoadsArgs) {
  const responseOwnership = useRef(createKeyedResponseOwnership());
  const scope = JSON.stringify([token ?? null, currentSpaceId ?? null]);
  responseOwnership.current.setScope(scope);

  async function loadParent(loadToken: string, parentId: number | null) {
    if (!responseOwnership.current.isCurrentScope(JSON.stringify([loadToken, currentSpaceId ?? null]))) {
      return;
    }
    const ticket = responseOwnership.current.begin(parentKey(parentId));
    const items = await listTermCategories(loadToken, parentId);
    if (responseOwnership.current.owns(ticket)) {
      setCategoriesByParent((current) => ({ ...current, [parentKey(parentId)]: items }));
    }
  }

  async function reloadParents(loadToken: string, parentIds: Array<number | null>) {
    if (!responseOwnership.current.isCurrentScope(JSON.stringify([loadToken, currentSpaceId ?? null]))) {
      return;
    }
    const uniqueParentIds = Array.from(new Map(parentIds.map((id) => [parentKey(id), id])).values());
    const entries = await Promise.all(
      uniqueParentIds.map(async (parentId) => {
        const key = parentKey(parentId);
        const ticket = responseOwnership.current.begin(key);
        return { key, items: await listTermCategories(loadToken, parentId), ticket };
      }),
    );
    const currentEntries = entries
      .filter(({ ticket }) => responseOwnership.current.owns(ticket))
      .map(({ key, items }) => [key, items] as const);
    if (currentEntries.length > 0) {
      setCategoriesByParent((current) => ({ ...current, ...Object.fromEntries(currentEntries) }));
    }
  }

  return { loadParent, reloadParents, reloadRoot: (loadToken: string) => loadParent(loadToken, null) };
}
