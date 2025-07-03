# 🚀 通过 GitHub 部署到 Vercel

## 方法一：通过 Vercel 控制台（推荐）

### 1. 创建 GitHub 仓库
```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 创建 GitHub 仓库后，添加远程仓库
git remote add origin https://github.com/你的用户名/ai-bookworm.git

# 推送到 GitHub
git push -u origin main
```

### 2. 在 Vercel 控制台部署

#### 部署后端：
1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 设置 **Root Directory** 为 `backend`
5. 配置环境变量：
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `DASHSCOPE_API_KEY`
   - `ALIBABA_CLOUD_ACCESS_KEY_ID`
   - `ALIBABA_CLOUD_ACCESS_KEY_SECRET`
   - `ALLOWED_ORIGINS`
6. 点击 "Deploy"

#### 部署前端：
1. 再次点击 "New Project"
2. 选择同一个 GitHub 仓库
3. 设置 **Root Directory** 为 `frontend`
4. 配置环境变量：
   - `REACT_APP_API_URL`: 你的后端 API 地址
5. 点击 "Deploy"

### 3. 自动部署
- 每次推送代码到 GitHub，Vercel 会自动重新部署
- 支持预览部署（Pull Request）

## 方法二：使用 Vercel CLI 连接 GitHub

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/ai-bookworm.git
git push -u origin main
```

### 2. 使用 Vercel CLI 部署
```bash
# 登录 Vercel
vercel login

# 部署后端
cd backend
vercel --prod

# 部署前端
cd ../frontend
vercel --prod
```

## 方法三：GitHub Actions 自动部署

我已经为你创建了 GitHub Actions 配置文件，支持自动部署到 Vercel。

### 设置 GitHub Secrets
在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：

- `VERCEL_TOKEN`: Vercel 访问令牌
- `VERCEL_ORG_ID`: Vercel 组织 ID
- `VERCEL_PROJECT_ID_BACKEND`: 后端项目 ID
- `VERCEL_PROJECT_ID_FRONTEND`: 前端项目 ID

### 获取 Vercel 信息
```bash
# 获取 Vercel 令牌
vercel login

# 在项目目录中获取项目信息
cd backend
vercel
# 查看 .vercel/project.json 获取项目 ID

cd ../frontend
vercel
# 查看 .vercel/project.json 获取项目 ID
```

## 🔧 环境变量配置

### 后端环境变量
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
DASHSCOPE_API_KEY=your_dashscope_api_key
ALIBABA_CLOUD_ACCESS_KEY_ID=your_alibaba_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_alibaba_access_key_secret
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

### 前端环境变量
```
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
```

## 📊 推荐的数据库服务

### Supabase（推荐）
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取数据库连接字符串
4. 格式：`postgresql://postgres:[password]@[host]:5432/postgres`

### PlanetScale
1. 访问 [PlanetScale](https://planetscale.com)
2. 创建数据库
3. 获取连接字符串

### Neon
1. 访问 [Neon](https://neon.tech)
2. 创建数据库
3. 获取连接字符串

## 🚀 部署流程总结

1. **准备代码**: 确保所有文件已提交到 GitHub
2. **创建数据库**: 选择数据库服务并获取连接字符串
3. **部署后端**: 在 Vercel 控制台部署后端，配置环境变量
4. **部署前端**: 在 Vercel 控制台部署前端，配置 API 地址
5. **测试应用**: 访问前端 URL 测试功能

## 🆘 故障排除

### 构建失败
- 检查 `package.json` 中的依赖版本
- 确保 Node.js 版本兼容（推荐 16+）

### API 连接失败
- 确认 `REACT_APP_API_URL` 配置正确
- 检查后端 CORS 设置

### 数据库连接失败
- 确认数据库连接字符串格式正确
- 检查数据库网络访问权限

### 环境变量问题
- 确保所有必需的环境变量都已设置
- 重新部署以应用新的环境变量 