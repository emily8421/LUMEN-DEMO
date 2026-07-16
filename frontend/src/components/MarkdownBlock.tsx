import ReactMarkdown, { type Components, defaultUrlTransform } from 'react-markdown';
import type { DocLinkView } from '../api';

type MarkdownBlockProps = {
  content: string;
  emptyText?: string;
  className?: string;
  /** 当前文档的出链（outbound）列表，用于把正文 `[[wikilink]]` 渲染成带状态的可点击链接。 */
  docLinks?: DocLinkView[];
  /** resolved wikilink 点击时跳转目标文档（复用既有 handleOpenDocument）。 */
  onOpenDocument?: (documentId: number, title: string) => void;
};

// 与后端 backend/service/document.py 的 _WIKILINK_PATTERN 保持同语法（仅 [[target]]，无 alias）。
const WIKILINK_PATTERN = /\[\[([^\[\]]+?)\]\]/g;
const WIKILINK_HREF_PREFIX = 'lumen-wikilink:';

export function MarkdownBlock({
  content,
  emptyText = '暂无内容。',
  className = '',
  docLinks,
  onOpenDocument,
}: MarkdownBlockProps) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return <p className="empty-state">{emptyText}</p>;
  }

  const supportsWikilinks = Boolean(docLinks);
  const renderedContent = supportsWikilinks ? injectWikilinkMarkers(trimmedContent) : trimmedContent;
  const linkByText = buildLinkByText(docLinks);

  const components: Components = supportsWikilinks
    ? {
        a: ({ href, children }) => {
          if (!href || !href.startsWith(WIKILINK_HREF_PREFIX)) {
            return <a href={href}>{children}</a>;
          }
          const target = safeDecodeTarget(href.slice(WIKILINK_HREF_PREFIX.length));
          return renderWikilink(target, linkByText, onOpenDocument);
        },
      }
    : {};

  // 放行 wikilink 伪 scheme；其余 url 走 react-markdown 默认安全过滤（defaultUrlTransform 仅放行 http(s)/mailto 等白名单 scheme）。
  const urlTransform = (url: string) => (url.startsWith(WIKILINK_HREF_PREFIX) ? url : defaultUrlTransform(url));

  return (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown components={components} urlTransform={urlTransform}>
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
}

/** 把正文 `[[target]]` 改写成带伪 scheme 的 markdown 链接，交由 components.a 拦截渲染。 */
function injectWikilinkMarkers(content: string): string {
  return content.replace(WIKILINK_PATTERN, (match, target: string) => {
    const trimmed = target.trim();
    if (!trimmed) {
      return match;
    }
    // 正则捕获组已排除 [ ]，故链接文本 [trimmed] 安全；href 编码 target 以便解码后查状态。
    return `[${trimmed}](${WIKILINK_HREF_PREFIX}${encodeTarget(trimmed)})`;
  });
}

/** encodeURIComponent 保留 ( ) ' * !，需额外编码以免破坏 markdown 链接语法。 */
function encodeTarget(target: string): string {
  return encodeURIComponent(target).replace(/[()'!*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}

function safeDecodeTarget(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/** 按 link_text 建索引；同锚文本多条取首条（与后端保序一致）。 */
function buildLinkByText(docLinks?: DocLinkView[]): Map<string, DocLinkView> {
  const map = new Map<string, DocLinkView>();
  if (!docLinks) {
    return map;
  }
  for (const link of docLinks) {
    if (!map.has(link.link_text)) {
      map.set(link.link_text, link);
    }
  }
  return map;
}

function renderWikilink(
  target: string,
  linkByText: Map<string, DocLinkView>,
  onOpenDocument?: (documentId: number, title: string) => void,
) {
  const link = linkByText.get(target);

  // 编辑预览中尚未同步到后端的 wikilink：显示为待解析占位（不跳转）。
  if (!link) {
    return <span className="wikilink wikilink-pending">{target}</span>;
  }

  if (link.status === 'resolved' && link.target_document_id != null) {
    if (!onOpenDocument) {
      return <span className="wikilink wikilink-resolved">{target}</span>;
    }
    const targetId = link.target_document_id;
    const title = link.target_title ?? target;
    return (
      <a
        className="wikilink wikilink-resolved"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          onOpenDocument(targetId, title);
        }}
      >
        {target}
      </a>
    );
  }

  // 安全口径（已确认）：no_access 隐藏原始锚文本，统一显示占位，不跳转、不泄露标题。
  if (link.status === 'no_access') {
    return <span className="wikilink wikilink-noaccess">无权访问的链接</span>;
  }

  // unresolved：目标文档不存在，显示锚文本 + 未创建样式，不跳转。
  return <span className="wikilink wikilink-unresolved">{target}</span>;
}
