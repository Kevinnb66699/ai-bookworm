# AI Bookworm 部署指南

## 部署到 Vercel

### 前提条件
1. 安装 [Vercel CLI](https://vercel.com/docs/cli)
2. 注册 [Vercel 账号](https://vercel.com)
3. 准备数据库（推荐使用 PostgreSQL）

### 第一步：部署后端

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **进入后端目录**
   ```bash
   cd backend
   ```

4. **部署后端**
   ```bash
   vercel
   ```

5. **配置环境变量**
   在 Vercel 控制台中为后端项目添加以下环境变量：
   - `DATABASE_URL`: 你的数据库连接字符串
   - `JWT_SECRET_KEY`: JWT 密钥
   - `DASHSCOPE_API_KEY`: 阿里云语音识别 API 密钥
   - `ALIBABA_CLOUD_ACCESS_KEY_ID`: 阿里云访问密钥 ID
   - `ALIBABA_CLOUD_ACCESS_KEY_SECRET`: 阿里云访问密钥 Secret

6. **重新部署以应用环境变量**
   ```bash
   vercel --prod
   ```

### 第二步：部署前端

1. **进入前端目录**
   ```bash
   cd frontend
   ```

2. **修改 API 地址**
   编辑 `env.production` 文件，将 `your-backend-url.vercel.app` 替换为你的实际后端 URL

3. **部署前端**
   ```bash
   vercel
   ```

4. **配置环境变量**
   在 Vercel 控制台中为前端项目添加：
   - `REACT_APP_API_URL`: 你的后端 API URL

5. **重新部署**
   ```bash
   vercel --prod
   ```

### 第三步：配置自定义域名（可选）

1. 在 Vercel 控制台中为前端项目添加自定义域名
2. 更新 `env.production` 中的 API URL

### 第四步：数据库设置

1. **推荐使用 Supabase 或 PlanetScale**
   - 创建 PostgreSQL 数据库
   - 获取连接字符串
   - 在 Vercel 环境变量中设置 `DATABASE_URL`

2. **初始化数据库**
   后端部署后会自动创建表结构

### 注意事项

1. **CORS 配置**: 确保后端允许前端域名的跨域请求
2. **环境变量**: 所有敏感信息都应通过 Vercel 环境变量配置
3. **数据库**: 生产环境建议使用托管数据库服务
4. **文件上传**: Vercel 是无服务器环境，不支持本地文件存储，建议使用云存储服务

### 故障排除

1. **构建失败**: 检查依赖版本兼容性
2. **API 连接失败**: 确认环境变量配置正确
3. **数据库连接失败**: 检查数据库连接字符串和网络访问权限

### 监控和维护

1. 使用 Vercel Analytics 监控应用性能
2. 定期检查日志和错误报告
3. 及时更新依赖包版本 