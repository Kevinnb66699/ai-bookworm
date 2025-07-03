import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="layout">
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/">AI书童</Link>
                </div>
                <div className="navbar-menu">
                    <Link to="/courses" className={isActive('/courses') ? 'active' : ''}>
                        课程
                    </Link>
                    <Link to="/review" className={isActive('/review') ? 'active' : ''}>
                        复习
                    </Link>
                    <Link to="/practice" className={isActive('/practice') ? 'active' : ''}>
                        练习
                    </Link>
                </div>
                <div className="navbar-end">
                    {user ? (
                        <div className="user-menu">
                            <span className="points">积分: {user.points}</span>
                            <span className="streak">连续学习: {user.streak_days}天</span>
                            <div className="dropdown">
                                <button className="dropdown-toggle">
                                    {user.username}
                                </button>
                                <div className="dropdown-menu">
                                    <Link to="/profile">个人资料</Link>
                                    <button onClick={logout}>退出登录</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-outline">登录</Link>
                            <Link to="/register" className="btn btn-primary">注册</Link>
                        </div>
                    )}
                </div>
            </nav>
            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

export default Layout; 