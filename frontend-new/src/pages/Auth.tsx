import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Divider,
  Space,
} from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { userService } from "../services/api";
import { useNavigate } from "react-router-dom";

const { Title, Text, Link } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  full_name: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onLoginFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const response = await userService.login(values);
      const { access_token } = response.data;

      // Store token in localStorage
      localStorage.setItem("token", access_token);

      message.success("Login successful!");
      navigate("/dashboard");
    } catch (error: any) {
      message.error(
        error.response?.data?.detail || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      const response = await userService.register(values);

      message.success("Registration successful! Please log in.");
      setIsLogin(true);
    } catch (error: any) {
      message.error(
        error.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          style={{
            width: 400,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            borderRadius: "12px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={2} style={{ color: "#1890ff", marginBottom: 8 }}>
              ChronoFlow
            </Title>
            <Text type="secondary">AI-Powered Time Management</Text>
          </div>

          {isLogin ? (
            <Form
              name="login"
              onFinish={onLoginFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Please input your username or email!",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Username or Email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 40 }}
                >
                  Sign In
                </Button>
              </Form.Item>

              <Divider>
                <Text type="secondary">New to ChronoFlow?</Text>
              </Divider>

              <Space
                direction="vertical"
                style={{ width: "100%", textAlign: "center" }}
              >
                <Button
                  type="link"
                  onClick={() => setIsLogin(false)}
                  style={{ padding: 0 }}
                >
                  Create an account
                </Button>
              </Space>
            </Form>
          ) : (
            <Form
              name="register"
              onFinish={onRegisterFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="full_name"
                rules={[
                  { required: true, message: "Please input your full name!" },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Full Name" />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="username"
                rules={[
                  { required: true, message: "Please input your username!" },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Username" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters!",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 40 }}
                >
                  Create Account
                </Button>
              </Form.Item>

              <Divider>
                <Text type="secondary">Already have an account?</Text>
              </Divider>

              <Space
                direction="vertical"
                style={{ width: "100%", textAlign: "center" }}
              >
                <Button
                  type="link"
                  onClick={() => setIsLogin(true)}
                  style={{ padding: 0 }}
                >
                  Sign in instead
                </Button>
              </Space>
            </Form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
