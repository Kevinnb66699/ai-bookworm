@echo off
echo 🚀 开始通过 GitHub 部署 AI Bookworm...

REM 检查是否在 Git 仓库中
if not exist ".git" (
    echo 📝 初始化 Git 仓库...
    git init
    
    echo 📋 添加所有文件...
    git add .
    
    echo 💾 提交代码...
    git commit -m "Initial commit for deployment"
    
    echo 🔗 请手动添加 GitHub 远程仓库：
    echo 1. 在 GitHub 上创建新仓库
    echo 2. 运行: git remote add origin https://github.com/你的用户名/ai-bookworm.git
    echo 3. 运行: git push -u origin main
    echo.
    echo 然后按照以下步骤在 Vercel 控制台部署：
) else (
    echo 📋 添加更改的文件...
    git add .
    
    echo 💾 提交代码...
    git commit -m "Update for deployment"
    
    echo 🚀 推送到 GitHub...
    git push
    
    echo ✅ 代码已推送到 GitHub!
)

echo.
echo 📖 接下来的步骤：
echo 1. 访问 https://vercel.com/dashboard
echo 2. 点击 'New Project'
echo 3. 选择你的 GitHub 仓库
echo.
echo 🔧 部署后端：
echo - Root Directory: backend
echo - 配置环境变量：
echo   * DATABASE_URL
echo   * JWT_SECRET_KEY
echo   * DASHSCOPE_API_KEY
echo   * ALIBABA_CLOUD_ACCESS_KEY_ID
echo   * ALIBABA_CLOUD_ACCESS_KEY_SECRET
echo   * ALLOWED_ORIGINS
echo.
echo 🔧 部署前端：
echo - Root Directory: frontend
echo - 配置环境变量：
echo   * REACT_APP_API_URL: 你的后端 API 地址
echo.
echo 📚 详细说明请查看 GITHUB_DEPLOY.md 文件

pause 