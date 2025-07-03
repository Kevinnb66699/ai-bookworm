// 导入代理服务，让配置文件也能感知代理状态
import { corsProxyService } from './services/corsProxy';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-bookworm-backend.vercel.app';

// 导出经过代理处理的API URL
export const getApiUrl = () => corsProxyService.processUrl(API_BASE_URL);

export const APP_NAME = 'AI书童';

export const TOKEN_KEY = 'token';

export const DEFAULT_PAGE_SIZE = 10;

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'];

export const DEFAULT_LANGUAGE = 'zh-CN';

// CORS代理配置
export const CORS_PROXY_CONFIG = {
  enabled: true, // 是否启用代理
  servers: [
    'https://corsproxy.io/?', // 优先使用，支持所有HTTP方法
    'https://cors-anywhere.herokuapp.com/', // 备用，支持所有HTTP方法
    'https://api.allorigins.win/get?url=' // 最后使用，仅支持GET请求
  ],
  currentIndex: 0, // 当前使用的代理服务器索引
  timeout: 15000, // 代理请求超时时间
  retryCount: 2, // 重试次数
  debug: true // 启用调试模式以便排查问题
};

// 获取当前代理URL
export const getCurrentProxyUrl = () => {
  if (!CORS_PROXY_CONFIG.enabled) return '';
  return CORS_PROXY_CONFIG.servers[CORS_PROXY_CONFIG.currentIndex];
};

// 切换到下一个代理服务器
export const switchToNextProxy = () => {
  CORS_PROXY_CONFIG.currentIndex = (CORS_PROXY_CONFIG.currentIndex + 1) % CORS_PROXY_CONFIG.servers.length;
  return getCurrentProxyUrl();
};

// 重置代理配置
export const resetProxyConfig = () => {
  CORS_PROXY_CONFIG.currentIndex = 0;
  CORS_PROXY_CONFIG.enabled = true;
}; 