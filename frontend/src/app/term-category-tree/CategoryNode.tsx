import { useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { TermCategoryView } from '../../api';
import type { TermCategoryManager } from '../useTermCategories';
import { TreeInlineEditor } from '../tree/TreeInlineEditor';
import { useTreeMenuDismiss } from '../tree/useTreeMenuDismiss';
import type { TreeMenuState } from './TermCategoryTree';

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

/**
 * 术语领域树单个领域节点（REQ-036 / REQ-048）：展开/折叠 + 右键菜单（新建术语/子领域/上移下移/
 * 重命名/删除）+ 行内重命名编辑器。E4 Slice D 从 TermCategoryTree 拆分，复用共享
 * tree/TreeInlineEditor 与 tree/useTreeMenuDismiss（消除与 FolderTree 侧重复）。
 */
export function CategoryNode({
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

  useTreeMenuDismiss(isMenuOpen, onCloseMenu, menuRef);

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
        <TreeInlineEditor
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
