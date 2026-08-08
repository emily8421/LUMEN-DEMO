import type { DocumentPermission } from '../api';

export const permissionLabels: Record<DocumentPermission, string> = {
  private: '私有',
  team: '团队共享',
  external: '外部只读',
};
