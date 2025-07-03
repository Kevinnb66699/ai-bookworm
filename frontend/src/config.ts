export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-bookworm-backend.vercel.app';

// 导入代理服务，让配置文件也能感知代理状态
import { corsProxyService } from './services/corsProxy';

// 导出经过代理处理的API URL
export const getApiUrl = () => corsProxyService.processUrl(API_BASE_URL);

export const APP_NAME = 'AI书童';

export const TOKEN_KEY = 'token';

export const DEFAULT_PAGE_SIZE = 10;

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'];

export const DEFAULT_LANGUAGE = 'zh-CN'; 