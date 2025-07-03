# 🚀 CORS代理集成说明

## 📋 功能概述

CORS代理已经集成到主代码中，会在开发环境中自动启用，解决跨域问题。

## ✅ 自动启用

- **开发环境**: 代理会自动启用，无需手动配置
- **生产环境**: 代理会自动禁用，使用原始API地址

## 🎛️ 手动控制

在开发环境中，可以通过浏览器控制台手动控制代理：

```javascript
// 查看代理状态
window.corsProxy.status()

// 启用代理
window.corsProxy.enable()

// 禁用代理
window.corsProxy.disable()

// 测试代理连接
window.corsProxy.test()

// 切换代理服务器
window.corsProxy.switch()
```

## 🔧 工作原理

1. **自动检测**: 在开发环境中自动启用代理
2. **URL处理**: 自动为后端API请求添加代理前缀
3. **请求头处理**: 自动添加代理所需的请求头
4. **多代理支持**: 支持多个代理服务器，可自动切换

## 📍 代理服务器列表

1. `https://cors-anywhere.herokuapp.com/`
2. `https://api.allorigins.win/raw?url=`
3. `https://corsproxy.io/?`

## 💡 开发提示

- 启动前端开发服务器时，会在控制台看到代理状态信息
- 如果某个代理服务器不可用，可以使用 `window.corsProxy.switch()` 切换到其他代理
- 所有API请求都会自动使用代理，无需修改现有代码

## 🚨 注意事项

- 代理仅在开发环境中启用，生产环境不会使用代理
- 代理可能会增加请求延迟
- 公共代理服务器可能有请求限制

## 📞 故障排除

如果遇到问题：

1. 检查控制台是否有错误信息
2. 使用 `window.corsProxy.test()` 测试代理连接
3. 使用 `window.corsProxy.switch()` 切换代理服务器
4. 检查网络连接是否正常

## 🎉 部署

现在可以直接部署前端，代理功能已经集成到主代码中：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

代理会在开发环境中自动工作，生产环境中会使用原始的API地址。 