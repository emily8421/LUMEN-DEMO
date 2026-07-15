import ReactMarkdown from 'react-markdown';

type MarkdownBlockProps = {
  content: string;
  emptyText?: string;
  className?: string;
};

export function MarkdownBlock({ content, emptyText = '暂无内容。', className = '' }: MarkdownBlockProps) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown>{trimmedContent}</ReactMarkdown>
    </div>
  );
}
