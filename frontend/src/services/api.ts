import axios from 'axios';
import { User, Course, Word, CourseStats, Review, Practice } from '../types';
import { corsProxyService } from './corsProxy';

const API_URL = process.env.REACT_APP_API_URL || 'https://ai-bookworm-backend.vercel.app';

console.log('API_URL 环境变量:', process.env.REACT_APP_API_URL);
console.log('实际使用的 API_URL:', API_URL);
console.log('CORS代理状态:', corsProxyService.getStatus());

const api = axios.create({
    baseURL: corsProxyService.processUrl(API_URL),
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
        
        // 应用代理配置到请求头
        config = corsProxyService.processRequestConfig(config);
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => response,
    (error) => {
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
        api.post<{ token: string; user: User }>('/api/auth/login', { email, password }),
    
    register: (email: string, password: string, username: string) =>
        api.post<{ token: string; user: User }>('/api/auth/register', { email, password, username }),
    
    verifyToken: () =>
        api.get<User>('/api/auth/verify'),
    
    logout: () =>
        api.post('/api/auth/logout'),
    
    updateProfile: (data: Partial<User>) =>
        api.put<User>('/api/auth/profile', data),
    
    changePassword: (oldPassword: string, newPassword: string) =>
        api.put('/api/auth/password', { oldPassword, newPassword })
};

// 课程相关API
export const courses = {
    getAll: () => api.get('/api/courses'),
    
    getById: (id: number) => api.get(`/api/courses/${id}`),
    
    create: (data: { name: string; description: string }) => api.post('/api/courses', data),
    
    update: (id: number, data: { name: string; description: string }) => api.put(`/api/courses/${id}`, data),
    
    delete: (id: number) => api.delete(`/api/courses/${id}`),
    
    getStats: (id: number) => api.get(`/api/courses/${id}/stats`)
};

// 单词相关API
export const words = {
    getAll: (courseId: number) => api.get(`/api/courses/${courseId}/words`),
    
    getById: (courseId: number, wordId: number) => api.get(`/api/courses/${courseId}/words/${wordId}`),
    
    create: (data: { word: string; meaning: string; example: string; pronunciation: string; course_id: number }) =>
        api.post('/api/words', data),
    
    update: (id: number, data: { word: string; meaning: string; example: string; pronunciation: string; course_id: number }) =>
        api.put(`/api/words/${id}`, data),
    
    delete: (id: number) => api.delete(`/api/words/${id}`),
    
    getReviewWords: (courseId: number) => api.get(`/api/courses/${courseId}/review`),
    
    getPracticeWords: (courseId: number) => api.get(`/api/courses/${courseId}/practice`),
    
    submitReview: (wordId: number, quality: number) => api.post(`/api/words/${wordId}/review`, { quality }),
    
    checkPractice: (wordId: number, answer: string) => api.post(`/api/words/${wordId}/practice`, { answer })
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
    
    exportWords: (courseId: number) => api.get(`/api/courses/${courseId}/export`, { responseType: 'blob' }),
    
    getWordTemplate: () => api.get('/api/words/template', { responseType: 'blob' })
}; 