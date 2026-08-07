import type { FormEvent } from 'react';
import type { SpaceMemberRole, SpaceMemberView, UserSearchResult } from '../api';

type MembersFeatureProps = {
  isBusy: boolean;
  spaceName: string;
  members: SpaceMemberView[];
  canManageMembers: boolean;
  searchQuery: string;
  searchResults: UserSearchResult[];
  addEmail: string;
  addRole: SpaceMemberRole;
  onSearchQueryChange: (value: string) => void;
  onAddEmailChange: (value: string) => void;
  onAddRoleChange: (role: SpaceMemberRole) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onRoleChange: (userId: number, role: SpaceMemberRole) => void;
  onRemove: (userId: number) => void;
};

const ROLE_LABELS: Record<SpaceMemberRole, string> = { admin: '空间管理员', member: '成员' };

function formatJoinedAt(value: string): string {
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
 * 空间设置成员管理（REQ-047，Sprint-28）：email 搜索添加 / 行内改角色 / 移除（确认弹窗）。
 * 仅空间 admin（或全局 admin，C-ROLE-007）显示管理控件；普通成员无入口。
 */
export function MembersFeature({
  isBusy,
  spaceName,
  members,
  canManageMembers,
  searchQuery,
  searchResults,
  addEmail,
  addRole,
  onSearchQueryChange,
  onAddEmailChange,
  onAddRoleChange,
  onAdd,
  onRoleChange,
  onRemove,
}: MembersFeatureProps) {
  return (
    <section className="members-panel focus-panel task-workspace">
      <div className="workspace-toolbar">
        <div className="view-title">
          <h2>空间成员</h2>
          {spaceName ? <span className="view-subtitle">{spaceName}</span> : null}
        </div>
      </div>

      {canManageMembers ? (
        <form className="member-add-form" onSubmit={onAdd}>
          <div className="member-search-wrap">
            <input
              value={searchQuery}
              onChange={(event) => {
                onSearchQueryChange(event.target.value);
                onAddEmailChange(event.target.value);
              }}
              placeholder="按邮箱搜索用户（≥2 字符）"
              aria-label="搜索用户邮箱"
            />
            {searchResults.length > 0 ? (
              <ul className="member-search-results" role="listbox" aria-label="搜索结果">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onAddEmailChange(result.email ?? '');
                        onSearchQueryChange(result.email ?? '');
                      }}
                    >
                      <strong>{result.name}</strong>
                      <small>{result.email}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <select
            value={addRole}
            onChange={(event) => onAddRoleChange(event.target.value as SpaceMemberRole)}
            aria-label="新成员空间角色"
          >
            <option value="member">成员</option>
            <option value="admin">空间管理员</option>
          </select>
          <button type="submit" className="secondary" disabled={isBusy || addEmail.trim().length === 0}>
            添加
          </button>
        </form>
      ) : null}

      {members.length === 0 ? (
        <div className="empty-state">
          <p>暂无成员。</p>
        </div>
      ) : (
        <div className="members-scroll">
          <table className="members-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>邮箱</th>
                <th>空间角色</th>
                <th>加入时间</th>
                {canManageMembers ? <th>操作</th> : null}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.user_id}>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.email ?? '—'}</td>
                  <td>
                    {canManageMembers ? (
                      <select
                        value={member.role}
                        disabled={isBusy}
                        onChange={(event) => onRoleChange(member.user_id, event.target.value as SpaceMemberRole)}
                        aria-label={`${member.name} 空间角色`}
                      >
                        <option value="member">成员</option>
                        <option value="admin">空间管理员</option>
                      </select>
                    ) : (
                      ROLE_LABELS[member.role]
                    )}
                  </td>
                  <td>{formatJoinedAt(member.joined_at)}</td>
                  {canManageMembers ? (
                    <td>
                      <button
                        type="button"
                        className="secondary danger"
                        disabled={isBusy}
                        onClick={() => onRemove(member.user_id)}
                      >
                        移除
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
