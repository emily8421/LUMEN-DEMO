import type { Term, TermStatus } from '../api';
import type { TermCategoryView } from '../api';
import type { TermDraft, TermPaneMode } from '../app/types';

// 术语内容分类候选（docs/inputs 分类陈述规范 14 类；不锁枚举，允许自由输入）。
const TERM_CATEGORY_OPTIONS = [
  '物体/设备类',
  '操作/过程类',
  '指令/命令类',
  '标识符类',
  '功能/作用类',
  '协议/标准类',
  '安全/机制类',
  '理论/概念类',
  '状态/状态机类',
  '版本/更新类',
  '数据类',
  '性能/效率类',
  '系统类',
  '文档类',
];

type TermsFeatureProps = {
  terms: Term[];
  selectedTermId: number | null;
  isBusy: boolean;
  termDraft: TermDraft;
  /** 阅读态 / 编辑态（useTerms.paneMode）。 */
  paneMode: TermPaneMode;
  onBeginEdit: () => void;
  onTermDraftChange: (draft: TermDraft) => void;
  onSaveTerm: (event: React.FormEvent<HTMLFormElement>) => void;
  onDeleteTerm: () => void;
  onNewTerm: () => void;
  /** 领域树全部已知节点（编辑态「领域」下拉 + 阅读态领域名）。 */
  categories: TermCategoryView[];
};

/**
 * REQ-036 术语主区：单一详情面板（阅读态 / 编辑态）。术语列表导航由左栏领域树承担，
 * 主区不再重复列表（用户 2026-08-07 验收反馈：避免两栏列表冗余）。
 */
export function TermsFeature({
  terms,
  selectedTermId,
  isBusy,
  termDraft,
  paneMode,
  onBeginEdit,
  onTermDraftChange,
  onSaveTerm,
  onDeleteTerm,
  onNewTerm,
  categories,
}: TermsFeatureProps) {
  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;
  const isGlobalTerm = selectedTerm?.space_id == null;
  const selectedCategory = selectedTerm?.category_id
    ? (categories.find((category) => category.id === selectedTerm.category_id) ?? null)
    : null;

  const editing = paneMode === 'edit';

  return (
    <section className="term-panel focus-panel task-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>术语管理</h2>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="secondary"
            onClick={onNewTerm}
            disabled={isBusy}
          >
            新建
          </button>
        </div>
      </div>
      <div className="term-workspace-body term-workspace-body-single">
        {!selectedTerm && !editing ? (
          <div className="empty-state term-empty-guide">
            <p>从左侧领域树选择一个术语查看详情，或点右上「新建」。</p>
            <button type="button" className="secondary" onClick={onNewTerm} disabled={isBusy}>
              新建术语
            </button>
          </div>
        ) : editing ? (
          <>
            <div className="subsection-heading">
              <strong>{selectedTermId ? '编辑术语' : '新建术语'}</strong>
              <span>{selectedTermId ? '正在编辑已选术语' : '填写后创建当前空间术语'}</span>
            </div>
            <form className="compact-form term-form-grid" onSubmit={onSaveTerm}>
              <label>
                标准名称
                <input
                  value={termDraft.term}
                  onChange={(event) => onTermDraftChange({ ...termDraft, term: event.target.value })}
                  placeholder="例如：触发延迟"
                />
              </label>
              <label>
                状态
                <select
                  value={termDraft.status}
                  onChange={(event) => onTermDraftChange({ ...termDraft, status: event.target.value as TermStatus })}
                >
                  <option value="confirmed">已确认</option>
                  <option value="pending">待确认</option>
                </select>
              </label>
              <label>
                领域
                <select
                  value={termDraft.category_id ?? ''}
                  onChange={(event) =>
                    onTermDraftChange({
                      ...termDraft,
                      category_id: event.target.value === '' ? null : Number(event.target.value),
                    })
                  }
                >
                  <option value="">未分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                内容分类
                <input
                  list="term-category-options"
                  value={termDraft.category}
                  onChange={(event) => onTermDraftChange({ ...termDraft, category: event.target.value })}
                  placeholder="例如：操作/过程类"
                />
                <datalist id="term-category-options">
                  {TERM_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
              <label>
                术语来源
                <input
                  value={termDraft.source}
                  onChange={(event) => onTermDraftChange({ ...termDraft, source: event.target.value })}
                  placeholder="例如：行业标准 / 公司内部 / 外部文献"
                />
              </label>
              <label className="wide-field">
                定义
                <textarea
                  className="question-input"
                  value={termDraft.definition}
                  onChange={(event) => onTermDraftChange({ ...termDraft, definition: event.target.value })}
                  placeholder="例如：从条件满足到指令发出"
                  rows={4}
                />
              </label>
              <label className="wide-field">
                别名（逗号分隔）
                <input
                  value={termDraft.aliases}
                  onChange={(event) => onTermDraftChange({ ...termDraft, aliases: event.target.value })}
                  placeholder="例如：开关延迟, 联动延迟"
                />
              </label>
              <div className="button-row wide-field">
                <button type="submit" disabled={isBusy || termDraft.term.trim().length === 0 || termDraft.definition.trim().length === 0}>保存术语</button>
                {selectedTermId ? (
                  <button type="button" className="danger" onClick={onDeleteTerm} disabled={isBusy}>删除</button>
                ) : null}
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="subsection-heading">
              <strong>术语详情</strong>
              <span>{isGlobalTerm ? '全局术语（只读）' : '当前空间术语'}</span>
            </div>
            <div className="term-reader">
              <h3 className="term-reader-name">{selectedTerm?.term}</h3>
              <div className="term-reader-badges">
                {selectedTerm?.status === 'confirmed' ? (
                  <span className="term-badge term-badge-confirmed">已确认</span>
                ) : (
                  <span className="term-badge term-badge-pending">待确认</span>
                )}
                {isGlobalTerm ? (
                  <span className="term-badge term-badge-global">全局</span>
                ) : (
                  <span className="term-badge term-badge-space">当前空间</span>
                )}
                {selectedCategory ? (
                  <span className="term-badge term-badge-category">{selectedCategory.name}</span>
                ) : null}
                {selectedTerm?.category ? (
                  <span className="term-badge term-badge-category">{selectedTerm.category}</span>
                ) : null}
              </div>
              <dl className="term-reader-fields">
                <dt>定义</dt>
                <dd>{selectedTerm?.definition}</dd>
                {selectedTerm && selectedTerm.aliases.length > 0 ? (
                  <>
                    <dt>别名</dt>
                    <dd>{selectedTerm.aliases.join('、')}</dd>
                  </>
                ) : null}
                {selectedTerm?.source ? (
                  <>
                    <dt>来源</dt>
                    <dd>{selectedTerm.source}</dd>
                  </>
                ) : null}
              </dl>
              {!isGlobalTerm ? (
                <div className="button-row">
                  <button type="button" onClick={onBeginEdit} disabled={isBusy}>
                    编辑
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
