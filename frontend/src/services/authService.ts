import apiClient from './apiClient';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export const login = async (data: LoginData) => {
  const response = await apiClient.post('/api/auth/login', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const register = async (data: RegisterData) => {
  const response = await apiClient.post('/api/auth/register', data);
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}; 