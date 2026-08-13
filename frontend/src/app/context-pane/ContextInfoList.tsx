type ContextInfoItem = {
  label: string;
  description: string;
  active?: boolean;
};

type ContextInfoListProps = {
  title: string;
  subtitle: string;
  items: ContextInfoItem[];
};

/**
 * 左栏「上下文 info-list」（搜索 / 问答视图共用，DRY 抽取）：标题 + 若干 info-row。
 * E4 Slice D 从 ContextPane 拆分，两组近同构列表合并为本组件。
 */
export function ContextInfoList({ title, subtitle, items }: ContextInfoListProps) {
  return (
    <>
      <section className="context-header">
        <div className="section-title stacked">
          <h2>{title}</h2>
          <p className="empty-state">{subtitle}</p>
        </div>
      </section>
      <div className="context-list info-list">
        {items.map((item) => (
          <article key={item.label} className={item.active ? 'info-row active' : 'info-row'}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </article>
        ))}
      </div>
    </>
  );
}
