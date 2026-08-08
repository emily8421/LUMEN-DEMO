// md 编辑工具栏语法插入（⑤ 维护态增强）：
// 在 textarea 光标处插入 markdown 语法；有选区时包裹选区（bold/italic/code），否则插入占位。
// 块级操作（标题 / 列表 / 引用 / 分割线 / 代码块）：在光标所在行行首加前缀、**保留原行文字**，
// 仅当整行为空时才插入占位（维护态修复：原实现整行替换会误删光标行已有文字）。
// 返回新的 value / selection，由调用方 setDraft 更新并恢复光标。

export type EditorInsertResult = {
  value: string;
  /** 新 selectionStart。 */
  start: number;
  /** 新 selectionEnd。 */
  end: number;
};

export type MarkdownToolbarAction =
  | 'bold'
  | 'italic'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'unordered-list'
  | 'ordered-list'
  | 'quote'
  | 'code'
  | 'code-block'
  | 'link'
  | 'image'
  | 'divider';

function wrapSelection(value: string, start: number, end: number, before: string, after: string, placeholder: string): EditorInsertResult {
  const selected = value.slice(start, end);
  const hasSelection = start !== end;
  const inner = hasSelection ? selected : placeholder;
  const next = value.slice(0, start) + before + inner + after + value.slice(end);
  return {
    value: next,
    start: start + before.length,
    end: start + before.length + inner.length,
  };
}

/** 取光标所在行的行首 / 行尾位置（不含换行符）。 */
function currentLineBounds(value: string, start: number, end: number): { lineStart: number; lineEnd: number; lineText: string } {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const rawLineEnd = value.indexOf('\n', end);
  const lineEnd = rawLineEnd === -1 ? value.length : rawLineEnd;
  return { lineStart, lineEnd, lineText: value.slice(lineStart, lineEnd) };
}

/**
 * 行首加前缀（标题 / 列表 / 引用 / 分割线）：
 * - 光标行已有文字 → 行首插前缀，保留原文，光标停在前缀后原文前；
 * - 光标行为空 → 行首插「前缀 + 占位」。
 */
function prefixCurrentLine(value: string, start: number, end: number, prefix: string, placeholder = ''): EditorInsertResult {
  const { lineStart, lineEnd } = currentLineBounds(value, start, end);
  const lineText = value.slice(lineStart, lineEnd);
  const hasText = lineText.trim().length > 0;
  const insertText = hasText ? prefix : `${prefix}${placeholder}`;
  const next = value.slice(0, lineStart) + insertText + value.slice(lineStart);
  return {
    value: next,
    start: lineStart + prefix.length,
    end: lineStart + insertText.length,
  };
}

/** 代码块：光标处插入独立两行代码块；光标行有文字时不覆盖原文，前后补换行成独立块。 */
function insertCodeBlock(value: string, start: number, end: number): EditorInsertResult {
  const block = '```\n\n```';
  const { lineStart, lineEnd, lineText } = currentLineBounds(value, start, end);
  const hasText = lineText.trim().length > 0;
  if (!hasText) {
    // 空行 → 整行替换为代码块，光标居中（```\n 之后）。
    const next = value.slice(0, lineStart) + block + value.slice(lineEnd);
    const caret = lineStart + 4;
    return { value: next, start: caret, end: caret };
  }
  // 有文字：在光标处插入，前补换行（光标不在行首时），后补换行（不在行尾时）。
  const before = value.slice(0, start);
  const after = value.slice(end);
  const needNewlineBefore = start > lineStart && before[before.length - 1] !== '\n';
  const needNewlineAfter = after.length > 0 && after[0] !== '\n';
  const insert = `${needNewlineBefore ? '\n' : ''}${block}${needNewlineAfter ? '\n' : ''}`;
  const pos = start + (needNewlineBefore ? 1 : 0);
  const caret = pos + 4;
  const next = before + insert + after;
  return { value: next, start: caret, end: caret };
}

/** 分割线：行首加 `---`（有文字时保留原文）。 */
function insertDivider(value: string, start: number, end: number): EditorInsertResult {
  return prefixCurrentLine(value, start, end, '---');
}

export function applyMarkdownAction(
  action: MarkdownToolbarAction,
  value: string,
  start: number,
  end: number,
): EditorInsertResult {
  switch (action) {
    case 'bold':
      return wrapSelection(value, start, end, '**', '**', '加粗文字');
    case 'italic':
      return wrapSelection(value, start, end, '*', '*', '斜体文字');
    case 'code':
      return wrapSelection(value, start, end, '`', '`', '代码');
    case 'link':
      return wrapSelection(value, start, end, '[', '](https://example.com)', '链接文字');
    case 'image':
      return wrapSelection(value, start, end, '![', '](https://example.com/image.png)', '图片描述');
    case 'heading1':
      return prefixCurrentLine(value, start, end, '# ', '标题');
    case 'heading2':
      return prefixCurrentLine(value, start, end, '## ', '标题');
    case 'heading3':
      return prefixCurrentLine(value, start, end, '### ', '标题');
    case 'unordered-list':
      return prefixCurrentLine(value, start, end, '- ', '列表项');
    case 'ordered-list':
      return prefixCurrentLine(value, start, end, '1. ', '列表项');
    case 'quote':
      return prefixCurrentLine(value, start, end, '> ', '引用内容');
    case 'code-block':
      return insertCodeBlock(value, start, end);
    case 'divider':
      return insertDivider(value, start, end);
    default:
      return { value, start, end };
  }
}
