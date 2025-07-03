"""
Vercel 部署入口文件
"""
import os
import sys
import logging
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 确保能找到 app 模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # 导入应用工厂函数
    from app import create_app, db
    
    # 创建应用实例
    app = create_app()
    
    # 修复CORS配置 - 支持动态匹配
    def is_allowed_origin(origin):
        if not origin:
            return True  # 允许无Origin的请求（如本地文件）
        
        # 本地开发环境
        if origin in ["http://localhost:3000", "https://localhost:3000"]:
            return True
        
        # 允许本地文件测试（file:// 协议）
        if origin == "null" or origin == "file://" or origin.startswith("file://"):
            return True
        
        # 检查Vercel部署URL模式
        if origin.startswith('https://') and origin.endswith('.vercel.app'):
            domain = origin[8:-11]  # 去掉 'https://' 和 '.vercel.app'
            # 检查是否匹配前端项目名称模式（支持 frontend 和 frontend2）
            if (domain.startswith('ai-bookworm-frontend') or 
                domain.startswith('ai-bookworm-frontend2') or
                domain.startswith('ai-bookworm-frontend-git-') or
                domain.startswith('ai-bookworm-frontend2-git-') or
                domain.startswith('ai-bookworm-frontend-') or
                domain.startswith('ai-bookworm-frontend2-')):
                return True
        
        return False
    
    @app.after_request
    def after_request(response):
        # 强制设置CORS头部，不管什么情况
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    # 处理所有 OPTIONS 请求
    @app.before_request
    def handle_options():
        from flask import request, make_response
        if request.method == "OPTIONS":
            response = make_response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    # 添加健康检查路由
    @app.route('/')
    def health_check():
        return {
            'status': 'ok',
            'message': 'AI Bookworm Backend is running',
            'version': '1.0.0'
        }
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'ai-bookworm-backend'}
    
    # 初始化数据库表
    with app.app_context():
        try:
            db.create_all()
            logger.info("数据库表初始化完成")
        except Exception as db_error:
            logger.error(f"数据库初始化错误: {str(db_error)}")
        
except Exception as e:
    logger.error(f"应用初始化错误: {str(e)}")
    # 创建一个简单的 Flask 应用作为备用
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    # 为备用应用也添加 CORS 配置
    def is_allowed_origin_backup(origin):
        if not origin:
            return True  # 允许无Origin的请求（如本地文件）
        
        # 本地开发环境
        if origin in ["http://localhost:3000", "https://localhost:3000"]:
            return True
        
        # 允许本地文件测试（file:// 协议）
        if origin == "null" or origin == "file://" or origin.startswith("file://"):
            return True
        
        # 检查Vercel部署URL模式
        if origin.startswith('https://') and origin.endswith('.vercel.app'):
            domain = origin[8:-11]  # 去掉 'https://' 和 '.vercel.app'
            # 检查是否匹配前端项目名称模式（支持 frontend 和 frontend2）
            if (domain.startswith('ai-bookworm-frontend') or 
                domain.startswith('ai-bookworm-frontend2') or
                domain.startswith('ai-bookworm-frontend-git-') or
                domain.startswith('ai-bookworm-frontend2-git-') or
                domain.startswith('ai-bookworm-frontend-') or
                domain.startswith('ai-bookworm-frontend2-')):
                return True
        
        return False
    
    @app.after_request
    def after_request(response):
        # 强制设置CORS头部
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    @app.before_request
    def handle_options():
        from flask import request, make_response
        if request.method == "OPTIONS":
            response = make_response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    @app.route('/')
    def health_check():
        return jsonify({
            'status': 'error', 
            'message': f'应用初始化失败: {str(e)}',
            'service': 'ai-bookworm-backend'
        }), 500
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'error', 'message': str(e)}), 500

# 确保应用可以被 Vercel 发现
application = app

if __name__ == '__main__':
    app.run(debug=True) 