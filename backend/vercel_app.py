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
    
    # 初始化数据库表
    with app.app_context():
        db.create_all()
        logger.info("数据库表初始化完成")
        
except Exception as e:
    logger.error(f"应用初始化错误: {str(e)}")
    # 创建一个简单的 Flask 应用作为备用
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/')
    def health():
        return {'status': 'error', 'message': str(e)}, 500

# 确保应用可以被 Vercel 发现
application = app

if __name__ == '__main__':
    app.run(debug=True) 