import { useState } from 'react';
import type { ActiveView } from '../app/WorkspaceViewNav';
import { ONBOARDING_STEPS } from '../app/onboarding-store';
import type { OnboardingState, OnboardingStepId } from '../app/onboarding-store';

interface WelcomeFeatureProps {
  isBusy: boolean;
  /** 视图切换：点卡片进对应视图（Doc-First §9.5.2 首页，Sprint-21 slice 3c）。 */
  onNavigate: (view: ActiveView) => void;
  /** 新建文档（复用 documents.handleCreateDocument，内部切 documents + isCreating）。 */
  onCreateDocument: () => void;
  /** 快速录入（复用 quickEntry.open）。 */
  onOpenQuickEntry: () => void;
  /** 新手清单进度（Sprint-25 L1）。 */
  onboardingSteps: OnboardingState['steps'];
  /** 新手清单条目：标记完成 + 直达对应视图（App 注入）。 */
  onOnboardingStep: (stepId: OnboardingStepId) => void;
}

/**
 * 欢迎引导页（Doc-First §9.5.2，Sprint-21 slice 3c）：登录后默认落地页。
 * 纯引导定位——欢迎语 + 功能卡片 + 轻指引，不带数据列表（嫌空再补最近文档）。
 * Sprint-25 L1：叠加新手清单（3 步）与「示例文档未建索引」提示。
 * ①（维护态）：新手清单提供「完成收起」与「× 关闭」，避免做完后仍固定占首页；
 * 关闭为会话内记忆（与 OnboardingGuide guideDismissed 同语义），不做持久化。
 */
export function WelcomeFeature({
  isBusy,
  onNavigate,
  onCreateDocument,
  onOpenQuickEntry,
  onboardingSteps,
  onOnboardingStep,
}: WelcomeFeatureProps) {
  const doneCount = ONBOARDING_STEPS.filter((step) => onboardingSteps[step.id] === true).length;
  const allDone = doneCount === ONBOARDING_STEPS.length;
  const [checklistClosed, setChecklistClosed] = useState(false);
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  // 完成即自动收起（allDone 时折叠成单行进度条，不占用主空间）。
  const collapsed = checklistCollapsed || allDone;

  const cards = (
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

      <button type="button" className="welcome-card" disabled={isBusy} onClick={() => onNavigate('tags')}>
        <span className="welcome-card-icon" aria-hidden="true">#</span>
        <span className="welcome-card-title">标签</span>
        <small>组织与筛选文档</small>
      </button>

      <button type="button" className="welcome-card" disabled={isBusy} onClick={() => onNavigate('timeline')}>
        <span className="welcome-card-icon" aria-hidden="true">⌁</span>
        <span className="welcome-card-title">时间线</span>
        <small>查看主题演进</small>
      </button>
    </div>
  );

  const checklistHeader = (
    <header>
      <strong>新手清单</strong>
      <span className="welcome-checklist-progress">
        {doneCount}/{ONBOARDING_STEPS.length} 已完成
      </span>
      <div className="welcome-checklist-tools">
        {collapsed && !checklistClosed ? (
          <button type="button" className="secondary" onClick={() => setChecklistCollapsed(false)}>
            展开
          </button>
        ) : null}
        {!checklistClosed ? (
          <button
            type="button"
            className="welcome-checklist-close"
            aria-label="关闭新手清单"
            title="关闭新手清单（本次会话）"
            onClick={() => setChecklistClosed(true)}
          >
            ×
          </button>
        ) : null}
      </div>
    </header>
  );

  return (
    <div className="welcome">
      <header className="welcome-header">
        <h1>欢迎来到 LUMEN</h1>
        <p>你的团队知识库已就绪。</p>
      </header>

      <aside className="welcome-notice" role="note">
        ⚠️ 系统示例文档<strong>未建索引</strong>，搜不到、问不到；只有你<strong>新建或导入</strong>的文档才会被搜索 / 问答命中。
      </aside>

      {!checklistClosed ? (
        <section className={`welcome-checklist${collapsed ? ' welcome-checklist-collapsed' : ''}`} aria-label="新手清单">
          {checklistHeader}
          {!collapsed ? (
            <ol>
              {ONBOARDING_STEPS.map((step) => {
                const done = onboardingSteps[step.id] === true;
                return (
                  <li key={step.id} className={done ? 'done' : ''}>
                    <button
                      type="button"
                      onClick={() => onOnboardingStep(step.id)}
                      disabled={isBusy || done}
                    >
                      <span className="check" aria-hidden="true">{done ? '✓' : '○'}</span>
                      <span>
                        <strong>{step.title}</strong>
                        <small>{step.description}</small>
                      </span>
                      {done ? null : <em>去完成 →</em>}
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </section>
      ) : null}

      {cards}

      <p className="welcome-hint">从顶部「☰」展开目录（Ctrl+B），或从卡片开始。</p>
    </div>
  );
}
