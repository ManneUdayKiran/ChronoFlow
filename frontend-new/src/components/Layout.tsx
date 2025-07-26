import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  theme,
  Typography,
  Avatar,
  Dropdown,
  Badge,
  Space,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  DashboardOutlined,
  PlusOutlined,
  UserOutlined,
  LogoutOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { usePomodoroContext } from "../contexts/PomodoroContext";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [lottieAnimationData, setLottieAnimationData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get Pomodoro context for status indicator
  const { isActive, currentMode, timeLeft, formatTime } = usePomodoroContext();

  // Load Lottie animation data
  useEffect(() => {
    const loadLottieData = async () => {
      try {
        const response = await fetch("/blue loading.json");
        const animationData = await response.json();
        setLottieAnimationData(animationData);
      } catch (error) {
        console.error("Failed to load Lottie animation:", error);
      }
    };

    loadLottieData();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/auth");
  }, [navigate]);

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      navigate(key);
    },
    [navigate]
  );

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const handleAddTask = useCallback(() => {
    navigate("/add-task");
  }, [navigate]);

  const userMenuItems = useMemo(
    () => [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profile",
        onClick: () => navigate("/settings"),
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout,
      },
    ],
    [navigate, handleLogout]
  );

  const menuItems = useMemo(
    () => [
      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
      },
      {
        key: "/ai-scheduler",
        icon: <RobotOutlined />,
        label: "AI Scheduler",
      },
      {
        key: "/calendar",
        icon: <CalendarOutlined />,
        label: "Calendar",
      },
      {
        key: "/pomodoro",
        icon: <ClockCircleOutlined />,
        label: "Pomodoro",
      },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: "Settings",
      },
    ],
    []
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={80}
        width={250}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="logo"
          style={{
            height: 64,
            margin: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            overflow: "hidden",
          }}
        >
          <Title
            level={4}
            style={{
              color: "white",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {!collapsed && "ChronoFlow"}
            {collapsed && "CF"}
          </Title>
        </motion.div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* Fixed Header connected to sidebar */}
      <Header
        style={{
          position: "fixed",
          top: 0,
          left: collapsed ? 80 : 250,
          right: 0,
          zIndex: 1001,
          padding: 0,
          background: colorBgContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          transition: "left 0.2s",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={handleToggleCollapse}
            style={{ fontSize: "16px", width: 48, height: 48 }}
          />
          <Title level={4} style={{ margin: 0, marginLeft: 8 }}>
            {menuItems.find((item) => item.key === location.pathname)?.label ||
              "Dashboard"}
          </Title>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: 24,
            marginBottom: "",
          }}
        >
          {/* Pomodoro Status Indicator */}
          {(isActive ||
            timeLeft < (currentMode === "focus" ? 25 * 60 : 5 * 60)) && (
            <Space style={{ marginRight: 16 }}>
              {/* Show Lottie animation when timer is active */}
              {isActive && lottieAnimationData ? (
                <Lottie
                  animationData={lottieAnimationData}
                  style={{
                    height: 20,
                    width: 20,
                    marginRight: 0,
                    marginBottom: 32,
                  }}
                  loop={true}
                />
              ) : (
                <Badge
                  status={isActive ? "processing" : "default"}
                  color={
                    currentMode === "focus"
                      ? "#f5222d"
                      : currentMode === "break"
                      ? "#52c41a"
                      : "#1890ff"
                  }
                />
              )}
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                {isActive ? (
                  <>
                    {formatTime(timeLeft)}{" "}
                    <span style={{ opacity: 0.7 }}>({currentMode})</span>
                  </>
                ) : (
                  <span style={{ opacity: 0.7 }}>Paused</span>
                )}
              </span>
              {isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            </Space>
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTask}
            style={{ marginRight: 16 }}
          >
            Add Task
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: "pointer" }} />
          </Dropdown>
        </div>
      </Header>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "all 0.2s",
          marginTop: 64,
        }}
      >
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
