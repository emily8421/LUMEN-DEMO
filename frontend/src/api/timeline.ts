import type { components } from './generated';
import type { DocumentPermission } from './documents';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-1）──
/** Timeline event_type / window —— openapi 裸 string，保留手写 union 保 narrow。 */
export type TimelineEventType = 'created' | 'updated' | 'tagged' | 'linked';
export type TimelineWindow = 'day' | 'week';

/** 主体字段来自生成类型；event_type / permission narrow 为手写 union。 */
export type TimelineEvent = Omit<components['schemas']['TimelineEventView'], 'event_type' | 'permission'> & {
  event_type: TimelineEventType;
  permission: DocumentPermission;
};

/** 主体字段来自生成类型；level narrow 为数字字面量 0|1|2|3。 */
export type TimelineDensityWindow = Omit<components['schemas']['TimelineDensityView'], 'level'> & {
  level: 0 | 1 | 2 | 3;
};

/**
 * TimelineResponse —— alias 生成 TimelineView + items/density/window narrow
 *（嵌套元素用上面的 narrow 版本，window 保 TimelineWindow union）。
 */
export type TimelineResponse = Omit<components['schemas']['TimelineView'], 'items' | 'density' | 'window'> & {
  items: TimelineEvent[];
  density: TimelineDensityWindow[];
  window: TimelineWindow;
};

// 请求参数（前端组装）手写保留。
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
