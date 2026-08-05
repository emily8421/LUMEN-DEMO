import type { TermStatus } from '../api';
import type { TermDraft } from '../app/types';

type TermsFeatureProps = {
  selectedTermId: number | null;
  isBusy: boolean;
  termDraft: TermDraft;
  onTermDraftChange: (draft: TermDraft) => void;
  onSaveTerm: (event: React.FormEvent<HTMLFormElement>) => void;
  onDeleteTerm: () => void;
  onNewTerm: () => void;
};

export function TermsFeature({
  selectedTermId,
  isBusy,
  termDraft,
  onTermDraftChange,
  onSaveTerm,
  onDeleteTerm,
  onNewTerm,
}: TermsFeatureProps) {
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
      <div className="term-edit-pane term-workspace-body">
        <div className="subsection-heading">
          <strong>术语编辑</strong>
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
      </div>
    </section>
  );
}
