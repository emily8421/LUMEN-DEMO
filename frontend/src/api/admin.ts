import { request } from './client';
import type { SpaceMemberRole } from './spaceMembers';

export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'disabled';

export type AdminUserView = {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  last_login_at: string;
};

export type AdminUserFilters = {
  q?: string;
  role?: string;
  status?: string;
};

/** admin 域用户列表（API-044）：q 匹配 name/email，可按 role / status 过滤；仅全局 admin。 */
export async function listAdminUsers(token: string, filters: AdminUserFilters = {}): Promise<AdminUserView[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return request<AdminUserView[]>(`/api/admin/users${query ? `?${query}` : ''}`, { token });
}

/** 改全局角色 / 禁用启用（API-045）；禁用后登录 4030 且既有会话失效。 */
export async function updateAdminUser(
  token: string,
  userId: number,
  payload: { role?: UserRole; status?: UserStatus },
): Promise<AdminUserView> {
  return request<AdminUserView>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export type AdminUserSpaceView = {
  space_id: number;
  space_code: string;
  space_name: string;
  role: SpaceMemberRole;
  joined_at: string;
};

export type AdminUserSpaceAvailable = {
  space_id: number;
  space_code: string;
  space_name: string;
};

export type AdminUserSpacesResult = {
  joined: AdminUserSpaceView[];
  available: AdminUserSpaceAvailable[];
};

/** admin 查询用户已加入空间 + 可授予空间（API-054，REQ-050）。仅全局 admin。 */
export async function listAdminUserSpaces(token: string, userId: number): Promise<AdminUserSpacesResult> {
  return request<AdminUserSpacesResult>(`/api/admin/users/${userId}/spaces`, { token });
}
