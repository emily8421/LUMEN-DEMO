import { request } from './client';

export type LoginResponse = {
  token: string;
  user_id: number;
  current_space_id: number;
  /** Sprint-28（REQ-045）：全局角色，支撑前端管理入口显隐。 */
  role: 'admin' | 'member';
};

export type RegisterResponse = {
  user_id: number;
  name: string;
  email: string;
};

export type SessionInfo = {
  id: number;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  client_ua: string | null;
  client_ip: string | null;
  current: boolean;
};

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
