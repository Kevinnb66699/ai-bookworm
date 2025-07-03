import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth } from '../services/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isLoggedIn: boolean;
    username: string;
    setIsLoggedIn: (value: boolean) => void;
    setUsername: (value: string) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // 验证token并获取用户信息
            auth.verifyToken()
                .then(response => {
                    setUser(response.data);
                    setIsLoggedIn(true);
                    setUsername(response.data.username);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                    setIsLoggedIn(false);
                    setUsername('');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await auth.login(email, password);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsLoggedIn(true);
        setUsername(response.data.user.username);
    };

    const register = async (email: string, password: string, username: string) => {
        const response = await auth.register(email, password, username);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsLoggedIn(true);
        setUsername(response.data.user.username);
    };

    const logout = async () => {
        try {
            await auth.logout();
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setIsLoggedIn(false);
            setUsername('');
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        const response = await auth.updateProfile(data);
        setUser(response.data);
        if (data.username) {
            setUsername(data.username);
        }
    };

    const value = {
        user,
        loading,
        isLoggedIn,
        username,
        setIsLoggedIn,
        setUsername,
        login,
        register,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 