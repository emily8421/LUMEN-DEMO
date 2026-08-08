// md 编辑工具栏语法插入（⑤ 维护态增强）：
// 在 textarea 光标处插入 markdown 语法；有选区时包裹选区（bold/italic/code），否则插入占位。
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

function insertBlock(value: string, start: number, end: number, prefix: string, placeholder: string): EditorInsertResult {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const effectiveEnd = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, effectiveEnd);
  const selected = value.slice(start, end);
  const content = selected && line.includes(selected) ? selected : placeholder;
  const next = value.slice(0, lineStart) + prefix + content + value.slice(effectiveEnd);
  return {
    value: next,
    start: lineStart + prefix.length,
    end: lineStart + prefix.length + content.length,
  };
}

/** 在 value 的 start 处插入一行（含前导换行补位），返回新光标。 */
function insertLine(value: string, start: number, end: number, content: string): EditorInsertResult {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const effectiveEnd = lineEnd === -1 ? value.length : lineEnd;
  const prefix = lineStart > 0 ? '\n' : '';
  const suffix = effectiveEnd < value.length ? '\n' : '';
  const next = value.slice(0, lineStart) + prefix + content + suffix + value.slice(effectiveEnd);
  const newStart = lineStart + prefix.length;
  return { value: next, start: newStart, end: newStart + content.length };
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
      return insertLine(value, start, end, '# ');
    case 'heading2':
      return insertLine(value, start, end, '## ');
    case 'heading3':
      return insertLine(value, start, end, '### ');
    case 'unordered-list':
      return insertLine(value, start, end, '- ');
    case 'ordered-list':
      return insertLine(value, start, end, '1. ');
    case 'quote':
      return insertLine(value, start, end, '> ');
    case 'code-block':
      return insertLine(value, start, end, '```\n\n```');
    case 'divider':
      return insertLine(value, start, end, '---');
    default:
      return { value, start, end };
  }
}
