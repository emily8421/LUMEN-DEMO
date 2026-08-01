export type ActiveView = 'home' | 'documents' | 'search' | 'query' | 'terms' | 'tags';

const workspaceViews: Array<{ id: ActiveView; label: string; description: string }> = [
  { id: 'home', label: '首页', description: '欢迎 / 快速入口' },
  { id: 'documents', label: '文档', description: '编辑、预览、版本' },
  { id: 'search', label: '搜索', description: '全文 / 语义检索' },
  { id: 'query', label: '问答', description: 'RAG 答案与来源' },
  { id: 'terms', label: '术语', description: '空间术语维护' },
  { id: 'tags', label: '标签', description: '标签视图与筛选' },
];

type WorkspaceViewNavProps = {
  activeView: ActiveView;
  disabled: boolean;
  onChange: (view: ActiveView) => void;
};

export function WorkspaceViewNav({ activeView, disabled, onChange }: WorkspaceViewNavProps) {
  return (
    <nav className="view-nav" aria-label="工作台视图">
      {workspaceViews.map((view) => (
        <button
          key={view.id}
          type="button"
          className={activeView === view.id ? 'active' : ''}
          onClick={() => onChange(view.id)}
          disabled={disabled}
        >
          <span>{view.label}</span>
          <small>{view.description}</small>
        </button>
      ))}
    </nav>
  );
}
