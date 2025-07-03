import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/reminders`,
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

export interface Reminder {
  id: number;
  course_id: number;
  type: 'word' | 'text';
  item_id: number;
  next_review_date: string;
  review_count: number;
  created_at: string;
}

export interface CreateReminderData {
  course_id: number;
  type: 'word' | 'text';
  item_id: number;
  next_review_date: string;
}

export interface UpdateReminderData {
  next_review_date?: string;
  review_count?: number;
}

export const getReminders = async (courseId: number): Promise<Reminder[]> => {
  const response = await api.get(`/course/${courseId}`);
  return response.data;
};

export const createReminder = async (data: CreateReminderData): Promise<Reminder> => {
  const response = await api.post('/', data);
  return response.data;
};

export const updateReminder = async (id: number, data: UpdateReminderData): Promise<Reminder> => {
  const response = await api.put(`/${id}`, data);
  return response.data;
};

export const deleteReminder = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
}; 