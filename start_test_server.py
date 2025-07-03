#!/usr/bin/env python3
"""
简单的本地HTTP服务器，用于测试CORS配置
使用方法：python start_test_server.py
然后在浏览器中打开 http://localhost:8000/test_cors.html
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

def start_server():
    print(f"🚀 启动本地测试服务器...")
    print(f"📍 服务器地址: http://localhost:{PORT}")
    print(f"🧪 测试页面: http://localhost:{PORT}/test_cors.html")
    print(f"⏹️  按 Ctrl+C 停止服务器")
    print()
    
    handler = CORSHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print(f"✅ 服务器已启动在端口 {PORT}")
            
            # 自动打开浏览器
            webbrowser.open(f'http://localhost:{PORT}/test_cors.html')
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用，请尝试关闭其他服务或更改端口")
        else:
            print(f"❌ 启动服务器时出错: {e}")

if __name__ == "__main__":
    # 确保在项目根目录运行
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    start_server() 