import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Text {
  id: number;
  title: string;
  content: string;
  translation: string;
  difficulty: number;
  created_at?: string;
}

export interface CreateTextData {
  title: string;
  content: string;
  translation: string;
  difficulty: number;
}

export interface UpdateTextData {
  title?: string;
  content?: string;
  translation?: string;
  difficulty?: number;
}

export interface PracticeResponse {
  is_correct: boolean;
  correct_translation: string;
}

export const getTexts = async (courseId: number): Promise<Text[]> => {
  const response = await api.get(`/courses/${courseId}/texts`);
  return response.data;
};

export const getText = async (id: number): Promise<Text> => {
  const response = await api.get(`/texts/${id}`);
  return response.data;
};

export const createText = async (courseId: number, data: CreateTextData): Promise<Text> => {
  const response = await api.post(`/courses/${courseId}/texts`, data);
  return response.data;
};

export const updateText = async (id: number, data: UpdateTextData): Promise<Text> => {
  const response = await api.put(`/texts/${id}`, data);
  return response.data;
};

export const deleteText = async (id: number): Promise<void> => {
  await api.delete(`/texts/${id}`);
};

export const getTextPractice = async (courseId: number): Promise<Text> => {
  const response = await api.get(`/courses/${courseId}/practice/text`);
  return response.data;
};

export const submitTextPractice = async (textId: number, answer: string): Promise<PracticeResponse> => {
  const response = await api.post(`/texts/${textId}/practice`, { answer });
  return response.data;
}; 