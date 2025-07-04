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
    
    // 支持请求取消
    if (config.signal) {
      // 如果配置中已有signal，保持原有的
      return config;
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
    // 处理请求取消
    if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') {
      console.log('请求被取消:', error.message);
      return Promise.reject(error);
    }
    
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

// 导出支持取消的请求方法
export const createCancelableRequest = (abortController: AbortController) => {
  return {
    get: (url: string, config = {}) => 
      apiClient.get(url, { ...config, signal: abortController.signal }),
    post: (url: string, data = {}, config = {}) => 
      apiClient.post(url, data, { ...config, signal: abortController.signal }),
    put: (url: string, data = {}, config = {}) => 
      apiClient.put(url, data, { ...config, signal: abortController.signal }),
    delete: (url: string, config = {}) => 
      apiClient.delete(url, { ...config, signal: abortController.signal }),
  };
};

export default apiClient; 