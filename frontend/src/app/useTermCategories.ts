import { useMemo, useState } from 'react';
import type { TermCategoryView } from '../api';
import {
  createTermCategory as createTermCategoryRequest,
  deleteTermCategory,
  reorderTermCategories,
  updateTermCategory as updateTermCategoryRequest,
} from '../api';
import { parentKey, useTermCategoryLoads } from './useTermCategoryLoads';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseTermCategoriesArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

export type TermCategoryInlineEdit =
  | {
      mode: 'create';
      parentId: number | null;
    }
  | {
      mode: 'rename';
      category: TermCategoryView;
    };

export { parentKey } from './useTermCategoryLoads';

/**
 * REQ-036 术语领域树 state + handler。
 *
 * 仿 useFolders（REQ-039 文档目录树）：按 parent 懒加载 ``categoriesByParent`` +
 * 展开状态 ``expandedCategoryIds`` + inline 新建/重命名。术语叶子不在本 hook 维护
 * （由 useTerms 的 terms + selectedTermId 承担）；本 hook 只维护领域树结构。
 */
export function useTermCategories({ token, currentSpaceId, runAction, setNotice }: UseTermCategoriesArgs) {
  const [categoriesByParent, setCategoriesByParent] = useState<Record<string, TermCategoryView[]>>({});
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
  const [inlineEdit, setInlineEdit] = useState<TermCategoryInlineEdit | null>(null);
  const { loadParent, reloadParents, reloadRoot } = useTermCategoryLoads({ token, currentSpaceId, setCategoriesByParent });

  const knownCategories = useMemo(() => {
    const byId = new Map<number, TermCategoryView>();
    Object.values(categoriesByParent).forEach((categories) => {
      categories.forEach((category) => byId.set(category.id, category));
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }, [categoriesByParent]);

  function getCategoriesForParent(parentId: number | null): TermCategoryView[] {
    return categoriesByParent[parentKey(parentId)] ?? [];
  }

  function resetCategories() {
    setCategoriesByParent({});
    setExpandedCategoryIds(new Set());
  }

  function collapseAll() {
    setExpandedCategoryIds(new Set());
  }

  function expandAll() {
    setExpandedCategoryIds(new Set(knownCategories.map((category) => category.id)));
  }

  function beginCreateCategory(parentId: number | null) {
    if (parentId !== null) {
      setExpandedCategoryIds((current) => new Set(current).add(parentId));
      if (!categoriesByParent[parentKey(parentId)] && token) {
        void runAction('正在加载领域...', async () => {
          await loadParent(token, parentId);
        });
      }
    }
    setInlineEdit({ mode: 'create', parentId });
  }

  function beginRenameCategory(category: TermCategoryView) {
    setInlineEdit({ mode: 'rename', category });
  }

  function cancelInlineEdit() {
    setInlineEdit(null);
  }

  function toggleCategory(categoryId: number) {
    const isExpanded = expandedCategoryIds.has(categoryId);
    if (isExpanded) {
      setExpandedCategoryIds((current) => {
        const next = new Set(current);
        next.delete(categoryId);
        return next;
      });
      return;
    }

    setExpandedCategoryIds((current) => new Set(current).add(categoryId));
    if (!categoriesByParent[parentKey(categoryId)] && token) {
      void runAction('正在加载领域...', async () => {
        await loadParent(token, categoryId);
      });
    }
  }

  async function createCategoryWithName(parentId: number | null, name: string): Promise<boolean> {
    const trimmedName = name.trim();
    if (!token || !trimmedName) {
      return false;
    }

    let succeeded = false;
    await runAction('正在新建领域...', async () => {
      await createTermCategoryRequest(token, { name: trimmedName, parent_id: parentId });
      if (parentId !== null) {
        setExpandedCategoryIds((current) => new Set(current).add(parentId));
      }
      await reloadParents(token, [parentId]);
      setNotice(`已新建领域：${trimmedName}`);
      succeeded = true;
    });
    return succeeded;
  }

  async function renameCategoryWithName(category: TermCategoryView, name: string): Promise<boolean> {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === category.name) {
      return true;
    }

    if (!token) {
      return false;
    }

    let succeeded = false;
    await runAction('正在重命名领域...', async () => {
      await updateTermCategoryRequest(token, category.id, { name: trimmedName });
      await reloadParents(token, [category.parent_id]);
      setNotice(`已重命名为：${trimmedName}`);
      succeeded = true;
    });
    return succeeded;
  }

  async function submitInlineEdit(name: string): Promise<boolean> {
    if (!inlineEdit) {
      return false;
    }

    const succeeded =
      inlineEdit.mode === 'create'
        ? await createCategoryWithName(inlineEdit.parentId, name)
        : await renameCategoryWithName(inlineEdit.category, name);
    if (succeeded) {
      setInlineEdit(null);
    }
    return succeeded;
  }

  function handleDeleteCategory(category: TermCategoryView) {
    if (!token) {
      return;
    }
    if (!window.confirm(`确认删除空领域「${category.name}」？`)) {
      return;
    }

    void runAction('正在删除领域...', async () => {
      await deleteTermCategory(token, category.id);
      setExpandedCategoryIds((current) => {
        const next = new Set(current);
        next.delete(category.id);
        return next;
      });
      setCategoriesByParent((current) => {
        const next = { ...current };
        delete next[parentKey(category.id)];
        return next;
      });
      await reloadParents(token, [category.parent_id]);
      setNotice('领域已删除。');
    });
  }

  function handleMoveCategoryOrder(parentId: number | null, categoryId: number, direction: -1 | 1) {
    if (!token) {
      return;
    }
    const siblings = getCategoriesForParent(parentId);
    const index = siblings.findIndex((category) => category.id === categoryId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return;
    }

    const orderedIds = siblings.map((category) => category.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];

    void runAction('正在调整领域顺序...', async () => {
      await reorderTermCategories(token, { parent_id: parentId, ordered_ids: orderedIds });
      await reloadParents(token, [parentId]);
      setNotice('领域顺序已更新。');
    });
  }

  return {
    categoriesByParent,
    expandedCategoryIds,
    inlineEdit,
    knownCategories,
    getCategoriesForParent,
    reloadRoot,
    resetCategories,
    collapseAll,
    expandAll,
    beginCreateCategory,
    beginRenameCategory,
    cancelInlineEdit,
    submitInlineEdit,
    toggleCategory,
    handleDeleteCategory,
    handleMoveCategoryOrder,
  };
}

export type TermCategoryManager = ReturnType<typeof useTermCategories>;
