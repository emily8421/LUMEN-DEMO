import type { components } from './generated';
import { request } from './client';
import type { SpaceMemberRole } from './spaceMembers';

// ── 混合接入（openapi codegen · Slice B-3）──
/** 全局角色 / 用户状态 —— 生成字段为裸 string，保留手写 union 保编译期 narrow。 */
export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'disabled';

/** AdminUserView —— 主体字段来自生成类型；role / status narrow 为手写 union。 */
export type AdminUserView = Omit<components['schemas']['AdminUserView'], 'role' | 'status'> & {
  role: UserRole;
  status: UserStatus;
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

/** 用户已加入空间条目（命名错位 AdminUserSpaceView↔AdminJoinedSpaceView）；role narrow 保 union。 */
export type AdminUserSpaceView = Omit<components['schemas']['AdminJoinedSpaceView'], 'role'> & {
  role: SpaceMemberRole;
};

/** 可授予空间条目（命名错位 AdminUserSpaceAvailable↔AdminAvailableSpaceView），零差异 alias。 */
export type AdminUserSpaceAvailable = components['schemas']['AdminAvailableSpaceView'];

/** joined 元素需 narrow，生成 AdminUserSpacesView 的 joined 是未 narrow 元素，嵌套 narrow。 */
export type AdminUserSpacesResult = Omit<components['schemas']['AdminUserSpacesView'], 'joined'> & {
  joined: AdminUserSpaceView[];
};

/** admin 查询用户已加入空间 + 可授予空间（API-054，REQ-050）。仅全局 admin。 */
export async function listAdminUserSpaces(token: string, userId: number): Promise<AdminUserSpacesResult> {
  return request<AdminUserSpacesResult>(`/api/admin/users/${userId}/spaces`, { token });
}
