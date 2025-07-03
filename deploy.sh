#!/bin/bash

echo "🚀 开始部署 AI Bookworm 到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录 Vercel..."
    vercel login
fi

echo "📦 部署后端..."
cd backend
vercel --prod

# 获取后端 URL
BACKEND_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
echo "✅ 后端部署完成: $BACKEND_URL"

echo "📦 部署前端..."
cd ../frontend

# 更新前端环境变量
sed -i "s|your-backend-url.vercel.app|${BACKEND_URL#https://}|g" env.production

vercel --prod

echo "✅ 前端部署完成!"

echo "🎉 部署完成!"
echo "📝 请记得在 Vercel 控制台中配置环境变量："
echo "   后端环境变量："
echo "   - DATABASE_URL"
echo "   - JWT_SECRET_KEY"
echo "   - DASHSCOPE_API_KEY"
echo "   - ALIBABA_CLOUD_ACCESS_KEY_ID"
echo "   - ALIBABA_CLOUD_ACCESS_KEY_SECRET"
echo "   - ALLOWED_ORIGINS"
echo ""
echo "   前端环境变量："
echo "   - REACT_APP_API_URL: $BACKEND_URL/api" 