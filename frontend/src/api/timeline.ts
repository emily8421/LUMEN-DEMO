import type { DocumentPermission } from './documents';
import { request } from './client';

export type TimelineEventType = 'created' | 'updated' | 'tagged' | 'linked';
export type TimelineWindow = 'day' | 'week';

export type TimelineEvent = {
  date: string;
  document_id: number;
  title: string;
  event_type: TimelineEventType;
  permission: DocumentPermission;
  actor: number | null;
};

export type TimelineDensityWindow = {
  window_start: string;
  window_end: string;
  event_count: number;
  level: 0 | 1 | 2 | 3;
  ratio: number;
};

export type TimelineResponse = {
  items: TimelineEvent[];
  density: TimelineDensityWindow[];
  degraded: boolean;
  window: TimelineWindow;
};

export type TimelineQueryParams = {
  q?: string;
  tagIds?: number[];
  from?: string;
  to?: string;
  density?: boolean;
};

export async function getTimeline(
  token: string,
  spaceId: number,
  params: TimelineQueryParams = {},
): Promise<TimelineResponse> {
  const query = new URLSearchParams();
  if (params.q?.trim()) {
    query.set('q', params.q.trim());
  }
  if (params.from) {
    query.set('from', params.from);
  }
  if (params.to) {
    query.set('to', params.to);
  }
  if (params.density !== undefined) {
    query.set('density', String(params.density));
  }
  for (const tagId of params.tagIds ?? []) {
    query.append('tag_ids', String(tagId));
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<TimelineResponse>(`/api/spaces/${spaceId}/timeline${suffix}`, { token });
}
