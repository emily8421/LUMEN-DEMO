import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-3）──
/**
 * LoginResponse —— 主体字段来自生成 LoginView（命名错位 Response↔View）。
 * `current_space_id` 生成 `number|null`（后端 schema 宽口径），narrow 为 `number`：
 * 运行时哨兵——注册即建个人空间（C-AUTH-001），登录用户必有当前空间；
 * 与 `Session.currentSpaceId` / session-store 校验对齐。
 * `role` 生成裸 string，narrow 保 union（Sprint-28 REQ-045，支撑管理入口显隐）。
 */
export type LoginResponse = Omit<components['schemas']['LoginView'], 'current_space_id' | 'role'> & {
  current_space_id: number;
  role: 'admin' | 'member';
};

/**
 * RegisterResponse —— 主体字段来自生成 RegisterView（命名错位）。
 * `email` 生成 `string|null`，narrow 为 `string`：注册入参 email 必填，运行时必有值
 * （useSession 注册后拿 created.email 自动转登录）。
 */
export type RegisterResponse = Omit<components['schemas']['RegisterView'], 'email'> & {
  email: string;
};

/** 多设备会话条目（REQ-042），与生成 SessionView 零差异，直接 alias。 */
export type SessionInfo = components['schemas']['SessionView'];

/** 凭证登录（Sprint-26，REQ-041）：login_id 支持 email 或 external_id；demo 模式可空密码。 */
export async function login(loginId: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login_id: loginId, password }),
  });
}

/** 注册（REQ-040）：建用户 + 默认个人空间；注册成功后前端自动转登录。 */
export async function register(email: string, name: string, password: string): Promise<RegisterResponse> {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });
}

/** 登出（REQ-042）：撤销当前会话。 */
export async function logout(token: string): Promise<void> {
  await request<null>('/api/auth/logout', { method: 'POST', token });
}

/** 多设备会话列表（REQ-042）。 */
export async function listSessions(token: string): Promise<SessionInfo[]> {
  return request<SessionInfo[]>('/api/auth/sessions', { token });
}

/** 撤销指定会话（REQ-042，owner）。 */
export async function revokeSession(token: string, sessionId: number): Promise<void> {
  await request<null>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE', token });
}

/** 忘记密码申请（REQ-051，API-055）：恒响应防枚举；demo 模式 token 写后端日志（无 SMTP 降级）。 */
export async function requestPasswordReset(email: string): Promise<components['schemas']['PasswordResetMessageView']> {
  return request('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** 忘记密码确认（REQ-051，API-056）：token + 新密码；失败（token 无效/过期/已用、密码不合规）抛 Error。 */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await request<null>('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}
