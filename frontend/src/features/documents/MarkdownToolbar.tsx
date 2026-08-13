import type { MarkdownToolbarAction } from '../../app/markdown-editor-actions';

// md 编辑工具栏（快捷插入语法；分组渲染 + 分隔线，去边框紧凑）。
// group: 'fmt' 格式 / 'struct' 结构 / 'insert' 插入；组间渲染 .editor-md-toolbar-sep。
type MdToolbarGroup = 'fmt' | 'struct' | 'insert';

const MD_TOOLBAR_ITEMS: Array<{ action: MarkdownToolbarAction; label: string; title: string; group: MdToolbarGroup }> = [
  { action: 'bold', label: 'B', title: '加粗', group: 'fmt' },
  { action: 'italic', label: 'I', title: '斜体', group: 'fmt' },
  { action: 'code', label: '`代码`', title: '行内代码', group: 'fmt' },
  { action: 'heading1', label: 'H1', title: '一级标题', group: 'struct' },
  { action: 'heading2', label: 'H2', title: '二级标题', group: 'struct' },
  { action: 'heading3', label: 'H3', title: '三级标题', group: 'struct' },
  { action: 'unordered-list', label: '• 列表', title: '无序列表', group: 'struct' },
  { action: 'ordered-list', label: '1. 列表', title: '有序列表', group: 'struct' },
  { action: 'quote', label: '❝ 引用', title: '引用', group: 'struct' },
  { action: 'divider', label: '— 分割线', title: '分割线', group: 'struct' },
  { action: 'code-block', label: '代码块', title: '代码块', group: 'insert' },
  { action: 'link', label: '🔗 链接', title: '链接', group: 'insert' },
  { action: 'image', label: '🖼 图片', title: '图片', group: 'insert' },
];

const MD_TOOLBAR_GROUP_LABEL: Record<MdToolbarGroup, string> = {
  fmt: '格式',
  struct: '结构',
  insert: '插入',
};

export function MarkdownToolbar({ onAction }: { onAction: (action: MarkdownToolbarAction) => void }) {
  return (
    <div className="editor-md-toolbar" role="toolbar" aria-label="Markdown 工具栏">
      {(['fmt', 'struct', 'insert'] as MdToolbarGroup[]).map((group, groupIndex) => (
        <span key={group} className="editor-md-toolbar-group" role="group" aria-label={MD_TOOLBAR_GROUP_LABEL[group]}>
          {groupIndex > 0 ? <span className="editor-md-toolbar-sep" aria-hidden="true" /> : null}
          {MD_TOOLBAR_ITEMS.filter((item) => item.group === group).map((item) => (
            <button
              key={item.action}
              type="button"
              className="editor-md-toolbar-btn"
              onClick={() => onAction(item.action)}
              title={item.title}
              aria-label={item.title}
            >
              {item.label}
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}
