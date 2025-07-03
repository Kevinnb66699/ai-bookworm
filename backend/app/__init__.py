from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
import os

# 初始化扩展
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 打印数据库连接信息
    print(f"Connecting to database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # 配置CORS - 支持多种URL格式
    allowed_origins = [
        "http://localhost:3000",
        "https://localhost:3000",
        # 各种可能的前端部署URL格式
        "https://ai-bookworm-frontend.vercel.app",
        "https://ai-bookworm-frontend-git-main-kevinnb66699.vercel.app",
        # 通用格式匹配
        "https://ai-bookworm-frontend-*.vercel.app",
        "https://ai-bookworm-frontend-git-*.vercel.app",
    ]
    
    # 从环境变量获取允许的域名
    if os.environ.get('ALLOWED_ORIGINS'):
        allowed_origins.extend(os.environ.get('ALLOWED_ORIGINS').split(','))
    
    print(f"CORS allowed origins: {allowed_origins}")
    
    # 使用通配符匹配所有Vercel部署URL
    def is_allowed_origin(origin):
        if not origin:
            return False
        
        # 检查精确匹配
        if origin in allowed_origins:
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
    
    # 修复CORS配置
    CORS(app, 
         origins=is_allowed_origin,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
         supports_credentials=False,
         max_age=3600)
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # 导入模型
    from .models import User, Course, Word, Text
    
    # 添加全局 OPTIONS 处理
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            from flask import make_response
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "*")
            response.headers.add('Access-Control-Allow-Methods', "*")
            return response

    # 注册蓝图
    from .routes import auth, course, word, review, text_recitation, reminder
    app.register_blueprint(auth.bp)
    app.register_blueprint(course.bp)
    app.register_blueprint(word.bp)
    app.register_blueprint(review.bp)
    app.register_blueprint(text_recitation.bp)
    app.register_blueprint(reminder.bp)
    
    return app

if __name__ == '__main__':
    app.run(debug=True) 