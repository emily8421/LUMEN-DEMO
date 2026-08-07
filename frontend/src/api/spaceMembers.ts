import { request } from './client';

export type SpaceMemberRole = 'admin' | 'member';

export type SpaceMemberView = {
  user_id: number;
  name: string;
  email: string | null;
  role: SpaceMemberRole;
  joined_at: string;
};

export type UserSearchResult = {
  id: number;
  name: string;
  email: string | null;
};

/** 空间成员列表（API-046）：空间成员可读。 */
export async function listSpaceMembers(token: string, spaceId: number): Promise<SpaceMemberView[]> {
  return request<SpaceMemberView[]>(`/api/spaces/${spaceId}/members`, { token });
}

/** 按 email 添加成员（API-047）：用户不存在 4004 / 已是成员 4090。 */
export async function addSpaceMember(
  token: string,
  spaceId: number,
  payload: { email: string; role?: SpaceMemberRole },
): Promise<SpaceMemberView> {
  return request<SpaceMemberView>(`/api/spaces/${spaceId}/members`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

/** 改空间角色（API-048）：最后一个空间 admin 降级 4090。 */
export async function updateSpaceMemberRole(
  token: string,
  spaceId: number,
  userId: number,
  role: SpaceMemberRole,
): Promise<SpaceMemberView> {
  return request<SpaceMemberView>(`/api/spaces/${spaceId}/members/${userId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ role }),
  });
}

/** 移除成员（API-049）：文档归属不变；最后一个空间 admin 4090。 */
export async function removeSpaceMember(token: string, spaceId: number, userId: number): Promise<void> {
  await request<null>(`/api/spaces/${spaceId}/members/${userId}`, { method: 'DELETE', token });
}

/** 成员添加时用户搜索（API-050）：空间 admin 或全局 admin；返回最小字段。 */
export async function searchUsers(token: string, q: string): Promise<UserSearchResult[]> {
  const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return request<UserSearchResult[]>(`/api/users/search${query}`, { token });
}
