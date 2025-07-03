# CORS跨域问题故障排除指南

## 🔍 问题诊断

### 1. 使用测试工具
打开 `test_cors.html` 文件来诊断CORS问题：
- 显示当前页面的Origin信息
- 测试API连接
- 检查CORS头部配置

### 2. 检查实际的部署URL
Vercel的部署URL格式可能有以下几种：

**前端部署URL格式：**
- `https://ai-bookworm-frontend.vercel.app`
- `https://ai-bookworm-frontend-<random-hash>.vercel.app`
- `https://ai-bookworm-frontend-git-<branch-name>-<username>.vercel.app`

**后端部署URL格式：**
- `https://ai-bookworm-backend.vercel.app`
- `https://ai-bookworm-backend-<random-hash>.vercel.app`
- `https://ai-bookworm-backend-git-<branch-name>-<username>.vercel.app`

### 3. 查找实际部署URL

#### 方法1：通过Vercel控制台
1. 登录 [Vercel控制台](https://vercel.com/dashboard)
2. 找到你的项目
3. 在项目概述页面查看实际的部署URL

#### 方法2：通过Git提交记录
1. 检查你的Git仓库的Pull Request或提交记录
2. Vercel会在评论中显示预览URL

#### 方法3：通过命令行
```bash
# 查看部署历史
vercel ls

# 查看特定项目的部署
vercel ls <project-name>
```

## 🔧 解决步骤

### 步骤1：确认实际URL
1. 使用上述方法找到你的实际前端和后端部署URL
2. 记录下完整的URL（包括https://）

### 步骤2：更新环境变量
如果你的实际URL与配置不匹配，更新以下配置：

**前端环境变量：**
```bash
# 在 Vercel 控制台中设置
REACT_APP_API_URL=https://你的实际后端URL
```

**后端环境变量：**
```bash
# 在 Vercel 控制台中设置
ALLOWED_ORIGINS=https://你的实际前端URL
```

### 步骤3：重新部署
1. 更新环境变量后，触发重新部署
2. 可以通过推送新的提交或在Vercel控制台手动重新部署

### 步骤4：验证修复
1. 使用 `test_cors.html` 工具重新测试
2. 检查浏览器开发者工具的网络面板
3. 确认CORS错误是否已解决

## 🚨 常见问题

### 问题1：PreflightWildcardOriginNotAllowed
**原因：** 使用了通配符(*)但同时设置了credentials
**解决：** 已在代码中修复，使用动态匹配代替通配符

### 问题2：Origin不匹配
**原因：** 后端允许的Origin与前端的实际URL不匹配
**解决：** 确认并更新实际的部署URL

### 问题3：OPTIONS请求失败
**原因：** 预检请求没有正确处理
**解决：** 已在代码中添加了OPTIONS请求处理

### 问题4：缓存问题
**原因：** 浏览器或CDN缓存了旧的CORS配置
**解决：** 
- 清除浏览器缓存
- 使用无痕模式测试
- 等待CDN缓存更新（通常几分钟）

## 🔄 动态CORS配置

我们的新配置支持动态匹配，自动允许以下格式的前端URL：
- `https://ai-bookworm-frontend*.vercel.app`
- `https://ai-bookworm-frontend-git-*.vercel.app`
- `https://ai-bookworm-frontend-*.vercel.app`

这意味着大多数情况下，你不需要手动更新CORS配置。

## 📞 如果问题仍然存在

1. 检查浏览器开发者工具的Console面板查看详细错误
2. 检查Network面板查看实际的HTTP请求和响应
3. 确认前端和后端都已重新部署
4. 使用 `test_cors.html` 工具获取详细的诊断信息

## 🎯 最佳实践

1. **使用环境变量**：不要在代码中硬编码URL
2. **定期更新**：保持依赖和配置的更新
3. **监控日志**：检查Vercel的函数日志了解错误详情
4. **测试环境**：在本地和生产环境都进行测试

---

需要帮助？请提供 `test_cors.html` 的测试结果以便进一步诊断问题。 