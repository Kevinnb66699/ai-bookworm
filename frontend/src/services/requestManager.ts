/**
 * 请求管理器 - 防止重复请求和竞态条件
 */

interface PendingRequest {
  promise: Promise<any>;
  abortController: AbortController;
  timestamp: number;
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly CACHE_DURATION = 5000; // 5秒内的相同请求视为重复

  /**
   * 生成请求的唯一键
   */
  private generateKey(url: string, method: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  /**
   * 清理过期的请求
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    // 使用Array.from转换迭代器以兼容TypeScript配置
    const entries = Array.from(this.pendingRequests.entries());
    for (const [key, request] of entries) {
      if (now - request.timestamp > this.CACHE_DURATION) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * 执行请求，自动处理重复请求
   */
  async executeRequest<T>(
    requestFn: (abortSignal: AbortSignal) => Promise<T>,
    url: string,
    method: string = 'GET',
    data?: any
  ): Promise<T> {
    const key = this.generateKey(url, method, data);
    
    // 清理过期请求
    this.cleanupExpiredRequests();
    
    // 检查是否有正在进行的相同请求
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      console.log(`🔄 复用正在进行的请求: ${key}`);
      return existingRequest.promise;
    }

    // 创建新的请求
    const abortController = new AbortController();
    console.log(`🚀 开始新请求: ${key}`);
    
    const promise = requestFn(abortController.signal)
      .then((result) => {
        console.log(`✅ 请求完成: ${key}`);
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        console.log(`❌ 请求失败: ${key}`, error.message);
        this.pendingRequests.delete(key);
        throw error;
      });

    // 存储请求信息
    this.pendingRequests.set(key, {
      promise,
      abortController,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * 取消指定的请求
   */
  cancelRequest(url: string, method: string = 'GET', data?: any): void {
    const key = this.generateKey(url, method, data);
    const request = this.pendingRequests.get(key);
    
    if (request) {
      console.log(`🛑 取消请求: ${key}`);
      request.abortController.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * 取消所有正在进行的请求
   */
  cancelAllRequests(): void {
    console.log(`🛑 取消所有请求 (${this.pendingRequests.size} 个)`);
    // 使用Array.from转换迭代器以兼容TypeScript配置
    const entries = Array.from(this.pendingRequests.entries());
    for (const [key, request] of entries) {
      request.abortController.abort();
    }
    this.pendingRequests.clear();
  }

  /**
   * 获取正在进行的请求数量
   */
  getPendingRequestsCount(): number {
    this.cleanupExpiredRequests();
    return this.pendingRequests.size;
  }

  /**
   * 检查特定请求是否正在进行
   */
  isRequestPending(url: string, method: string = 'GET', data?: any): boolean {
    const key = this.generateKey(url, method, data);
    return this.pendingRequests.has(key);
  }
}

// 创建全局请求管理器实例
export const requestManager = new RequestManager();

// 导出类型和实例
export type { PendingRequest };
export default RequestManager; 