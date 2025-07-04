import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import 'antd/dist/reset.css';

// 在开发环境中打印启动信息
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 AI书童前端启动');
  console.log('💡 直接连接后端，不使用代理');
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// 暂时禁用StrictMode进行调试
const AppComponent = process.env.NODE_ENV === 'development' ? (
  <AuthProvider>
    <App />
  </AuthProvider>
) : (
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

root.render(AppComponent); 