# 🚀 快速部署指南

## 一键部署（推荐）

### Windows 用户
```bash
deploy.bat
```

### Linux/Mac 用户
```bash
chmod +x deploy.sh
./deploy.sh
```

## 手动部署步骤

### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署后端
```bash
cd backend
vercel --prod
```

### 4. 部署前端
```bash
cd frontend
vercel --prod
```

## 🔧 必需的环境变量

### 后端环境变量（在 Vercel 控制台设置）
- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `JWT_SECRET_KEY`: JWT 密钥（随机字符串）
- `DASHSCOPE_API_KEY`: 阿里云语音识别 API 密钥
- `ALIBABA_CLOUD_ACCESS_KEY_ID`: 阿里云访问密钥 ID
- `ALIBABA_CLOUD_ACCESS_KEY_SECRET`: 阿里云访问密钥 Secret
- `ALLOWED_ORIGINS`: 允许的前端域名（可选）

### 前端环境变量
- `REACT_APP_API_URL`: 后端 API 地址

## 📊 推荐的数据库服务
- [Supabase](https://supabase.com) - 免费 PostgreSQL
- [PlanetScale](https://planetscale.com) - MySQL 兼容
- [Neon](https://neon.tech) - 无服务器 PostgreSQL

## 🆘 常见问题

### 构建失败
- 检查 Node.js 版本（推荐 16+）
- 确保所有依赖都已安装

### API 连接失败
- 确认环境变量配置正确
- 检查 CORS 设置

### 数据库连接失败
- 确认数据库连接字符串格式正确
- 检查数据库网络访问权限 