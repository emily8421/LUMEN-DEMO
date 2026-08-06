import { ONBOARDING_STEPS } from '../app/onboarding-store';
import type { OnboardingState, OnboardingStepId } from '../app/onboarding-store';

type OnboardingGuideProps = {
  isBusy: boolean;
  steps: OnboardingState['steps'];
  /** 标记步骤完成 + 直达对应视图（App 注入，含跳转逻辑）。 */
  onStep: (stepId: OnboardingStepId) => void;
  /** 跳过引导（标记全部完成）。 */
  onSkip: () => void;
  /** 关闭本次引导（未全部完成时下次登录重新弹）。 */
  onDismiss: () => void;
};

/**
 * 首次引导弹层（Sprint-25 / design/help-onboarding.md Flow-H-001）：
 * 登录后 3 步引导（新建文档 → 搜索 → 问答），每步「去完成」直达对应视图；
 * 可整体跳过；全部完成后不再弹出（localStorage `lumen-demo-onboarding`）。
 */
export function OnboardingGuide({ isBusy, steps, onStep, onSkip, onDismiss }: OnboardingGuideProps) {
  const doneCount = ONBOARDING_STEPS.filter((step) => steps[step.id] === true).length;

  const handleGo = (stepId: OnboardingStepId) => {
    onStep(stepId);
    onDismiss();
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="首次使用引导">
      <div className="onboarding-modal">
        <header className="onboarding-header">
          <h2>欢迎来到 LUMEN · 3 步上手</h2>
          <p>先完成第一篇「可被搜索」的文档，约 3 分钟。</p>
        </header>
        <ol className="onboarding-steps">
          {ONBOARDING_STEPS.map((step) => {
            const done = steps[step.id] === true;
            return (
              <li key={step.id} className={done ? 'onboarding-step done' : 'onboarding-step'}>
                <span className="onboarding-step-check" aria-hidden="true">
                  {done ? '✓' : String(ONBOARDING_STEPS.indexOf(step) + 1)}
                </span>
                <div className="onboarding-step-body">
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
                <button type="button" onClick={() => handleGo(step.id)} disabled={isBusy || done}>
                  {done ? '已完成' : '去完成'}
                </button>
              </li>
            );
          })}
        </ol>
        <footer className="onboarding-footer">
          <span>
            {doneCount}/{ONBOARDING_STEPS.length} 已完成
          </span>
          <button type="button" className="secondary" onClick={onSkip} disabled={isBusy}>
            跳过引导
          </button>
        </footer>
      </div>
    </div>
  );
}