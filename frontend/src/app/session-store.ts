import type { Session } from './types';

/** Demo 登录态 localStorage 持久化 + 登录失效识别（Sprint-12①）。 */

export const SESSION_STORAGE_KEY = 'lumen-demo-session';

export function loadStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.userId !== 'number' ||
      typeof parsed.currentSpaceId !== 'number' ||
      (parsed.role !== 'admin' && parsed.role !== 'member')
    ) {
      return null;
    }
    return {
      token: parsed.token,
      userId: parsed.userId,
      currentSpaceId: parsed.currentSpaceId,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function persistSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage 不可用（如隐私模式）时静默降级，登录态仅存内存
  }
}

export function clearStoredSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // 同上
  }
}

export function isAuthTokenError(message: string): boolean {
  return /invalid token|unauthorized|\b401\b/i.test(message);
}
