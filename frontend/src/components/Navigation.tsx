import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Dropdown, Button, Space, Layout } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  ReadOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;

const Navigation: React.FC = () => {
  const { isLoggedIn, username, setIsLoggedIn, setUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    //localStorage.clear(); // 清除缓存
    const token = localStorage.getItem('token');
    if (token) {
      const storedUsername = localStorage.getItem('username');
      setUsername(storedUsername || '');
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [setIsLoggedIn, setUsername]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/profile')}>
        <UserOutlined /> 个人资料
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> 退出登录
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: <Link to="/courses">课程</Link>,
    },
    {
      key: '/words',
      icon: <ReadOutlined />,
      label: <Link to="/words">单词</Link>,
    },
    {
      key: '/texts',
      icon: <ReadOutlined />,
      label: <Link to="/texts">课文</Link>,
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人中心</Link>,
    },
  ];

  return (
    <Header style={{ background: '#fff', padding: 0 }}>
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ lineHeight: '64px' }}
      />

      <Space>
        {isLoggedIn ? (
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Button type="text" style={{ color: '#fff' }}>
              <UserOutlined /> {username}
            </Button>
          </Dropdown>
        ) : (
          <>
            <Button type="text">
              <Link to="/register" style={{ color: '#fff' }}>注册</Link>
            </Button>
            <Button type="primary">
              <Link to="/login" style={{ color: '#fff' }}>登录</Link>
            </Button>
          </>
        )}
      </Space>
    </Header>
  );
};

const UserMenu = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { username } = useAuth();
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    setShowMenu(false);
  };

  const handleChangeUsername = () => {
    navigate('/profile'); // 假设更改用户名的页面路径为 /change-username
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave} 
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <span style={{ cursor: 'pointer' }}>{username}</span>
      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1
        }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: '10px' }}>
            <li style={{ padding: '5px 0' }}>
              <button onClick={handleChangeUsername}>Change Username</button>
            </li>
            {/* Add more menu items here if needed */}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Navigation; 