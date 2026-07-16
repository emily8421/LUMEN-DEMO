import { request } from './client';

export type LoginResponse = {
  token: string;
  user_id: number;
  current_space_id: number;
};

export async function login(username: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ external_id: username }),
  });
}
