import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = process.env.REACT_APP_API_URL || API_BASE_URL;

// 创建axios实例，与课程API保持一致
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface TextRecitation {
  id: number;
  content: string;
  createTime: string;
}

export interface RecitationResult {
  recited_text: string;
  original_text: string;
  score: number;
  similarity: number;
}

export const textRecitationService = {
  // 上传图片并识别文字
  uploadImage: async (file: File): Promise<TextRecitation> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/api/text-recitation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 获取课文列表
  getTextList: async (): Promise<TextRecitation[]> => {
    const response = await api.get('/api/text-recitation');
    return response.data;
  },

  // 删除课文
  deleteText: async (id: number): Promise<void> => {
    await api.delete(`/api/text-recitation/${id}`);
  },

  // 更新课文
  updateText: async (id: number, content: string): Promise<TextRecitation> => {
    const response = await api.put(`/api/text-recitation/${id}`, { content });
    return response.data;
  },

  // 提交语音背诵
  submitRecitation: async (id: number, audioBlob: Blob): Promise<RecitationResult> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recitation.wav');
    
    const response = await api.post(`/api/text-recitation/${id}/recite`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 获取成绩历史
  getScores: async (id: number): Promise<{
    current_score: number | null;
    best_score: number | null;
    history: Array<{ score: number; date: string }>;
  }> => {
    const response = await api.get(`/api/text-recitation/${id}/scores`);
    return response.data;
  },
}; 