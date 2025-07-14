import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register, LoginData } from '../services/authService';

interface LoginProps {
  setIsLoggedIn: (value: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsLoggedIn }) => {
  const [loading, setLoading] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginData) => {
    setLoading(true);
    try {
      const response = await login(values);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', response.user.username);
        setIsLoggedIn(true);
        message.success('Login successful!');
        navigate('/');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Login failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values: { username: string; password: string; email: string }) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        password: values.password,
        email: values.email
      });
      message.success('Registration successful! Please login');
      setRegisterModalVisible(false);
      // 自动填充登录表单
      onFinish({ email: values.email, password: values.password });
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Registration failed, please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>AI Bookworm</h1>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input placeholder="Please enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Please enter your password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => setRegisterModalVisible(true)}>
              Don't have an account? Register now
            </Button>
          </div>
        </Form>
      </Card>

      <Modal
        title="Register New Account"
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
      >
        <Form
          name="register"
          onFinish={onRegisterFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email address!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              Register
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login; 