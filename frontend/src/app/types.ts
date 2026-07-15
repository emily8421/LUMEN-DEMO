import type { DocumentPermission } from '../api';

export type Session = {
  token: string;
  userId: number;
  currentSpaceId: number;
};

export type ImportDraft = {
  title: string;
  permission: DocumentPermission;
};
