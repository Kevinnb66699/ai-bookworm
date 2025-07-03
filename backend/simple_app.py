"""
简单的测试应用，用于验证 Vercel 部署
"""
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'AI Bookworm Backend is running!',
        'service': 'ai-bookworm-backend',
        'version': '1.0.0',
        'environment': os.environ.get('VERCEL_ENV', 'local')
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ai-bookworm-backend'
    })

@app.route('/api/test')
def api_test():
    return jsonify({
        'message': 'API is working',
        'endpoints': [
            '/',
            '/health',
            '/api/test'
        ]
    })

if __name__ == '__main__':
    app.run(debug=True) 