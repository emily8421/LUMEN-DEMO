import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Term } from '../../api';
import type { TermCategoryManager } from '../useTermCategories';
import { parentKey } from '../useTermCategories';
import { TreeInlineEditor } from '../tree/TreeInlineEditor';
import { CategoryNode } from './CategoryNode';

type TermCategoryTreeProps = {
  /** 当前空间术语（含 category_id 归属）。 */
  terms: Term[];
  selectedTermId: number | null;
  isBusy: boolean;
  categories: TermCategoryManager;
  onSelectTerm: (term: Term) => void;
  /** 右键领域节点「在此新建术语」（预填该领域）。 */
  onNewTermInCategory: (categoryId: number) => void;
};

export type TreeMenuState =
  | {
      type: 'category';
      categoryId: number;
      x: number;
      y: number;
    }
  | null;

/**
 * REQ-036 术语领域树（左栏）：领域节点（折叠/展开/inline 新建/重命名/排序/删除）
 * + 术语叶子（点击选中进阅读态）。仿 FolderTree（REQ-039）简化版，只处理术语叶子。
 * E4 Slice D 拆分：领域节点移入 CategoryNode，内联编辑器用共享 tree/TreeInlineEditor；
 * 复用共享 tree/useTreeMenuDismiss。**不做**泛化为通用递归树（useFolders/useTermCategories API 有差异，风险高）。
 */
export function TermCategoryTree({
  terms,
  selectedTermId,
  isBusy,
  categories,
  onSelectTerm,
  onNewTermInCategory,
}: TermCategoryTreeProps) {
  const [menuState, setMenuState] = useState<TreeMenuState>(null);
  const closeMenu = () => setMenuState(null);

  const openCategoryMenu = (categoryId: number, x: number, y: number) => {
    const menuWidth = 200;
    const menuHeight = 232;
    setMenuState({
      type: 'category',
      categoryId,
      x: Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8)),
    });
  };

  const termsByCategory = (() => {
    const groups = new Map<string, Term[]>();
    terms.forEach((term) => {
      const key = parentKey(term.category_id);
      const group = groups.get(key) ?? [];
      group.push(term);
      groups.set(key, group);
    });
    groups.forEach((group) => {
      group.sort((a, b) => a.term.localeCompare(b.term, 'zh-Hans-CN'));
    });
    return groups;
  })();

  function renderBranch(parentId: number | null, depth: number): ReactNode {
    const siblingCategories = categories.getCategoriesForParent(parentId);
    const siblingTerms = termsByCategory.get(parentKey(parentId)) ?? [];
    const isCreating = categories.inlineEdit?.mode === 'create' && categories.inlineEdit.parentId === parentId;

    return (
      <>
        {isCreating ? (
          <TreeInlineEditor
            key={`create-${parentKey(parentId)}`}
            depth={depth}
            initialValue=""
            placeholder="领域名称"
            icon="▣"
            disabled={isBusy}
            onCancel={categories.cancelInlineEdit}
            onSubmit={categories.submitInlineEdit}
          />
        ) : null}
        {siblingCategories.map((category, index) => (
          <CategoryNode
            key={category.id}
            category={category}
            depth={depth}
            index={index}
            siblingCount={siblingCategories.length}
            isBusy={isBusy}
            isExpanded={categories.expandedCategoryIds.has(category.id)}
            categories={categories}
            menuState={menuState}
            onOpenMenu={openCategoryMenu}
            onCloseMenu={closeMenu}
            onNewTermInCategory={onNewTermInCategory}
          >
            {categories.expandedCategoryIds.has(category.id) ? renderBranch(category.id, depth + 1) : null}
          </CategoryNode>
        ))}
        {siblingTerms.map((term) => (
          <TermRow
            key={term.id}
            term={term}
            depth={depth}
            isActive={term.id === selectedTermId}
            isBusy={isBusy}
            onSelectTerm={onSelectTerm}
          />
        ))}
      </>
    );
  }

  const rootCategories = categories.getCategoriesForParent(null);
  const rootTerms = termsByCategory.get(parentKey(null)) ?? [];

  if (rootCategories.length === 0 && rootTerms.length === 0 && !categories.inlineEdit) {
    return <p className="empty-state context-empty">当前空间暂无领域或术语。</p>;
  }

  return (
    <div className="folder-tree context-list" role="tree" aria-label="术语领域树">
      {renderBranch(null, 0)}
    </div>
  );
}

type TermRowProps = {
  term: Term;
  depth: number;
  isActive: boolean;
  isBusy: boolean;
  onSelectTerm: (term: Term) => void;
};

function TermRow({ term, depth, isActive, isBusy, onSelectTerm }: TermRowProps) {
  return (
    <div className="tree-document-item" role="treeitem">
      <button
        type="button"
        className={`tree-row tree-document-row${isActive ? ' active' : ''}`}
        style={{ '--tree-depth': depth } as CSSProperties}
        data-term-id={term.id}
        onClick={() => onSelectTerm(term)}
        disabled={isBusy}
      >
        <span>{term.term}</span>
      </button>
    </div>
  );
}
