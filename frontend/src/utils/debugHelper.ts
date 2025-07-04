// 调试帮助工具
export class DebugHelper {
    private static requestCount = 0;
    private static activeRequests = new Set<string>();

    static logRequest(type: string, action: string) {
        this.requestCount++;
        const requestId = `${type}-${this.requestCount}`;
        
        if (action === 'start') {
            this.activeRequests.add(requestId);
            console.log(`🚀 [${requestId}] 开始请求`, {
                type,
                activeCount: this.activeRequests.size,
                totalCount: this.requestCount
            });
        } else if (action === 'end') {
            this.activeRequests.delete(requestId);
            console.log(`✅ [${requestId}] 请求完成`, {
                type,
                activeCount: this.activeRequests.size
            });
        } else if (action === 'cancel') {
            this.activeRequests.delete(requestId);
            console.log(`❌ [${requestId}] 请求取消`, {
                type,
                activeCount: this.activeRequests.size
            });
        }

        // 如果活跃请求过多，发出警告
        if (this.activeRequests.size > 3) {
            console.warn(`⚠️ 检测到过多活跃请求！当前活跃请求数: ${this.activeRequests.size}`);
        }
    }

    static getStats() {
        return {
            totalRequests: this.requestCount,
            activeRequests: this.activeRequests.size,
            activeRequestIds: Array.from(this.activeRequests)
        };
    }

    static reset() {
        this.requestCount = 0;
        this.activeRequests.clear();
        console.log('🔄 调试计数器已重置');
    }
}

// 在开发环境中暴露到全局
if (process.env.NODE_ENV === 'development') {
    (window as any).debugHelper = DebugHelper;
    console.log('🔍 调试工具已加载，使用 debugHelper.getStats() 查看请求状态');
} 