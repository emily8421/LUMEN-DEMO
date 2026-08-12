import ReactMarkdown, { type Components, defaultUrlTransform } from 'react-markdown';
import type { DocLinkView } from '../api';
import { extractToc, slugify, tocDepth } from '../app/markdown-toc';

type MarkdownBlockProps = {
  content: string;
  emptyText?: string;
  className?: string;
  /** 当前文档的出链（outbound）列表，用于把正文 `[[wikilink]]` 渲染成带状态的可点击链接。 */
  docLinks?: DocLinkView[];
  /** resolved wikilink 点击时跳转目标文档（复用既有 handleOpenDocument）。 */
  onOpenDocument?: (documentId: number, title: string) => void;
  /** ④：阅读态展示左侧标题目录导航（长 md 文档快速定位）。 */
  showToc?: boolean;
};

// 与 markdown-toc slugify 保持同源：标题 id 注入与 TOC 锚点一一对应。
// （markdown-toc.ts 已导出 slugify；此处仅保留供 buildHeadingIds 计数，不重复导出。）

/** 按「行号 → 标题 id」映射；重复标题追加 -2/-3…，与 extractToc 计数策略一致。 */
function buildHeadingIds(content: string): Map<number, string> {
  const counts = new Map<string, number>();
  const byLine = new Map<number, string>();
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      return;
    }
    const text = match[2].replace(/[*_`]/g, '').trim();
    const base = slugify(text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    byLine.set(index, id);
  });
  return byLine;
}

// 与后端 backend/service/document.py 的 _WIKILINK_PATTERN 保持同语法（仅 [[target]]，无 alias）。
const WIKILINK_PATTERN = /\[\[([^[\]]+?)\]\]/g;
const WIKILINK_HREF_PREFIX = 'lumen-wikilink:';

export function MarkdownBlock({
  content,
  emptyText = '暂无内容。',
  className = '',
  docLinks,
  onOpenDocument,
  showToc = false,
}: MarkdownBlockProps) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return <p className="empty-state">{emptyText}</p>;
  }

  const supportsWikilinks = Boolean(docLinks);
  const renderedContent = supportsWikilinks ? injectWikilinkMarkers(trimmedContent) : trimmedContent;
  const linkByText = buildLinkByText(docLinks);

  const tocItems = showToc ? extractToc(trimmedContent) : [];
  const minDepth = tocDepth(tocItems);
  // 行号映射基于 trimmedContent（react-markdown 渲染同一份文本，node.position 行号对齐）。
  const headingIds = showToc ? buildHeadingIds(trimmedContent) : null;

  const components: Components = {
    ...(supportsWikilinks
      ? {
          a: ({ href, children }) => {
            if (!href || !href.startsWith(WIKILINK_HREF_PREFIX)) {
              return <a href={href}>{children}</a>;
            }
            const target = safeDecodeTarget(href.slice(WIKILINK_HREF_PREFIX.length));
            return renderWikilink(target, linkByText, onOpenDocument);
          },
        }
      : {}),
    // ④：为标题注入 id（按行号从 headingIds 精确取值），与 TOC 锚点一一对应（点击目录可滚动定位）。
    ...(showToc
      ? {
          h1: headingComponentFactory(1, headingIds),
          h2: headingComponentFactory(2, headingIds),
          h3: headingComponentFactory(3, headingIds),
          h4: headingComponentFactory(4, headingIds),
          h5: headingComponentFactory(5, headingIds),
          h6: headingComponentFactory(6, headingIds),
        }
      : {}),
  };

  // 放行 wikilink 伪 scheme；其余 url 走 react-markdown 默认安全过滤（defaultUrlTransform 仅放行 http(s)/mailto 等白名单 scheme）。
  const urlTransform = (url: string) => (url.startsWith(WIKILINK_HREF_PREFIX) ? url : defaultUrlTransform(url));

  const markdown = (
    <div className={`markdown-body ${className}`.trim()}>
      <ReactMarkdown components={components} urlTransform={urlTransform}>
        {renderedContent}
      </ReactMarkdown>
    </div>
  );

  if (!showToc || tocItems.length === 0) {
    return markdown;
  }

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="markdown-toc-layout">
      <nav className="markdown-toc" aria-label="文档目录">
        <strong className="markdown-toc-title">目录</strong>
        <ol className="markdown-toc-list">
          {tocItems.map((item) => (
            <li
              key={item.id}
              className="markdown-toc-item"
              style={{ paddingLeft: `${Math.max(0, item.level - minDepth) * 12}px` } as React.CSSProperties}
            >
              <button type="button" onClick={() => scrollToHeading(item.id)}>
                {item.text}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {markdown}
    </div>
  );
}

/** ④：为标题注入 id（用 node 位置行号查 headingIds，与 extractToc 计数完全同步）。 */
const HEADING_TAGS = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

function headingComponentFactory(level: number, headingIds: Map<number, string> | null) {
  const Tag = HEADING_TAGS[level as keyof typeof HEADING_TAGS];
  return (props: { children?: React.ReactNode; node?: { position?: { start?: { line?: number } } } }) => {
    const line = props.node?.position?.start?.line;
    // node.position 行号为 1-based；headingIds 键为 0-based 行 index。
    const id = line != null ? (headingIds?.get(line - 1) ?? '') : '';
    return <Tag id={id}>{props.children}</Tag>;
  };
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
