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
    
    # 配置CORS
    allowed_origins = [
        "http://localhost:3000",
        "https://localhost:3000",
        "https://ai-bookworm-frontend.vercel.app",
        "https://ai-bookworm-frontend-git-main-kevinnb66699.vercel.app"
    ]
    
    # 从环境变量获取允许的域名
    if os.environ.get('ALLOWED_ORIGINS'):
        allowed_origins.extend(os.environ.get('ALLOWED_ORIGINS').split(','))
    
    print(f"CORS allowed origins: {allowed_origins}")
    
    # 临时允许所有来源进行调试
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False
        }
    })
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # 导入模型
    from .models import User, Course, Word, Text
    
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