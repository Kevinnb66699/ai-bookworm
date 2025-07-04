import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button, message, Space, Tag } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  BookOutlined,
  SettingOutlined,
  ReadOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import CreateCourse from './components/Course/CreateCourse';
import WordPractice from './components/Practice/WordPractice';
import TextRecitation from './pages/TextRecitation';
import './App.css';

const { Header, Content, Footer } = Layout;

const PracticeRedirect: React.FC = () => {
  const { courseId } = useParams();
  return <Navigate to={`/courses/${courseId}?tab=practice`} replace />;
};

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isPremium, setIsPremium] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    message.success('退出登录成功！');
    navigate('/login');
  };

  const handleUpgrade = () => {
    message.info('支付功能开发中...');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
        个人信息
      </Menu.Item>
      <Menu.Item key="membership" icon={<CrownOutlined />}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>会员等级：{isPremium ? '升级版' : '普通版'}</span>
          {!isPremium && (
            <Button 
              type="primary" 
              size="small" 
              onClick={handleUpgrade}
              style={{ backgroundColor: '#ff85c0', borderColor: '#ff85c0' }}
            >
              升级
            </Button>
          )}
        </Space>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: 'courses',
      icon: <BookOutlined />,
      label: '课程',
      onClick: () => navigate('/courses'),
    },
    {
      key: 'text-recitation',
      icon: <ReadOutlined />,
      label: '课文背诵',
      onClick: () => navigate('/text-recitation'),
    },
  ];

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ color: 'white', margin: 0, marginRight: '20px' }}>AI 书童</h1>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['home']}
            items={menuItems}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Button type="text" style={{ color: 'white' }}>
            <Space>
              <Avatar icon={<UserOutlined />} />
              <span>{localStorage.getItem('username') || '用户名'}</span>
              <Tag color={isPremium ? 'gold' : 'default'}>
                {isPremium ? '升级版' : '普通版'}
              </Tag>
            </Space>
          </Button>
        </Dropdown>
      </Header>
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px - 70px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/create" element={<CreateCourse />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:id/edit" element={<CreateCourse />} />
          <Route path="/text-recitation" element={<TextRecitation />} />
          <Route path="/profile" element={<div>个人信息页面（开发中）</div>} />
          <Route path="/settings" element={<div>设置页面（开发中）</div>} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        AI 书童 ©{new Date().getFullYear()} Created by Your Name
      </Footer>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App; 