@echo off
echo 🚀 开始部署 AI Bookworm 到 Vercel...

REM 检查是否安装了 Vercel CLI
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI 未安装，正在安装...
    npm install -g vercel
)

REM 检查是否已登录
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 请先登录 Vercel...
    vercel login
)

echo 📦 部署后端...
cd backend
vercel --prod

echo 📦 部署前端...
cd ..\frontend

echo ✅ 前端部署完成!

echo 🎉 部署完成!
echo 📝 请记得在 Vercel 控制台中配置环境变量：
echo    后端环境变量：
echo    - DATABASE_URL
echo    - JWT_SECRET_KEY
echo    - DASHSCOPE_API_KEY
echo    - ALIBABA_CLOUD_ACCESS_KEY_ID
echo    - ALIBABA_CLOUD_ACCESS_KEY_SECRET
echo    - ALLOWED_ORIGINS
echo.
echo    前端环境变量：
echo    - REACT_APP_API_URL: 你的后端URL/api

pause 