# CORS代理功能使用说明

## 功能概述

AI Bookworm项目已集成CORS代理功能，可以自动解决跨域访问问题。代理功能默认启用，无需手动配置。

## 代理配置

### 自动配置
- **默认状态**: 代理已启用
- **自动重试**: 支持多个代理服务器自动切换
- **智能回退**: 代理失败时自动尝试直接连接

### 代理服务器
系统支持以下代理服务器：
1. `cors-anywhere.herokuapp.com` (主要)
2. `api.allorigins.win` (备用)
3. `corsproxy.io` (备用)

## 开发调试

### 控制台调试
在浏览器开发者工具中，可以使用以下命令：

```javascript
// 查看代理状态
window.proxyControl.getStatus()

// 启用/禁用代理
window.proxyControl.enable()
window.proxyControl.disable()

// 切换代理服务器
window.proxyControl.switchProxy()

// 启用调试模式
window.proxyControl.enableDebug()
window.proxyControl.disableDebug()
```

### 配置修改
在 `src/config.ts` 中可以修改代理设置：

```typescript
export const CORS_PROXY_CONFIG = {
  enabled: true,        // 是否启用代理
  timeout: 15000,       // 超时时间
  retryCount: 2,        // 重试次数
  debug: false          // 调试模式
};
```

## 工作原理

1. **自动检测**: 当检测到CORS错误时，自动启用代理
2. **智能路由**: 根据代理服务器特点，选择最适合的URL格式
3. **故障切换**: 单个代理失败时，自动切换到下一个
4. **降级处理**: 所有代理失败时，尝试直接连接

## 部署注意事项

### 环境变量
确保设置正确的API URL：
```bash
REACT_APP_API_URL=https://ai-bookworm-backend.vercel.app
```

### 生产环境
- 代理功能在生产环境中会自动工作
- 无需额外配置
- 支持Vercel等部署平台

## 故障排除

### 常见问题

1. **代理超时**
   - 检查网络连接
   - 尝试切换代理服务器
   - 增加超时时间

2. **所有代理失败**
   - 检查后端服务状态
   - 确认API URL正确
   - 查看浏览器控制台错误

3. **调试信息**
   ```javascript
   // 启用详细日志
   window.proxyControl.enableDebug()
   ```

### 手动测试
可以使用 `test_cors.html` 文件进行功能测试：
```bash
python start_test_server.py
```

## 更新日志

- **v1.0**: 基础代理功能
- **v1.1**: 多代理服务器支持
- **v1.2**: 智能错误处理和自动重试
- **v1.3**: 集成到主代码，支持所有API调用 