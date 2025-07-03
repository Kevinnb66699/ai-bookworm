export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-bookworm-backend.vercel.app';

// 直接导出API URL，不使用代理
export const getApiUrl = () => API_BASE_URL;

export const APP_NAME = 'AI书童';

export const TOKEN_KEY = 'token';

export const DEFAULT_PAGE_SIZE = 10;

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'];

export const DEFAULT_LANGUAGE = 'zh-CN';

// CORS代理配置 - 已禁用，直接连接后端
export const CORS_PROXY_CONFIG = {
  enabled: false, // 禁用代理，直接连接后端
  servers: [], // 清空代理服务器
  currentIndex: 0,
  timeout: 8000,
  retryCount: 1,
  debug: false
};

// 获取当前代理URL - 返回空字符串，不使用代理
export const getCurrentProxyUrl = () => {
  return '';
};

// 切换到下一个代理服务器 - 不执行任何操作
export const switchToNextProxy = () => {
  return '';
};

// 重置代理配置 - 保持禁用状态
export const resetProxyConfig = () => {
  CORS_PROXY_CONFIG.enabled = false;
};

// RequestManager配置
export const REQUEST_MANAGER_CONFIG = {
  enableDebug: false, // 关闭调试模式
  cacheDuration: 10000, // 增加缓存时间到10秒
  debounceDuration: 1000, // 增加防抖时间到1秒
  maxConcurrentRequests: 5 // 最大并发请求数
}; 