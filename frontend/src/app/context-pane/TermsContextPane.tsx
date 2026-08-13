import type { CSSProperties } from 'react';
import type { Term } from '../../api';
import { TermCategoryTree } from '../term-category-tree/TermCategoryTree';
import type { TermCategoryManager } from '../useTermCategories';
import type { usePaneSectionHeight } from '../usePaneSectionHeight';

type TermsContextPaneProps = {
  terms: Term[];
  selectedTermId: number | null;
  isBusy: boolean;
  onSelectTerm: (term: Term) => void;
  onNewTerm: (categoryId?: number | null) => void;
  termCategories: TermCategoryManager;
  termCategoriesHeight: ReturnType<typeof usePaneSectionHeight>;
};

/**
 * 左栏术语视图（REQ-036 / REQ-048）：头部「新建」+ 全局术语固定区 + 领域分区
 * （resizer 可调高度 + 空间领域树）。E4 Slice D 从 ContextPane 拆分。
 */
export function TermsContextPane({
  terms,
  selectedTermId,
  isBusy,
  onSelectTerm,
  onNewTerm,
  termCategories,
  termCategoriesHeight,
}: TermsContextPaneProps) {
  return (
    <>
      <section className="context-header section-title">
        <div>
          <h2>术语</h2>
          <p className="empty-state">当前空间 {terms.length} 条</p>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => onNewTerm()}
          disabled={isBusy}
        >
          新建
        </button>
      </section>

      <div className="context-tree-split">
        <div className="context-tree-upper">
          {(() => {
            const globalTerms = terms.filter((term) => term.space_id == null);
            if (globalTerms.length === 0) {
              return <p className="empty-state context-empty">暂无全局术语。</p>;
            }
            return (
              <>
                <div className="subsection-heading">
                  <strong>全局术语</strong>
                  <span>{globalTerms.length}</span>
                </div>
                <ul className="term-list context-list">
                  {globalTerms.map((term) => (
                    <li key={term.id}>
                      <button
                        type="button"
                        className={term.id === selectedTermId ? 'active' : ''}
                        onClick={() => onSelectTerm(term)}
                      >
                        <strong>{term.term}</strong>
                        <small>全局 · {term.status === 'confirmed' ? '已确认' : '待确认'}</small>
                        <span>{term.definition}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>

        <div
          className={termCategoriesHeight.resizing ? 'pane-resizer pane-resizer-row resizing' : 'pane-resizer pane-resizer-row'}
          role="separator"
          aria-orientation="horizontal"
          aria-label="调整领域分区高度"
          tabIndex={0}
          onPointerDown={termCategoriesHeight.startResize}
          onPointerMove={termCategoriesHeight.moveResize}
          onPointerUp={termCategoriesHeight.endResize}
          onPointerCancel={termCategoriesHeight.endResize}
          onDoubleClick={termCategoriesHeight.resetHeight}
          onKeyDown={termCategoriesHeight.handleKeyDown}
        />

        <div
          className="term-categories-zone"
          style={{ '--term-categories-height': `${termCategoriesHeight.height}px` } as CSSProperties}
        >
          <div className="subsection-heading term-categories-heading">
            <strong>空间领域</strong>
            <button
              type="button"
              className="secondary"
              onClick={() => termCategories.beginCreateCategory(null)}
              disabled={isBusy}
            >
              ＋ 新建领域
            </button>
          </div>
          <TermCategoryTree
            terms={terms.filter((term) => term.space_id != null)}
            selectedTermId={selectedTermId}
            isBusy={isBusy}
            categories={termCategories}
            onSelectTerm={onSelectTerm}
            onNewTermInCategory={(categoryId) => onNewTerm(categoryId)}
          />
        </div>
      </div>
    </>
  );
}
