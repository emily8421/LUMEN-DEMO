import type { ActiveView } from './WorkspaceViewNav';

/** 首次引导（Sprint-25 / design/help-onboarding.md Flow-H-001）：3 步 + 新手清单。 */
export const ONBOARDING_STORAGE_KEY = 'lumen-demo-onboarding';

export type OnboardingStepId = 'create' | 'search' | 'query';

export type OnboardingState = {
  completed: boolean;
  steps: Partial<Record<OnboardingStepId, boolean>>;
};

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  /** 步骤「去完成」要跳转的视图。 */
  view: ActiveView;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'create',
    title: '新建一篇文档',
    description: '到「文档」视图点「新建」，保存后自动切块 + 建索引',
    view: 'documents',
  },
  {
    id: 'search',
    title: '保存后去搜索',
    description: '切到「搜索」视图输入关键词，验证文档能命中',
    view: 'search',
  },
  {
    id: 'query',
    title: '去问答提问',
    description: '切到「问答」视图提问，答案会带来源',
    view: 'query',
  },
];

const EMPTY_STATE: OnboardingState = { completed: false, steps: {} };

export function loadOnboardingState(): OnboardingState {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    if (typeof parsed.completed !== 'boolean' || typeof parsed.steps !== 'object' || parsed.steps === null) {
      return EMPTY_STATE;
    }
    return { completed: parsed.completed, steps: parsed.steps };
  } catch {
    // localStorage 不可用（如隐私模式）时降级为未完成，引导可跳过、不阻塞主流程
    return EMPTY_STATE;
  }
}

export function persistOnboardingState(state: OnboardingState): void {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 同上：不可用时静默降级，本次会话内仍生效
  }
}

export function isOnboardingDone(state: OnboardingState): boolean {
  return state.completed || ONBOARDING_STEPS.every((step) => state.steps[step.id] === true);
}