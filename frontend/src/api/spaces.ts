import type { components } from './generated';
import { request } from './client';

// ── 混合接入（openapi codegen · Slice B-3）──
// Space 与生成 SpaceView 零差异（命名错位 Space↔SpaceView），直接 alias。
export type Space = components['schemas']['SpaceView'];

export async function listSpaces(token: string): Promise<Space[]> {
  return request<Space[]>('/api/spaces', { token });
}

// 切换响应与生成 SwitchSpaceView 零差异（current_space_id 后端本就非 null），直接 alias。
export async function switchSpace(
  token: string,
  spaceId: number,
): Promise<components['schemas']['SwitchSpaceView']> {
  return request('/api/spaces/switch', {
    method: 'POST',
    token,
    body: JSON.stringify({ space_id: spaceId }),
  });
}
