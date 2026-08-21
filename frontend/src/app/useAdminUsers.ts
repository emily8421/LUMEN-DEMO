import { useEffect, useState } from 'react';
import type { AdminUserSpacesResult, AdminUserView, UserRole } from '../api';
import type { SpaceMemberRole } from '../api';
import {
  addSpaceMember,
  listAdminUserSpaces,
  listAdminUsers,
  removeSpaceMember,
  updateAdminUser,
  updateSpaceMemberRole,
} from '../api';
import type { RunAction } from './types';

type UseAdminUsersArgs = {
  token: string | undefined;
  runAction: RunAction;
  setNotice: (message: string) => void;
};

/**
 * admin 域用户管理（REQ-046，Sprint-28）：列表 / 过滤 / 改全局角色 / 禁用启用。
 * 禁用二次确认（含影响说明）在 Feature 层 window.confirm；后端 4090/4220 错误经 runAction 上抛显示。
 *
 * REQ-050（维护态批5）：加用户可访问空间抽屉（API-054 读 joined+available；
 * 即时操作复用 space 域成员 API：改角色 / 移除 / 按 email 添加）。
 */
export function useAdminUsers({ token, runAction, setNotice }: UseAdminUsersArgs) {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [filterQ, setFilterQ] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [drawerUserId, setDrawerUserId] = useState<number | null>(null);
  const [drawerData, setDrawerData] = useState<AdminUserSpacesResult | null>(null);
  const [drawerBusy, setDrawerBusy] = useState(false);
  const [drawerNotice, setDrawerNotice] = useState('');

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

  // REQ-050 用户可访问空间抽屉（API-054 + space 域成员 API 复用，即时操作）
  const refreshDrawer = async (refreshToken: string, userId: number) => {
    try {
      const data = await listAdminUserSpaces(refreshToken, userId);
      setDrawerData(data);
    } catch {
      setDrawerData(null);
    }
  };

  const handleOpenDrawer = (user: AdminUserView) => {
    if (!token) {
      return;
    }
    setDrawerUserId(user.id);
    setDrawerData(null);
    setDrawerNotice('');
    void refreshDrawer(token, user.id);
  };

  const handleCloseDrawer = () => {
    setDrawerUserId(null);
    setDrawerData(null);
    setDrawerNotice('');
  };

  const runDrawerAction = async (label: string, action: () => Promise<void>) => {
    if (!token || drawerUserId === null) {
      return;
    }
    setDrawerBusy(true);
    setDrawerNotice('');
    try {
      await action();
      await refreshDrawer(token, drawerUserId);
    } catch (error) {
      setDrawerNotice(error instanceof Error ? error.message : `${label}失败`);
    } finally {
      setDrawerBusy(false);
    }
  };

  const handleChangeSpaceRole = (spaceId: number, role: SpaceMemberRole) => {
    if (!token || drawerUserId === null) {
      return;
    }
    void runDrawerAction('修改角色', async () => {
      await updateSpaceMemberRole(token, spaceId, drawerUserId, role);
      setDrawerNotice(`已更新角色：${role}`);
    });
  };

  const handleRemoveSpace = (spaceId: number) => {
    if (!token || drawerUserId === null) {
      return;
    }
    const space = drawerData?.joined.find((item) => item.space_id === spaceId);
    const confirmed = window.confirm(`确认从「${space?.space_name ?? '该空间'}」移除该用户？\n文档归属不变。`);
    if (!confirmed) {
      return;
    }
    void runDrawerAction('移除成员', async () => {
      await removeSpaceMember(token, spaceId, drawerUserId);
      setDrawerNotice('已移除');
    });
  };

  const handleAddSpace = (spaceId: number, role: SpaceMemberRole) => {
    if (!token || drawerUserId === null) {
      return;
    }
    const target = users.find((user) => user.id === drawerUserId);
    const targetEmail = target?.email;
    if (!targetEmail) {
      setDrawerNotice('无法添加：目标用户缺少 email');
      return;
    }
    void runDrawerAction('添加到空间', async () => {
      await addSpaceMember(token, spaceId, { email: targetEmail, role });
      setDrawerNotice(`已添加（角色：${role}）`);
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
    drawerUserId,
    drawerData,
    drawerBusy,
    drawerNotice,
    handleOpenDrawer,
    handleCloseDrawer,
    handleChangeSpaceRole,
    handleRemoveSpace,
    handleAddSpace,
  };
}
