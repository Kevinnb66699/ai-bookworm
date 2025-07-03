import axios from 'axios';
import { 
  API_BASE_URL, 
  CORS_PROXY_CONFIG, 
  getCurrentProxyUrl, 
  switchToNextProxy, 
  resetProxyConfig 
} from '../config';

const API_URL = process.env.REACT_APP_API_URL || API_BASE_URL;

console.log('ApiClient - API_URL:', API_URL);
console.log('ApiClient - CORS代理状态:', CORS_PROXY_CONFIG.enabled ? '启用' : '禁用');

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

// 代理请求函数
const makeProxyRequest = async (config: any, retryCount = 0): Promise<any> => {
  try {
    // 构建完整的URL
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : `${API_URL}${config.url}`;
    const proxyUrl = buildProxyUrl(fullUrl);
    
    if (CORS_PROXY_CONFIG.debug) {
      console.log('ApiClient代理请求:', {
        original: fullUrl,
        proxy: proxyUrl,
        method: config.method,
        retryCount,
        data: config.data
      });
    }
    
    // 创建新的请求配置
    const proxyConfig = {
      ...config,
      url: proxyUrl,
      baseURL: undefined // 清除baseURL，因为已经包含在proxyUrl中
    };
    
    // 特别处理allorigins.win代理
    if (getCurrentProxyUrl().includes('allorigins.win')) {
      // allorigins.win只支持GET请求，对于POST请求需要特殊处理
      if (config.method && config.method.toUpperCase() !== 'GET') {
        // 对于POST请求，我们需要直接请求或使用其他代理
        throw new Error('allorigins.win不支持POST请求');
      }
    }
    
    // 确保Content-Type头部正确设置
    if (config.data && typeof config.data === 'object') {
      proxyConfig.headers = {
        'Content-Type': 'application/json',
        ...proxyConfig.headers
      };
    }
    
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
      console.log('ApiClient代理请求失败:', error.message);
    }
    
    // 如果是allorigins.win不支持POST的错误，立即切换到下一个代理
    if (error.message.includes('allorigins.win不支持POST请求')) {
      const nextProxy = switchToNextProxy();
      if (CORS_PROXY_CONFIG.debug) {
        console.log(`切换到支持POST的代理: ${nextProxy}`);
      }
      return makeProxyRequest(config, retryCount);
    }
    
    // 如果还有重试次数，切换代理服务器重试
    if (retryCount < CORS_PROXY_CONFIG.retryCount) {
      const nextProxy = switchToNextProxy();
      if (CORS_PROXY_CONFIG.debug) {
        console.log(`ApiClient切换到代理服务器: ${nextProxy}`);
      }
      return makeProxyRequest(config, retryCount + 1);
    }
    
    // 所有代理都失败了，尝试直接请求
    if (CORS_PROXY_CONFIG.enabled) {
      console.log('ApiClient所有代理都失败，尝试直接请求...');
      try {
        const directConfig = {
          ...config,
          baseURL: API_URL
        };
        return await axios(directConfig);
      } catch (directError) {
        console.log('ApiClient直接请求也失败了');
        throw error; // 抛出原始代理错误
      }
    }
    
    throw error;
  }
};

// 创建API客户端实例
const apiClient = axios.create({
  timeout: CORS_PROXY_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // 代理时需要关闭withCredentials
});

// 重写axios的请求方法以支持代理
const createProxyMethod = (method: string) => {
  return async (url: string, data?: any, config?: any) => {
    const requestConfig = {
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      },
      ...config
    };
    
    // 添加token
    const token = localStorage.getItem('token');
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    if (CORS_PROXY_CONFIG.enabled) {
      return makeProxyRequest(requestConfig);
    } else {
      return apiClient.request({ ...requestConfig, baseURL: API_URL });
    }
  };
};

// 创建代理方法
const proxyApiClient = {
  get: createProxyMethod('GET'),
  post: createProxyMethod('POST'),
  put: createProxyMethod('PUT'),
  delete: createProxyMethod('DELETE'),
  patch: createProxyMethod('PATCH')
};

// 请求拦截器：添加token
apiClient.interceptors.request.use(
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
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 如果是CORS错误且未启用代理，自动启用代理重试
    if ((error.code === 'ERR_NETWORK' || error.name === 'AxiosError') && !CORS_PROXY_CONFIG.enabled) {
      console.log('ApiClient检测到网络错误，启用代理重试...');
      CORS_PROXY_CONFIG.enabled = true;
      resetProxyConfig();
      
      try {
        return await makeProxyRequest(error.config);
      } catch (proxyError) {
        console.log('ApiClient代理重试失败，继续处理原始错误');
      }
    }
    
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

// 导出代理或普通客户端
const finalApiClient = CORS_PROXY_CONFIG.enabled ? proxyApiClient : apiClient;

export default finalApiClient; 