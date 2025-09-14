import apiClient from '@/lib/api-client';

export interface LoginRequest {
  login: string;
  password: string;
  two_fa_code?: string;
}

export interface LoginResponse {
  access_token: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', credentials);
    return response.data;
  },
};