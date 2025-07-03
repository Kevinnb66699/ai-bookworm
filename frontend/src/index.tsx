import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import 'antd/dist/reset.css';
import { 
  corsProxyService, 
  enableCorsProxy, 
  disableCorsProxy, 
  testCorsProxy, 
  getProxyStatus, 
  switchCorsProxy 
} from './services/corsProxy';

// 在开发环境中将代理控制函数暴露到全局，方便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).corsProxy = {
    enable: enableCorsProxy,
    disable: disableCorsProxy,
    test: testCorsProxy,
    status: getProxyStatus,
    switch: switchCorsProxy,
    service: corsProxyService
  };
  
  console.log('🚀 CORS代理已初始化');
  console.log('💡 开发提示：可以在控制台使用 window.corsProxy 来控制代理');
  console.log('   - corsProxy.enable() - 启用代理');
  console.log('   - corsProxy.disable() - 禁用代理');
  console.log('   - corsProxy.test() - 测试代理');
  console.log('   - corsProxy.status() - 查看状态');
  console.log('   - corsProxy.switch() - 切换代理服务器');
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
); 