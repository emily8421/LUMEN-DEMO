// Markdown 标题目录（TOC）提取（④ 维护态增强）：
// 解析 markdown 文本中的 ATX 标题（# ~ ######，行首 #），生成带层级与锚点的目录。
// 锚点与 react-markdown 默认渲染的 h1..h6 id 保持一致（无显式 id 时），
// 由组件在正文侧绑定同源 id 保证点击滚动定位。

export type TocItem = {
  id: string;
  level: number;
  text: string;
};

// 与 react-markdown 默认 slug 逻辑对齐：去空白、去符号、小写、空串回退 "section"。
export function slugify(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿　-〿＀-￯-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/** 解析 ATX 标题为目录条目；每个标题用其在文档中的序号保证 id 唯一。 */
export function extractToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  const lines = content.split('\n');
  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }
    const level = match[1].length;
    const text = match[2].replace(/[*_`]/g, '').trim();
    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    // 首个不加序号；重复标题追加 -2/-3…（react-markdown 默认 rehype-slug 同策略）。
    const id = count === 0 ? base : `${base}-${count + 1}`;
    items.push({ id, level, text });
  }
  return items;
}

/** 计算 TOC 展示深度（最浅为 1）；用于折叠过深层级，避免窄 TOC 挤爆。 */
export function tocDepth(items: TocItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  const minLevel = Math.min(...items.map((item) => item.level));
  return Math.max(1, minLevel);
}
