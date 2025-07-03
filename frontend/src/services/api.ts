import axios from 'axios';
import { User, Course, Word, CourseStats, Review, Practice } from '../types';
import { 
  API_BASE_URL, 
  CORS_PROXY_CONFIG, 
  getCurrentProxyUrl, 
  switchToNextProxy, 
  resetProxyConfig 
} from '../config';

const API_URL = process.env.REACT_APP_API_URL || API_BASE_URL;

console.log('API_URL 环境变量:', process.env.REACT_APP_API_URL);
console.log('实际使用的 API_URL:', API_URL);
console.log('CORS代理状态:', CORS_PROXY_CONFIG.enabled ? '启用' : '禁用');

// 构建代理URL
const buildProxyUrl = (targetUrl: string) => {
  if (!CORS_PROXY_CONFIG.enabled) return targetUrl;
  
  const proxyUrl = getCurrentProxyUrl();
  if (!proxyUrl) return targetUrl;
  
  // 处理不同代理服务器的URL格式
  if (proxyUrl.includes('allorigins.win')) {
    return `${proxyUrl}${encodeURIComponent(targetUrl)}`;
  } else {
    return `${proxyUrl}${targetUrl}`;
  }
};

// 创建axios实例
const api = axios.create({
  timeout: CORS_PROXY_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 代理请求函数
const makeProxyRequest = async (config: any, retryCount = 0): Promise<any> => {
  try {
    // 构建完整的URL
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : `${API_URL}${config.url}`;
    const proxyUrl = buildProxyUrl(fullUrl);
    
    if (CORS_PROXY_CONFIG.debug) {
      console.log('代理请求:', {
        original: fullUrl,
        proxy: proxyUrl,
        method: config.method,
        retryCount
      });
    }
    
    // 创建新的请求配置
    const proxyConfig = {
      ...config,
      url: proxyUrl,
      baseURL: undefined // 清除baseURL，因为已经包含在proxyUrl中
    };
    
    // 发送请求
    const response = await axios(proxyConfig);
    
    // 处理allorigins.win的响应格式
    if (getCurrentProxyUrl().includes('allorigins.win')) {
      if (response.data && response.data.contents) {
        try {
          const actualData = JSON.parse(response.data.contents);
          return { ...response, data: actualData };
        } catch (e) {
          return { ...response, data: response.data.contents };
        }
      }
    }
    
    return response;
    
  } catch (error: any) {
    if (CORS_PROXY_CONFIG.debug) {
      console.log('代理请求失败:', error.message);
    }
    
    // 如果还有重试次数，切换代理服务器重试
    if (retryCount < CORS_PROXY_CONFIG.retryCount) {
      const nextProxy = switchToNextProxy();
      if (CORS_PROXY_CONFIG.debug) {
        console.log(`切换到代理服务器: ${nextProxy}`);
      }
      return makeProxyRequest(config, retryCount + 1);
    }
    
    // 所有代理都失败了，尝试直接请求
    if (CORS_PROXY_CONFIG.enabled) {
      console.log('所有代理都失败，尝试直接请求...');
      try {
        const directConfig = {
          ...config,
          baseURL: API_URL
        };
        return await axios(directConfig);
      } catch (directError) {
        console.log('直接请求也失败了');
        throw error; // 抛出原始代理错误
      }
    }
    
    throw error;
  }
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 设置baseURL
    if (!config.baseURL && !CORS_PROXY_CONFIG.enabled) {
      config.baseURL = API_URL;
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
    // 如果是CORS错误且未启用代理，自动启用代理重试
    if (error.code === 'ERR_NETWORK' && !CORS_PROXY_CONFIG.enabled) {
      console.log('检测到网络错误，启用代理重试...');
      CORS_PROXY_CONFIG.enabled = true;
      resetProxyConfig();
      
      try {
        return await makeProxyRequest(error.config);
      } catch (proxyError) {
        console.log('代理重试失败');
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 重写axios的请求方法以支持代理
const createProxyMethod = (method: string) => {
  return async (url: string, data?: any, config?: any) => {
    const requestConfig = {
      method,
      url,
      data,
      ...config
    };
    
    if (CORS_PROXY_CONFIG.enabled) {
      return makeProxyRequest(requestConfig);
    } else {
      return api.request({ ...requestConfig, baseURL: API_URL });
    }
  };
};

// 创建代理方法
const proxyApi = {
  get: createProxyMethod('GET'),
  post: createProxyMethod('POST'),
  put: createProxyMethod('PUT'),
  delete: createProxyMethod('DELETE'),
  patch: createProxyMethod('PATCH')
};

// 使用代理API或普通API
const apiRequest = CORS_PROXY_CONFIG.enabled ? proxyApi : api;

// 认证相关API
export const auth = {
    login: (email: string, password: string) =>
        apiRequest.post('/api/auth/login', { email, password }),
    
    register: (email: string, password: string, username: string) =>
        apiRequest.post('/api/auth/register', { email, password, username }),
    
    verifyToken: () =>
        apiRequest.get('/api/auth/verify'),
    
    logout: () =>
        apiRequest.post('/api/auth/logout'),
    
    updateProfile: (data: Partial<User>) =>
        apiRequest.put('/api/auth/profile', data),
    
    changePassword: (oldPassword: string, newPassword: string) =>
        apiRequest.put('/api/auth/password', { oldPassword, newPassword })
};

// 课程相关API
export const courses = {
    getAll: () => apiRequest.get('/api/courses'),
    
    getById: (id: number) => apiRequest.get(`/api/courses/${id}`),
    
    create: (data: { name: string; description: string }) => apiRequest.post('/api/courses', data),
    
    update: (id: number, data: { name: string; description: string }) => apiRequest.put(`/api/courses/${id}`, data),
    
    delete: (id: number) => apiRequest.delete(`/api/courses/${id}`),
    
    getStats: (id: number) => apiRequest.get(`/api/courses/${id}/stats`)
};

// 单词相关API
export const words = {
    getAll: (courseId: number) => apiRequest.get(`/api/courses/${courseId}/words`),
    
    getById: (courseId: number, wordId: number) => apiRequest.get(`/api/courses/${courseId}/words/${wordId}`),
    
    create: (data: { word: string; meaning: string; example: string; pronunciation: string; course_id: number }) =>
        apiRequest.post('/api/words', data),
    
    update: (id: number, data: { word: string; meaning: string; example: string; pronunciation: string; course_id: number }) =>
        apiRequest.put(`/api/words/${id}`, data),
    
    delete: (id: number) => apiRequest.delete(`/api/words/${id}`),
    
    getReviewWords: (courseId: number) => apiRequest.get(`/api/courses/${courseId}/review`),
    
    getPracticeWords: (courseId: number) => apiRequest.get(`/api/courses/${courseId}/practice`),
    
    submitReview: (wordId: number, quality: number) => apiRequest.post(`/api/words/${wordId}/review`, { quality }),
    
    checkPractice: (wordId: number, answer: string) => apiRequest.post(`/api/words/${wordId}/practice`, { answer })
};

// 导入导出相关API
export const importExport = {
    importWords: (courseId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest.post(`/api/courses/${courseId}/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    exportWords: (courseId: number) => apiRequest.get(`/api/courses/${courseId}/export`, { responseType: 'blob' }),
    
    getWordTemplate: () => apiRequest.get('/api/words/template', { responseType: 'blob' })
};

// 导出代理控制函数，供调试使用
export const proxyControl = {
  enable: () => {
    CORS_PROXY_CONFIG.enabled = true;
    resetProxyConfig();
    console.log('代理已启用');
  },
  
  disable: () => {
    CORS_PROXY_CONFIG.enabled = false;
    console.log('代理已禁用');
  },
  
  switchProxy: () => {
    const newProxy = switchToNextProxy();
    console.log(`切换到代理: ${newProxy}`);
    return newProxy;
  },
  
  getStatus: () => {
    return {
      enabled: CORS_PROXY_CONFIG.enabled,
      currentProxy: getCurrentProxyUrl(),
      currentIndex: CORS_PROXY_CONFIG.currentIndex
    };
  },
  
  enableDebug: () => {
    CORS_PROXY_CONFIG.debug = true;
    console.log('代理调试模式已启用');
  },
  
  disableDebug: () => {
    CORS_PROXY_CONFIG.debug = false;
    console.log('代理调试模式已禁用');
  }
};

// 在开发环境下，将代理控制函数挂载到window对象
if (process.env.NODE_ENV === 'development') {
  (window as any).proxyControl = proxyControl;
  console.log('代理控制函数已挂载到 window.proxyControl');
} 