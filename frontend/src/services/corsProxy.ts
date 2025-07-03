// 🚀 CORS代理解决方案
// 集成测试中验证的代理逻辑到主代码中

export interface ProxyConfig {
    enabled: boolean;
    currentProxyIndex: number;
    proxies: string[];
}

// 可用的CORS代理服务器列表
export const CORS_PROXIES = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
];

// 代理配置
class CorsProxyService {
    private config: ProxyConfig = {
        enabled: false,
        currentProxyIndex: 0,
        proxies: CORS_PROXIES
    };

    constructor() {
        // 在开发环境中自动启用代理
        if (process.env.NODE_ENV === 'development') {
            this.enableProxy();
            console.log('🚀 CORS代理已在开发环境中自动启用');
        }
    }

    /**
     * 启用CORS代理
     */
    public enableProxy(): void {
        this.config.enabled = true;
        console.log('🎯 CORS代理已启用，使用代理:', this.getCurrentProxy());
    }

    /**
     * 禁用CORS代理
     */
    public disableProxy(): void {
        this.config.enabled = false;
        console.log('🔄 CORS代理已禁用');
    }

    /**
     * 检查代理是否启用
     */
    public isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * 获取当前代理URL
     */
    public getCurrentProxy(): string {
        return this.config.proxies[this.config.currentProxyIndex];
    }

    /**
     * 切换到下一个代理服务器
     */
    public switchProxy(): void {
        this.config.currentProxyIndex = (this.config.currentProxyIndex + 1) % this.config.proxies.length;
        console.log('🔄 切换到代理:', this.getCurrentProxy());
    }

    /**
     * 处理URL，如果启用代理则添加代理前缀
     */
    public processUrl(url: string): string {
        if (!this.config.enabled) {
            return url;
        }

        // 只对后端API URL添加代理
        if (url.includes('ai-bookworm-backend.vercel.app') || url.includes('localhost:5000')) {
            const proxy = this.getCurrentProxy();
            return `${proxy}${url}`;
        }

        return url;
    }

    /**
     * 处理请求配置，添加代理需要的headers
     */
    public processRequestConfig(config: any): any {
        if (!this.config.enabled) {
            return config;
        }

        // 为代理请求添加必要的headers
        return {
            ...config,
            headers: {
                ...config.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin
            }
        };
    }

    /**
     * 测试代理连接
     */
    public async testProxy(): Promise<boolean> {
        if (!this.config.enabled) {
            console.log('❌ 代理未启用');
            return false;
        }

        try {
            const testUrl = this.processUrl('https://ai-bookworm-backend.vercel.app/api/health');
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': window.location.origin
                }
            });

            if (response.ok) {
                console.log('✅ 代理测试成功');
                return true;
            } else {
                console.log('❌ 代理测试失败，状态码:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ 代理测试失败:', error);
            return false;
        }
    }

    /**
     * 获取代理状态信息
     */
    public getStatus(): string {
        if (this.config.enabled) {
            return `🎯 代理状态: 已启用 (${this.getCurrentProxy()})`;
        } else {
            return '🔄 代理状态: 未启用';
        }
    }
}

// 创建单例实例
export const corsProxyService = new CorsProxyService();

// 导出便捷方法
export const enableCorsProxy = () => corsProxyService.enableProxy();
export const disableCorsProxy = () => corsProxyService.disableProxy();
export const isProxyEnabled = () => corsProxyService.isEnabled();
export const testCorsProxy = () => corsProxyService.testProxy();
export const getProxyStatus = () => corsProxyService.getStatus();
export const switchCorsProxy = () => corsProxyService.switchProxy(); 