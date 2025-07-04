// 竞态条件测试工具
// 用于验证前端请求防重、防抖、取消等机制是否正常工作

export class RaceConditionTester {
    private requests: Map<string, AbortController> = new Map();
    private requestCount = 0;
    
    // 模拟API请求
    async simulateApiRequest(
        requestId: string, 
        delay: number = 1000, 
        shouldFail: boolean = false
    ): Promise<any> {
        this.requestCount++;
        const currentRequestId = `${requestId}_${this.requestCount}`;
        
        console.log(`🚀 开始请求: ${currentRequestId}`);
        
        // 如果已有相同类型的请求，取消之前的请求
        if (this.requests.has(requestId)) {
            const oldController = this.requests.get(requestId)!;
            oldController.abort();
            console.log(`❌ 取消旧请求: ${requestId}`);
        }
        
        // 创建新的 AbortController
        const controller = new AbortController();
        this.requests.set(requestId, controller);
        
        try {
            await this.delay(delay, controller.signal);
            
            if (shouldFail) {
                throw new Error(`请求失败: ${currentRequestId}`);
            }
            
            console.log(`✅ 请求成功: ${currentRequestId}`);
            return { success: true, id: currentRequestId };
            
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log(`🔄 请求被取消: ${currentRequestId}`);
                throw error;
            } else {
                console.log(`❌ 请求失败: ${currentRequestId}`, error.message);
                throw error;
            }
        } finally {
            // 清理已完成的请求
            if (this.requests.get(requestId) === controller) {
                this.requests.delete(requestId);
            }
        }
    }
    
    // 延迟函数，支持取消
    private delay(ms: number, signal?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                resolve();
            }, ms);
            
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new DOMException('请求被取消', 'AbortError'));
                });
            }
        });
    }
    
    // 测试快速连续请求
    async testRapidRequests(requestType: string, count: number = 5) {
        console.log(`\n📊 测试快速连续请求: ${requestType}`);
        
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(
                this.simulateApiRequest(requestType, 1000 + Math.random() * 1000)
                    .catch(error => {
                        if (error.name !== 'AbortError') {
                            console.error(`请求 ${i + 1} 失败:`, error);
                        }
                    })
            );
            
            // 快速连续发送请求
            await this.delay(100);
        }
        
        await Promise.allSettled(promises);
        console.log(`📊 ${requestType} 测试完成\n`);
    }
    
    // 测试防抖机制
    async testDebounce(requestType: string, debounceTime: number = 300) {
        console.log(`\n🔄 测试防抖机制: ${requestType}`);
        
        let lastRequestTime = 0;
        let requestId = 0;
        
        const debouncedRequest = this.debounce(async () => {
            const id = ++requestId;
            const now = Date.now();
            console.log(`⏰ 防抖请求 ${id} 执行，距离上次: ${now - lastRequestTime}ms`);
            lastRequestTime = now;
            
                         try {
                 await this.simulateApiRequest(`${requestType}_debounced`, 500);
             } catch (error: any) {
                 if (error.name !== 'AbortError') {
                     console.error(`防抖请求 ${id} 失败:`, error);
                 }
             }
        }, debounceTime);
        
        // 快速连续调用
        for (let i = 0; i < 10; i++) {
            console.log(`🔄 触发防抖请求 ${i + 1}`);
            debouncedRequest();
            await this.delay(50);
        }
        
        // 等待防抖请求完成
        await this.delay(debounceTime + 1000);
        console.log(`🔄 防抖测试完成\n`);
    }
    
    // 防抖工具函数
    private debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: NodeJS.Timeout | null = null;
        
        return (...args: Parameters<T>) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(() => {
                func(...args);
            }, wait);
        };
    }
    
    // 清理所有请求
    cleanup() {
        console.log('🧹 清理所有请求');
        this.requests.forEach((controller, requestId) => {
            controller.abort();
            console.log(`❌ 取消请求: ${requestId}`);
        });
        this.requests.clear();
    }
}

// 使用示例
export const testRaceConditions = async () => {
    console.log('🧪 开始竞态条件测试...\n');
    
    const tester = new RaceConditionTester();
    
    try {
        // 测试1: 快速连续请求
        await tester.testRapidRequests('practice_load', 5);
        
        // 测试2: 快速连续提交
        await tester.testRapidRequests('practice_submit', 3);
        
        // 测试3: 防抖机制
        await tester.testDebounce('mode_change', 300);
        
        console.log('✅ 所有测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        tester.cleanup();
    }
};

// 在开发环境中可以在控制台运行: testRaceConditions()
if (process.env.NODE_ENV === 'development') {
    (window as any).testRaceConditions = testRaceConditions;
    console.log('🧪 竞态条件测试工具已加载，在控制台运行 testRaceConditions() 进行测试');
} 