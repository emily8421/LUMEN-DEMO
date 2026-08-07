import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { SpaceMemberRole, SpaceMemberView, UserRole, UserSearchResult } from '../api';
import {
  addSpaceMember,
  listSpaceMembers,
  removeSpaceMember,
  searchUsers,
  updateSpaceMemberRole,
} from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseSpaceMembersArgs = {
  token: string | undefined;
  currentSpaceId: number | undefined;
  currentUserId: number | undefined;
  /** 当前用户全局角色；admin 对任意空间成员管理同权（C-ROLE-007）。 */
  globalRole: UserRole;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/**
 * space 域成员管理（REQ-047，Sprint-28）：成员列表 / email 搜索添加 / 改空间角色 / 移除。
 * 管理入口按 canManageMembers 显隐（空间 admin 或全局 admin）；后端强制鉴权（4030）。
 */
export function useSpaceMembers({
  token,
  currentSpaceId,
  currentUserId,
  globalRole,
  runAction,
  setNotice,
}: UseSpaceMembersArgs) {
  const [members, setMembers] = useState<SpaceMemberView[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<SpaceMemberRole>('member');

  const myRole = members.find((member) => member.user_id === currentUserId)?.role ?? null;
  const canManageMembers = globalRole === 'admin' || myRole === 'admin';

  useEffect(() => {
    if (!token || !currentSpaceId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    listSpaceMembers(token, currentSpaceId)
      .then((rows) => {
        if (!cancelled) {
          setMembers(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentSpaceId]);

  const reloadMembers = async (refreshToken: string, spaceId: number) => {
    setMembers(await listSpaceMembers(refreshToken, spaceId));
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    const query = value.trim();
    if (!token || query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchUsers(token, query)
      .then(setSearchResults)
      .catch(() => setSearchResults([]));
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !currentSpaceId) {
      return;
    }
    const email = addEmail.trim();
    if (!email) {
      return;
    }
    void runAction('正在添加成员...', async () => {
      const added = await addSpaceMember(token, currentSpaceId, { email, role: addRole });
      setMembers((prev) =>
        [...prev, added].sort((a, b) => a.joined_at.localeCompare(b.joined_at) || a.user_id - b.user_id),
      );
      setAddEmail('');
      setSearchQuery('');
      setSearchResults([]);
      setNotice(`已添加成员：${added.name}（${email}，${added.role}）`);
    });
  };

  const handleRoleChange = (userId: number, role: SpaceMemberRole) => {
    if (!token || !currentSpaceId) {
      return;
    }
    void runAction('正在修改成员角色...', async () => {
      const updated = await updateSpaceMemberRole(token, currentSpaceId, userId, role);
      setMembers((prev) => prev.map((member) => (member.user_id === userId ? updated : member)));
      setNotice(`已将 ${updated.name} 的空间角色改为 ${role}`);
    });
  };

  const handleRemove = (userId: number) => {
    if (!token || !currentSpaceId) {
      return;
    }
    const target = members.find((member) => member.user_id === userId);
    if (!target) {
      return;
    }
    const confirmed = window.confirm(
      `确认移除成员 ${target.name}（${target.email ?? '无邮箱'}）？\n移除后将失去该空间访问，文档归属不变。`,
    );
    if (!confirmed) {
      return;
    }
    void runAction('正在移除成员...', async () => {
      await removeSpaceMember(token, currentSpaceId, userId);
      setMembers((prev) => prev.filter((member) => member.user_id !== userId));
      setNotice(`已移除成员：${target.name}`);
    });
  };

  return {
    members,
    canManageMembers,
    searchQuery,
    searchResults,
    addEmail,
    addRole,
    setAddEmail,
    setAddRole,
    handleSearchQueryChange,
    handleAdd,
    handleRoleChange,
    handleRemove,
    reloadMembers,
  };
}
