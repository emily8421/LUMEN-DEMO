import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { Term, TermCategoryView } from '../api';
import type { TermCategoryManager } from './useTermCategories';
import { parentKey } from './useTermCategories';

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

type TreeMenuState =
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
          <CategoryInlineEditor
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

type CategoryNodeProps = {
  category: TermCategoryView;
  depth: number;
  index: number;
  siblingCount: number;
  isBusy: boolean;
  isExpanded: boolean;
  categories: TermCategoryManager;
  menuState: TreeMenuState;
  onOpenMenu: (categoryId: number, x: number, y: number) => void;
  onCloseMenu: () => void;
  onNewTermInCategory: (categoryId: number) => void;
  children: ReactNode;
};

function CategoryNode({
  category,
  depth,
  index,
  siblingCount,
  isBusy,
  isExpanded,
  categories,
  menuState,
  onOpenMenu,
  onCloseMenu,
  onNewTermInCategory,
  children,
}: CategoryNodeProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const categoryMenuState = menuState?.type === 'category' && menuState.categoryId === category.id ? menuState : null;
  const isMenuOpen = categoryMenuState !== null;
  const isRenaming = categories.inlineEdit?.mode === 'rename' && categories.inlineEdit.category.id === category.id;

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onCloseMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseMenu();
      }
    }

    window.document.addEventListener('pointerdown', handlePointerDown);
    window.document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onCloseMenu);
    window.addEventListener('scroll', onCloseMenu, true);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onCloseMenu);
      window.removeEventListener('scroll', onCloseMenu, true);
    };
  }, [isMenuOpen, onCloseMenu]);

  function handleContextMenu(event: ReactMouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onOpenMenu(category.id, event.clientX, event.clientY);
  }

  function runMenuAction(action: () => void) {
    onCloseMenu();
    action();
  }

  return (
    <div className="tree-folder" role="treeitem" aria-expanded={isExpanded} onContextMenu={handleContextMenu}>
      {isRenaming ? (
        <CategoryInlineEditor
          depth={depth}
          initialValue={category.name}
          placeholder="领域名称"
          icon="✎"
          disabled={isBusy}
          onCancel={categories.cancelInlineEdit}
          onSubmit={categories.submitInlineEdit}
        />
      ) : (
        <div className={`tree-row tree-folder-row${isMenuOpen ? ' menu-open' : ''}`} style={{ '--tree-depth': depth } as CSSProperties}>
          <button
            type="button"
            className="tree-toggle"
            onClick={() => categories.toggleCategory(category.id)}
            disabled={isBusy}
            aria-label={isExpanded ? `收起 ${category.name}` : `展开 ${category.name}`}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
          <button
            type="button"
            className="tree-folder-label"
            onClick={() => categories.toggleCategory(category.id)}
            disabled={isBusy}
          >
            <span>{category.name}</span>
            <span className="tree-folder-count">{category.term_count}</span>
          </button>
        </div>
      )}
      {categoryMenuState ? (
        <div
          ref={menuRef}
          className="tree-menu-popover"
          style={{ left: categoryMenuState.x, top: categoryMenuState.y } as CSSProperties}
          role="menu"
          aria-label={`${category.name} 操作`}
        >
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => onNewTermInCategory(category.id))} disabled={isBusy}>
            <span aria-hidden="true">＋</span>
            <span>在此新建术语</span>
          </button>
          <div className="tree-menu-separator" role="separator" />
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => categories.beginCreateCategory(category.id))} disabled={isBusy}>
            <span aria-hidden="true">▣</span>
            <span>新建子领域</span>
          </button>
          <button type="button" role="menuitem" onClick={() => runMenuAction(() => categories.beginRenameCategory(category))} disabled={isBusy}>
            <span aria-hidden="true">✎</span>
            <span>重命名</span>
          </button>
          <div className="tree-menu-separator" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(() => categories.handleMoveCategoryOrder(category.parent_id, category.id, -1))}
            disabled={isBusy || index === 0}
          >
            <span aria-hidden="true">↑</span>
            <span>上移</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(() => categories.handleMoveCategoryOrder(category.parent_id, category.id, 1))}
            disabled={isBusy || index === siblingCount - 1}
          >
            <span aria-hidden="true">↓</span>
            <span>下移</span>
          </button>
          <div className="tree-menu-separator" role="separator" />
          <button type="button" role="menuitem" className="danger" onClick={() => runMenuAction(() => categories.handleDeleteCategory(category))} disabled={isBusy}>
            <span aria-hidden="true">×</span>
            <span>删除空领域</span>
          </button>
        </div>
      ) : null}
      {children}
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

type CategoryInlineEditorProps = {
  depth: number;
  initialValue: string;
  placeholder: string;
  icon: string;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<boolean>;
};

function CategoryInlineEditor({
  depth,
  initialValue,
  placeholder,
  icon,
  disabled,
  onCancel,
  onSubmit,
}: CategoryInlineEditorProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    if (initialValue) {
      inputRef.current?.select();
    }
  }, [initialValue]);

  function cancel() {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onCancel();
  }

  async function submit() {
    if (finishedRef.current) {
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      cancel();
      return;
    }

    finishedRef.current = true;
    const succeeded = await onSubmit(trimmedValue);
    if (!succeeded) {
      finishedRef.current = false;
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  }

  return (
    <div className="tree-row tree-inline-row" style={{ '--tree-depth': depth } as CSSProperties}>
      <span className="tree-inline-icon" aria-hidden="true">{icon}</span>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!disabled) {
            void submit();
          }
        }}
        aria-label={placeholder}
      />
    </div>
  );
}
