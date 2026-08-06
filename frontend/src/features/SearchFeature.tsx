import type { SearchResponse } from '../api';
import { MarkdownBlock } from '../components/MarkdownBlock';

type SearchFeatureProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchResult: SearchResponse | null;
  isBusy: boolean;
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenDocument: (documentId: number | null, title: string) => void;
  /** 空态引导：去新建文档（Sprint-25 L1）。 */
  onCreateDocument: () => void;
  /** 空态引导：去导入（Sprint-25 L1）。 */
  onOpenImport: () => void;
};

export function SearchFeature({
  searchQuery,
  onSearchQueryChange,
  searchResult,
  isBusy,
  onSearch,
  onOpenDocument,
  onCreateDocument,
  onOpenImport,
}: SearchFeatureProps) {
  return (
    <section className="search-panel focus-panel task-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>搜索</h2>
        </div>
        <span className="badge">Hybrid：关键词 + 语义</span>
      </div>
      <form className="compact-form focus-form task-input" onSubmit={onSearch}>
        <label>
          关键词
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="输入标题、正文关键词或语义问题"
          />
        </label>
        <button type="submit" disabled={isBusy || searchQuery.trim().length === 0}>搜索</button>
      </form>
      {!searchResult ? (
        <div className="empty-state-guide task-empty">
          <p>先新建或导入文档——示例文档<strong>未建索引</strong>，只有新建 / 导入的文档才会被搜索命中。</p>
          <div className="empty-state-actions">
            <button type="button" className="secondary" onClick={onCreateDocument} disabled={isBusy}>去新建文档</button>
            <button type="button" className="secondary" onClick={onOpenImport} disabled={isBusy}>去导入</button>
          </div>
        </div>
      ) : searchResult.items.length === 0 ? (
        <p className="empty-state task-empty">未找到匹配文档。试试换关键词，或先新建 / 导入文档（示例文档未建索引）。</p>
      ) : (
        <ul className="result-list task-result-list">
          {searchResult.items.map((item) => (
            <li key={`${item.doc_id}-${item.chunk_id}-${item.ordinal}`}>
              <article className="result-card result-row">
                <button
                  type="button"
                  className="result-open-button"
                  onClick={() => onOpenDocument(item.doc_id, item.title)}
                >
                  <strong>{item.title}</strong>
                </button>
                <small>doc #{item.doc_id} · chunk #{item.chunk_id} · #{item.ordinal}</small>
                <MarkdownBlock content={item.snippet} className="compact-markdown" />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}