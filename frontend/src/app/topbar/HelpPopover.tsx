import { useEffect, useRef, useState } from 'react';

/**
 * 帮助速查条目（Sprint-25 L1 帮助弹层）。
 * 与 docs/env/user-guide.md（唯一内容源）保持一致；完整内容以「查看完整手册」为准。
 */
const HELP_ENTRIES: Array<{ category: string; term: string; detail: string }> = [
  { category: '快速开始', term: '登录', detail: '演示账号 alice / kira / brightlite-member，密码 demo-pass-1234；可注册新账号' },
  { category: '快速开始', term: '30 秒上手', detail: '新建文档 → 保存 → 搜索 / 问答；示例文档未建索引，需新建或导入' },
  { category: '文档', term: '新建', detail: '文档视图「新建」，或首页「新建文档」卡片' },
  { category: '文档', term: '导入', detail: '文档视图「导入」：.md / .txt 文件或文件夹（自动分批）' },
  { category: '搜索问答', term: '搜索', detail: 'Hybrid 关键词 + 语义；按当前空间权限过滤' },
  { category: '搜索问答', term: '问答', detail: '答案必带来源；库外问题明确回复“未找到”' },
  { category: '导入导出', term: '导出', detail: '顶栏「导出空间 ZIP」；文档详情可下载 .md / PDF' },
  { category: '组织', term: '标签 / 术语 / 链接', detail: '空间级标签与术语、[[wikilink]] 双向链接' },
  { category: '权限', term: '权限', detail: '私有 / 团队共享 / 外部只读，由后端执行' },
  { category: '快捷键', term: '快捷键', detail: 'Ctrl+B 目录 · Ctrl+R 右栏' },
];

const HELP_MANUAL_URL = 'https://github.com/emily8421/LUMEN-DEMO/blob/main/docs/env/user-guide.md';

/**
 * 顶栏帮助弹层（自持 open / query / 关闭监听 state，内聚帮助相关 UI 状态）。
 * E4 Slice D 从 TopBar 拆分；「？」触发 → 弹层内搜索速查条目 + 链接完整手册。
 */
export function HelpPopover() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');
  const helpWrapRef = useRef<HTMLDivElement>(null);

  // 帮助弹层关闭：点击外部 / Esc / 头部「×」（Sprint-25 bugfix）。
  useEffect(() => {
    if (!helpOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (helpWrapRef.current && !helpWrapRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [helpOpen]);

  const filteredHelp = (() => {
    const query = helpQuery.trim().toLowerCase();
    if (!query) {
      return HELP_ENTRIES;
    }
    return HELP_ENTRIES.filter((entry) =>
      [entry.category, entry.term, entry.detail].some((value) => value.toLowerCase().includes(query)),
    );
  })();

  return (
    <div className="help-wrap" ref={helpWrapRef}>
      <button
        type="button"
        className="help-trigger"
        aria-label="帮助（操作指引）"
        aria-expanded={helpOpen}
        onClick={() => {
          setHelpOpen((current) => !current);
          setHelpQuery('');
        }}
        title="帮助（操作指引）"
      >
        ?
      </button>
      {helpOpen ? (
        <div className="help-popover" role="region" aria-label="操作指引">
          <div className="help-header">
            <strong className="help-title">操作指引</strong>
            <button
              type="button"
              className="help-close"
              aria-label="关闭帮助"
              onClick={() => setHelpOpen(false)}
            >
              ×
            </button>
          </div>
          <input
            className="help-filter"
            value={helpQuery}
            onChange={(event) => setHelpQuery(event.target.value)}
            placeholder="搜索帮助（如：导入）"
            aria-label="搜索帮助"
          />
          <dl className="help-list">
            {filteredHelp.map((entry, index) => (
              <div key={`${entry.category}-${index}`}>
                <dt>{entry.category}</dt>
                <dd>
                  <strong>{entry.term}</strong> — {entry.detail}
                </dd>
              </div>
            ))}
          </dl>
          {filteredHelp.length === 0 ? (
            <p className="help-no-result">未找到匹配条目，请见完整手册。</p>
          ) : null}
          <a
            className="help-manual-link"
            href={HELP_MANUAL_URL}
            target="_blank"
            rel="noreferrer"
          >
            查看完整手册 →
          </a>
        </div>
      ) : null}
    </div>
  );
}
