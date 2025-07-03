import os
import sys
import logging
from dotenv import load_dotenv

# 自动加载.env文件
load_dotenv()

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入应用工厂函数
from app import create_app, db

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建应用实例
app = create_app()

# Vercel 需要这个导出
app.debug = False

# 初始化数据库表（仅在首次运行时）
try:
    with app.app_context():
        db.create_all()
        logger.info("数据库表初始化完成")
except Exception as e:
    logger.error(f"数据库初始化错误: {str(e)}")

if __name__ == '__main__':
    # 本地开发时运行
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 