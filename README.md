# AI 书童 (AI Bookworm)

一个智能的英语学习助手，帮助用户更好地学习和记忆英语单词和文本。

## 功能特点

### 已实现功能
- 单词练习系统
  - 课程选择
  - 单词练习
  - 进度跟踪
  - 正确率计算
- 复习计划系统
  - 基于艾宾浩斯遗忘曲线的复习间隔
  - 练习历史记录
  - 复习计划 API
- 文本朗读系统
  - 语音识别
  - 发音评估
  - 朗读练习
- 用户认证系统
  - 注册登录
  - JWT 认证
  - 用户管理

### 开发中功能
- 复习提醒系统
- 学习进度系统
- 用户设置
- 课程管理
- 单词管理

## 技术栈

### 后端
- Flask
- SQLAlchemy
- JWT
- PostgreSQL
- 阿里云语音识别 API

### 前端
- React
- TypeScript
- Ant Design
- React Router

## 项目结构
```
.
├── backend/                 # 后端代码
│   ├── app/                # 应用代码
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务服务
│   │   └── utils/         # 工具函数
│   ├── migrations/        # 数据库迁移
│   └── vercel.json        # Vercel 配置
├── frontend/               # 前端代码
│   ├── src/               # 源代码
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── vercel.json        # Vercel 配置
└── .github/               # GitHub Actions
    └── workflows/         # 自动部署配置
```

## 🚀 部署

项目支持多种部署方式：

### GitHub + Vercel 部署（推荐）
```bash
# Windows 用户
github-deploy.bat

# Linux/Mac 用户
chmod +x github-deploy.sh
./github-deploy.sh
```

### 直接 Vercel 部署
```bash
# Windows 用户
deploy.bat

# Linux/Mac 用户
chmod +x deploy.sh
./deploy.sh
```

### 📚 详细部署文档
- `GITHUB_DEPLOY.md` - GitHub 部署指南
- `QUICK_DEPLOY.md` - 快速部署指南
- `DEPLOYMENT.md` - 详细部署文档

### 🔧 部署要求
- Node.js 16+
- PostgreSQL 数据库
- Vercel 账号
- 阿里云 API 密钥（语音识别功能）

## 本地开发

### 后端
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 前端
```bash
cd frontend
npm install
npm start
```

## 环境变量配置

### 后端环境变量
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
DASHSCOPE_API_KEY=your_dashscope_api_key
ALIBABA_CLOUD_ACCESS_KEY_ID=your_alibaba_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_alibaba_access_key_secret
```

### 前端环境变量
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 开发进度
详细开发进度请查看 [PROGRESS.md](./PROGRESS.md)

## 贡献指南
欢迎提交 Pull Request 或创建 Issue 来帮助改进项目。

## 许可证
MIT
