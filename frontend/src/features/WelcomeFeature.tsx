import type { ActiveView } from '../app/WorkspaceViewNav';

interface WelcomeFeatureProps {
  isBusy: boolean;
  /** 视图切换：点卡片进对应视图（Doc-First §9.5.2 首页，Sprint-21 slice 3c）。 */
  onNavigate: (view: ActiveView) => void;
  /** 新建文档（复用 documents.handleCreateDocument，内部切 documents + isCreating）。 */
  onCreateDocument: () => void;
  /** 快速录入（复用 quickEntry.open）。 */
  onOpenQuickEntry: () => void;
}

/**
 * 欢迎引导页（Doc-First §9.5.2，Sprint-21 slice 3c）：登录后默认落地页。
 * 纯引导定位——欢迎语 + 功能卡片 + 轻指引，不带数据列表（嫌空再补最近文档）。
 */
export function WelcomeFeature({ isBusy, onNavigate, onCreateDocument, onOpenQuickEntry }: WelcomeFeatureProps) {
  return (
    <div className="welcome">
      <header className="welcome-header">
        <h1>欢迎来到 LUMEN</h1>
        <p>你的团队知识库已就绪。</p>
      </header>

      <div className="welcome-cards">
        <button type="button" className="welcome-card" disabled={isBusy} onClick={onCreateDocument}>
          <span className="welcome-card-icon" aria-hidden="true">＋</span>
          <span className="welcome-card-title">新建文档</span>
          <small>开始写一篇 Markdown</small>
        </button>

        <button type="button" className="welcome-card" disabled={isBusy} onClick={() => onNavigate('search')}>
          <span className="welcome-card-icon" aria-hidden="true">🔍</span>
          <span className="welcome-card-title">搜索</span>
          <small>全文 / 语义检索</small>
        </button>

        <button type="button" className="welcome-card" disabled={isBusy} onClick={() => onNavigate('query')}>
          <span className="welcome-card-icon" aria-hidden="true">💬</span>
          <span className="welcome-card-title">问答</span>
          <small>RAG 答案与来源</small>
        </button>

        <button type="button" className="welcome-card" disabled={isBusy} onClick={onOpenQuickEntry}>
          <span className="welcome-card-icon" aria-hidden="true">⚡</span>
          <span className="welcome-card-title">快速录入</span>
          <small>随手记一条索引</small>
        </button>
      </div>

      <p className="welcome-hint">从左侧目录选择文档开始阅读，或新建一篇。</p>
    </div>
  );
}
