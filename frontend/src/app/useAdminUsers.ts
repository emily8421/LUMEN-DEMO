import { useEffect, useState } from 'react';
import type { AdminUserView, UserRole } from '../api';
import { listAdminUsers, updateAdminUser } from '../api';

type RunAction = (progressMessage: string, action: () => Promise<void>) => Promise<void>;

type UseAdminUsersArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/**
 * admin 域用户管理（REQ-046，Sprint-28）：列表 / 过滤 / 改全局角色 / 禁用启用。
 * 禁用二次确认（含影响说明）在 Feature 层 window.confirm；后端 4090/4220 错误经 runAction 上抛显示。
 */
export function useAdminUsers({ token, runAction, setNotice }: UseAdminUsersArgs) {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [filterQ, setFilterQ] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!token) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    listAdminUsers(token, { q: filterQ, role: filterRole, status: filterStatus })
      .then((rows) => {
        if (!cancelled) {
          setUsers(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsers([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, filterQ, filterRole, filterStatus]);

  const reloadUsers = async (refreshToken: string) => {
    setUsers(await listAdminUsers(refreshToken, { q: filterQ, role: filterRole, status: filterStatus }));
  };

  const handleRoleChange = (userId: number, role: UserRole) => {
    if (!token) {
      return;
    }
    void runAction('正在修改全局角色...', async () => {
      const updated = await updateAdminUser(token, userId, { role });
      setUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)));
      setNotice(`已将 ${updated.name} 的全局角色改为 ${role}`);
    });
  };

  const handleStatusToggle = (user: AdminUserView) => {
    if (!token) {
      return;
    }
    const disabling = user.status === 'active';
    if (disabling) {
      const confirmed = window.confirm(
        `确认禁用 ${user.name}（${user.email ?? '无邮箱'}）？\n该用户将无法登录，文档保留不删除。`,
      );
      if (!confirmed) {
        return;
      }
    }
    void runAction(disabling ? '正在禁用账号...' : '正在启用账号...', async () => {
      const updated = await updateAdminUser(token, user.id, { status: disabling ? 'disabled' : 'active' });
      setUsers((prev) => prev.map((row) => (row.id === user.id ? updated : row)));
      setNotice(disabling ? `已禁用：${updated.name}` : `已启用：${updated.name}`);
    });
  };

  return {
    users,
    filterQ,
    setFilterQ,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    handleRoleChange,
    handleStatusToggle,
    reloadUsers,
  };
}
