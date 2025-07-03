import axios from 'axios';
import { corsProxyService } from './corsProxy';

// 创建API客户端实例
const baseURL = process.env.REACT_APP_API_URL || 'https://ai-bookworm-backend.vercel.app';

const apiClient = axios.create({
  baseURL: corsProxyService.processUrl(baseURL),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default apiClient;

// 请求拦截器：添加token
apiClient.interceptors.request.use(
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
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 处理401错误（未授权）
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // 处理403错误（禁止访问）
      else if (error.response.status === 403) {
        console.error('没有权限访问此资源');
      }
      // 处理422错误（请求格式错误）
      else if (error.response.status === 422) {
        console.error('请求数据格式错误:', error.response.data);
      }
      // 处理500错误（服务器错误）
      else if (error.response.status === 500) {
        console.error('服务器错误:', error.response.data);
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('服务器无响应，请检查后端服务是否正常运行');
      return Promise.reject({ message: '服务器无响应，请检查后端服务是否正常运行' });
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
      return Promise.reject({ message: '请求配置错误' });
    }
  }
); 