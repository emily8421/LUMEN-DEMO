import { request } from './client';

export type Space = {
  id: number;
  code: string;
  name: string;
};

export async function listSpaces(token: string): Promise<Space[]> {
  return request<Space[]>('/api/spaces', { token });
}

export async function switchSpace(token: string, spaceId: number): Promise<{ token: string; current_space_id: number }> {
  return request<{ token: string; current_space_id: number }>('/api/spaces/switch', {
    method: 'POST',
    token,
    body: JSON.stringify({ space_id: spaceId }),
  });
}
