import axios from 'axios';
import { User, Course, Word, CourseStats, Review, Practice } from '../types';
import { API_BASE_URL } from '../config';

const API_URL = process.env.REACT_APP_API_URL || API_BASE_URL;

console.log('API_URL 环境变量:', process.env.REACT_APP_API_URL);
console.log('实际使用的 API_URL:', API_URL);
console.log('直接连接后端，不使用代理');

// 创建axios实例
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

// 认证相关API
export const auth = {
    login: (email: string, password: string) =>
        api.post('/api/auth/login', { email, password }),
    
    register: (email: string, password: string, username: string) =>
        api.post('/api/auth/register', { email, password, username }),
    
    verifyToken: () =>
        api.get('/api/auth/verify'),
    
    logout: () =>
        api.post('/api/auth/logout'),
    
    getProfile: () =>
        api.get('/api/auth/profile'),
    
    updateProfile: (data: Partial<User>) =>
        api.put('/api/auth/profile', data),
    
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/api/auth/change-password', { currentPassword, newPassword }),
    
    resetPassword: (email: string) =>
        api.post('/api/auth/reset-password', { email }),
    
    verifyResetToken: (token: string) =>
        api.post('/api/auth/verify-reset-token', { token }),
    
    setNewPassword: (token: string, password: string) =>
        api.post('/api/auth/set-new-password', { token, password })
};

// 课程相关API
export const courses = {
    getAll: () =>
        api.get('/api/courses'),
    
    getById: (id: number) =>
        api.get(`/api/courses/${id}`),
    
    create: (data: Partial<Course>) =>
        api.post('/api/courses', data),
    
    update: (id: number, data: Partial<Course>) =>
        api.put(`/api/courses/${id}`, data),
    
    delete: (id: number) =>
        api.delete(`/api/courses/${id}`),
    
    getStats: (id: number) =>
        api.get(`/api/courses/${id}/stats`),
    
    getProgress: (id: number) =>
        api.get(`/api/courses/${id}/progress`),
    
    updateProgress: (id: number, data: any) =>
        api.put(`/api/courses/${id}/progress`, data),
    
    export: (id: number) =>
        api.get(`/api/courses/${id}/export`),
    
    import: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/courses/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

// 单词相关API
export const words = {
    getAll: (courseId: number) =>
        api.get(`/api/words?course_id=${courseId}`),
    
    getById: (id: number) =>
        api.get(`/api/words/${id}`),
    
    create: (data: Partial<Word>) =>
        api.post('/api/words', data),
    
    update: (id: number, data: Partial<Word>) =>
        api.put(`/api/words/${id}`, data),
    
    delete: (id: number) =>
        api.delete(`/api/words/${id}`),
    
    practice: (courseId: number, type: string) =>
        api.get(`/api/words/practice?course_id=${courseId}&type=${type}`),
    
    submitPractice: (data: any) =>
        api.post('/api/words/practice', data),
    
    getStats: (courseId: number) =>
        api.get(`/api/words/stats?course_id=${courseId}`),
    
    batchImport: (courseId: number, words: any[]) =>
        api.post('/api/words/batch', { course_id: courseId, words }),
    
    search: (query: string, courseId?: number) =>
        api.get(`/api/words/search?q=${query}${courseId ? `&course_id=${courseId}` : ''}`),
    
    getRecentlyAdded: (courseId: number, limit: number = 10) =>
        api.get(`/api/words/recent?course_id=${courseId}&limit=${limit}`)
};

// 文本相关API
export const texts = {
    getAll: (courseId: number) =>
        api.get(`/api/texts?course_id=${courseId}`),
    
    getById: (id: number) =>
        api.get(`/api/texts/${id}`),
    
    create: (data: any) =>
        api.post('/api/texts', data),
    
    update: (id: number, data: any) =>
        api.put(`/api/texts/${id}`, data),
    
    delete: (id: number) =>
        api.delete(`/api/texts/${id}`),
    
    practice: (courseId: number) =>
        api.get(`/api/texts/practice?course_id=${courseId}`),
    
    submitPractice: (data: any) =>
        api.post('/api/texts/practice', data),
    
    getStats: (courseId: number) =>
        api.get(`/api/texts/stats?course_id=${courseId}`)
};

// 复习相关API
export const reviews = {
    getAll: (courseId?: number) =>
        api.get(`/api/reviews${courseId ? `?course_id=${courseId}` : ''}`),
    
    getById: (id: number) =>
        api.get(`/api/reviews/${id}`),
    
    create: (data: Partial<Review>) =>
        api.post('/api/reviews', data),
    
    update: (id: number, data: Partial<Review>) =>
        api.put(`/api/reviews/${id}`, data),
    
    delete: (id: number) =>
        api.delete(`/api/reviews/${id}`),
    
    getDue: () =>
        api.get('/api/reviews/due'),
    
    getCalendar: (year: number, month: number) =>
        api.get(`/api/reviews/calendar?year=${year}&month=${month}`),
    
    getStats: (courseId?: number) =>
        api.get(`/api/reviews/stats${courseId ? `?course_id=${courseId}` : ''}`),
    
    complete: (id: number, data: any) =>
        api.post(`/api/reviews/${id}/complete`, data)
};

// 练习相关API
export const practices = {
    getAll: (courseId?: number) =>
        api.get(`/api/practices${courseId ? `?course_id=${courseId}` : ''}`),
    
    getById: (id: number) =>
        api.get(`/api/practices/${id}`),
    
    create: (data: Partial<Practice>) =>
        api.post('/api/practices', data),
    
    update: (id: number, data: Partial<Practice>) =>
        api.put(`/api/practices/${id}`, data),
    
    delete: (id: number) =>
        api.delete(`/api/practices/${id}`),
    
    start: (courseId: number, type: string) =>
        api.post('/api/practices/start', { course_id: courseId, type }),
    
    submit: (id: number, data: any) =>
        api.post(`/api/practices/${id}/submit`, data),
    
    getStats: (courseId?: number) =>
        api.get(`/api/practices/stats${courseId ? `?course_id=${courseId}` : ''}`),
    
    getHistory: (courseId?: number) =>
        api.get(`/api/practices/history${courseId ? `?course_id=${courseId}` : ''}`)
};

// 提醒相关API
export const reminders = {
    getAll: () =>
        api.get('/api/reminders'),
    
    getById: (id: number) =>
        api.get(`/api/reminders/${id}`),
    
    create: (data: any) =>
        api.post('/api/reminders', data),
    
    update: (id: number, data: any) =>
        api.put(`/api/reminders/${id}`, data),
    
    delete: (id: number) =>
        api.delete(`/api/reminders/${id}`),
    
    markAsRead: (id: number) =>
        api.patch(`/api/reminders/${id}/read`),
    
    getUnread: () =>
        api.get('/api/reminders/unread')
};

// OCR相关API
export const ocr = {
    recognizeText: (imageFile: File) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        return api.post('/api/ocr/recognize', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    extractWords: (text: string) =>
        api.post('/api/ocr/extract-words', { text }),
    
    processImage: (imageFile: File) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        return api.post('/api/ocr/process', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

// 语音相关API
export const speech = {
    synthesize: (text: string, language: string = 'en') =>
        api.post('/api/speech/synthesize', { text, language }),
    
    recognize: (audioFile: File) => {
        const formData = new FormData();
        formData.append('audio', audioFile);
        return api.post('/api/speech/recognize', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

// 导入导出相关API
export const importExport = {
    importWords: (courseId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/courses/${courseId}/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    exportWords: (courseId: number) => 
        api.get(`/api/courses/${courseId}/export`, { responseType: 'blob' }),
    
    getWordTemplate: () => 
        api.get('/api/words/template', { responseType: 'blob' })
};

// 默认导出
export default api; 