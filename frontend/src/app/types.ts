import type { DocumentPermission, TermStatus } from '../api';

export type Session = {
  token: string;
  userId: number;
  currentSpaceId: number;
};

export type ImportDraft = {
  title: string;
  permission: DocumentPermission;
};

export type Draft = {
  title: string;
  content_md: string;
  permission: DocumentPermission;
};

export type TermDraft = {
  term: string;
  definition: string;
  aliases: string;
  status: TermStatus;
};
