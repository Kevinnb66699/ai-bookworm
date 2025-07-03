/**
 * 请求管理器 - 防止重复请求和竞态条件
 */
import { REQUEST_MANAGER_CONFIG } from '../config';

interface PendingRequest {
  promise: Promise<any>;
  abortController: AbortController;
  timestamp: number;
  lastCall: number; // 最后一次调用时间
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly CACHE_DURATION = REQUEST_MANAGER_CONFIG.cacheDuration;
  private readonly DEBOUNCE_DURATION = REQUEST_MANAGER_CONFIG.debounceDuration;
  private callTimestamps = new Map<string, number[]>(); // 记录每个请求的调用时间戳
  private componentCallCounts = new Map<string, number>(); // 记录每个组件的调用次数

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
    
    // 清理过期的调用时间戳
    const timestampEntries = Array.from(this.callTimestamps.entries());
    for (const [key, timestamps] of timestampEntries) {
      // 只保留最近5秒内的时间戳
      const recentTimestamps = timestamps.filter(ts => now - ts < 5000);
      if (recentTimestamps.length === 0) {
        this.callTimestamps.delete(key);
      } else {
        this.callTimestamps.set(key, recentTimestamps);
      }
    }
  }

  /**
   * 调试日志
   */
  private debugLog(message: string, ...args: any[]): void {
    if (REQUEST_MANAGER_CONFIG.enableDebug) {
      console.log(`[RequestManager] ${message}`, ...args);
    }
  }

  /**
   * 检查是否是快速重复调用
   */
  private isRapidCall(key: string): boolean {
    const now = Date.now();
    const timestamps = this.callTimestamps.get(key) || [];
    
    // 统计组件调用次数
    const componentName = key.split(':')[1]?.split('/')[4] || 'unknown';
    const currentCount = this.componentCallCounts.get(componentName) || 0;
    this.componentCallCounts.set(componentName, currentCount + 1);
    
    // 检查是否在防抖时间内
    const lastTimestamp = timestamps[timestamps.length - 1];
    if (lastTimestamp && now - lastTimestamp < this.DEBOUNCE_DURATION) {
      this.debugLog(`🚫 防抖阻止快速重复调用: ${key} (间隔: ${now - lastTimestamp}ms) [${componentName}第${currentCount}次调用]`);
      return true;
    }
    
    // 记录当前调用时间
    timestamps.push(now);
    this.callTimestamps.set(key, timestamps);
    
    this.debugLog(`📊 组件调用统计: ${componentName} 第${currentCount}次调用`);
    return false;
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
    
    // 检查是否是快速重复调用
    if (this.isRapidCall(key)) {
      // 如果有正在进行的相同请求，复用它
      const existingRequest = this.pendingRequests.get(key);
      if (existingRequest) {
        return existingRequest.promise;
      }
      // 如果没有正在进行的请求，抛出错误或返回空值
      throw new Error(`请求过于频繁，请稍后再试`);
    }
    
    // 检查是否有正在进行的相同请求
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      this.debugLog(`🔄 复用正在进行的请求: ${key}`);
      return existingRequest.promise;
    }

    // 创建新的请求
    const abortController = new AbortController();
    const now = Date.now();
    this.debugLog(`🚀 开始新请求: ${key} (当前并发: ${this.pendingRequests.size})`);
    
    const promise = requestFn(abortController.signal)
      .then((result) => {
        this.debugLog(`✅ 请求完成: ${key} (剩余并发: ${this.pendingRequests.size - 1})`);
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.debugLog(`❌ 请求失败: ${key}`, error.message);
        this.pendingRequests.delete(key);
        throw error;
      });

    // 存储请求信息
    this.pendingRequests.set(key, {
      promise,
      abortController,
      timestamp: now,
      lastCall: now
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
      this.debugLog(`🛑 取消请求: ${key}`);
      request.abortController.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * 取消所有正在进行的请求
   */
  cancelAllRequests(): void {
    this.debugLog(`🛑 取消所有请求 (${this.pendingRequests.size} 个)`);
    // 使用Array.from转换迭代器以兼容TypeScript配置
    const entries = Array.from(this.pendingRequests.entries());
    for (const [key, request] of entries) {
      request.abortController.abort();
    }
    this.pendingRequests.clear();
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): any {
    return {
      pendingRequests: Array.from(this.pendingRequests.keys()),
      componentCallCounts: Array.from(this.componentCallCounts.entries()),
      callTimestamps: Array.from(this.callTimestamps.entries()).map(([key, timestamps]) => ({
        key,
        count: timestamps.length,
        lastCall: timestamps[timestamps.length - 1]
      }))
    };
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