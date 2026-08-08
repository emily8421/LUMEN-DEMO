import type { AdminUserSpacesResult, AdminUserView, SpaceMemberRole, UserRole, UserStatus } from '../api';
import { UserSpacesDrawer } from './admin/UserSpacesDrawer';

type AdminUsersFeatureProps = {
  isBusy: boolean;
  users: AdminUserView[];
  filterQ: string;
  filterRole: string;
  filterStatus: string;
  onFilterQChange: (value: string) => void;
  onFilterRoleChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onRoleChange: (userId: number, role: UserRole) => void;
  onStatusToggle: (user: AdminUserView) => void;
  drawerUserId: number | null;
  drawerData: AdminUserSpacesResult | null;
  drawerBusy: boolean;
  drawerNotice: string;
  onOpenDrawer: (user: AdminUserView) => void;
  onCloseDrawer: () => void;
  onChangeSpaceRole: (spaceId: number, role: SpaceMemberRole) => void;
  onRemoveSpace: (spaceId: number) => void;
  onAddSpace: (spaceId: number, role: SpaceMemberRole) => void;
};

const STATUS_LABELS: Record<UserStatus, string> = { active: '正常', disabled: '已禁用' };

function formatDateTime(value: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}

/**
 * 用户管理页（REQ-046，Sprint-28）：admin 域列表 / 过滤 / 行内改角色 / 禁用开关（二次确认）。
 * 管理入口按全局角色显隐（TopBar 用户菜单）；后端强制鉴权兜底。
 *
 * REQ-050（维护态批5）：操作列加「空间」按钮 → 打开用户可访问空间抽屉（UserSpacesDrawer）。
 */
export function AdminUsersFeature({
  isBusy,
  users,
  filterQ,
  filterRole,
  filterStatus,
  onFilterQChange,
  onFilterRoleChange,
  onFilterStatusChange,
  onRoleChange,
  onStatusToggle,
  drawerUserId,
  drawerData,
  drawerBusy,
  drawerNotice,
  onOpenDrawer,
  onCloseDrawer,
  onChangeSpaceRole,
  onRemoveSpace,
  onAddSpace,
}: AdminUsersFeatureProps) {
  const drawerOpen = drawerUserId !== null;
  const drawerTarget = users.find((user) => user.id === drawerUserId);

  return (
    <section className="admin-users-panel focus-panel task-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>用户管理</h2>
        </div>
        <div className="toolbar-actions admin-users-filters">
          <input
            value={filterQ}
            onChange={(event) => onFilterQChange(event.target.value)}
            placeholder="搜索姓名 / 邮箱"
            aria-label="搜索用户"
          />
          <select
            value={filterRole}
            onChange={(event) => onFilterRoleChange(event.target.value)}
            aria-label="按角色过滤"
          >
            <option value="">全部角色</option>
            <option value="admin">管理员</option>
            <option value="member">成员</option>
          </select>
          <select
            value={filterStatus}
            onChange={(event) => onFilterStatusChange(event.target.value)}
            aria-label="按状态过滤"
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="disabled">已禁用</option>
          </select>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>暂无用户。</p>
        </div>
      ) : (
        <div className="admin-users-scroll">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email ?? '—'}</td>
                  <td>
                    <select
                      value={user.role}
                      disabled={isBusy}
                      onChange={(event) => onRoleChange(user.id, event.target.value as UserRole)}
                      aria-label={`${user.name} 全局角色`}
                    >
                      <option value="member">成员</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td>
                    <span className={`user-status-badge ${user.status}`}>
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td>{formatDateTime(user.last_login_at)}</td>
                  <td className="admin-user-actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={isBusy}
                      onClick={() => onOpenDrawer(user)}
                    >
                      空间
                    </button>
                    <button
                      type="button"
                      className={`secondary ${user.status === 'active' ? 'danger' : ''}`}
                      disabled={isBusy}
                      onClick={() => onStatusToggle(user)}
                    >
                      {user.status === 'active' ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserSpacesDrawer
        open={drawerOpen}
        targetName={drawerTarget?.name ?? ''}
        joined={drawerData?.joined ?? []}
        available={drawerData?.available ?? []}
        busy={drawerBusy}
        notice={drawerNotice}
        onChangeRole={onChangeSpaceRole}
        onRemove={onRemoveSpace}
        onAdd={onAddSpace}
        onClose={onCloseDrawer}
      />
    </section>
  );
}
