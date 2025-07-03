import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/progress`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，自动添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface WordProgress {
  id: number;
  word: string;
  mastery: number;
  next_review: string;
}

export interface TextProgress {
  id: number;
  title: string;
  mastery: number;
  next_review: string;
}

export interface ProgressData {
  word_mastery: number;
  text_mastery: number;
  study_days: number;
  word_progress: WordProgress[];
  text_progress: TextProgress[];
}

export const getProgress = async (courseId: number): Promise<ProgressData> => {
  const response = await api.get(`/course/${courseId}`);
  return response.data;
}; 