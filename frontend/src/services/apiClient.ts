import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = process.env.REACT_APP_API_URL || API_BASE_URL;

console.log('ApiClient - API_URL:', API_URL);
console.log('ApiClient - 直接连接后端，不使用代理');

// 创建API客户端实例
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 请求拦截器：添加token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 处理401错误（未授权）
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // 处理其他错误
    console.error('API请求失败:', error);
    return Promise.reject(error);
  }
);

export default apiClient; 