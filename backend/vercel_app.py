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
    
    # 修复CORS配置
    @app.after_request
    def after_request(response):
        from flask import request
        origin = request.headers.get('Origin')
        allowed_origins = [
            "http://localhost:3000",
            "https://localhost:3000", 
            "https://ai-bookworm-frontend.vercel.app",
            "https://ai-bookworm-frontend-git-main-kevinnb66699.vercel.app"
        ]
        
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = allowed_origins[0]
            
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    # 处理所有 OPTIONS 请求
    @app.before_request
    def handle_options():
        from flask import request, make_response
        if request.method == "OPTIONS":
            origin = request.headers.get('Origin')
            allowed_origins = [
                "http://localhost:3000",
                "https://localhost:3000",
                "https://ai-bookworm-frontend.vercel.app", 
                "https://ai-bookworm-frontend-git-main-kevinnb66699.vercel.app"
            ]
            
            response = make_response()
            if origin in allowed_origins:
                response.headers['Access-Control-Allow-Origin'] = origin
            else:
                response.headers['Access-Control-Allow-Origin'] = allowed_origins[0]
                
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
    @app.after_request
    def after_request(response):
        from flask import request
        origin = request.headers.get('Origin')
        allowed_origins = [
            "http://localhost:3000",
            "https://localhost:3000", 
            "https://ai-bookworm-frontend.vercel.app",
            "https://ai-bookworm-frontend-git-main-kevinnb66699.vercel.app"
        ]
        
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = allowed_origins[0]
            
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    @app.before_request
    def handle_options():
        from flask import request, make_response
        if request.method == "OPTIONS":
            origin = request.headers.get('Origin')
            allowed_origins = [
                "http://localhost:3000",
                "https://localhost:3000",
                "https://ai-bookworm-frontend.vercel.app", 
                "https://ai-bookworm-frontend-git-main-kevinnb66699.vercel.app"
            ]
            
            response = make_response()
            if origin in allowed_origins:
                response.headers['Access-Control-Allow-Origin'] = origin
            else:
                response.headers['Access-Control-Allow-Origin'] = allowed_origins[0]
                
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