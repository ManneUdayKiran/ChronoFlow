import React from "react";
import { Button, Card, Row, Col, Typography, Space } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  LoginOutlined,
  UserAddOutlined,
  RocketOutlined,
  TrophyOutlined,
  BulbOutlined,
  TeamOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const services = [
    {
      icon: <RobotOutlined style={{ fontSize: 48, color: "#722ed1" }} />,
      title: "🧠 AI Scheduler",
      description:
        "Revolutionary AI-powered task scheduling. Automatically generates optimal daily schedules based on your calendar, priorities, and productivity patterns.",
      path: "/dashboard", // Redirect to dashboard for authenticated access
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: 48, color: "#1890ff" }} />,
      title: "Pomodoro Timer",
      description:
        "Boost your productivity with our advanced Pomodoro technique timer. Track focus sessions, breaks, and maintain peak performance.",
      path: "/dashboard", // Redirect to dashboard for authenticated access
    },
    {
      icon: <CalendarOutlined style={{ fontSize: 48, color: "#52c41a" }} />,
      title: "Smart Calendar",
      description:
        "Organize your schedule with our intelligent calendar system. Sync with Google Calendar and never miss an important event.",
      path: "/dashboard",
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 48, color: "#fa8c16" }} />,
      title: "Task Management",
      description:
        "Create, organize, and track your tasks with priority levels. Get things done efficiently with our intuitive task manager.",
      path: "/dashboard",
    },
  ];

  const features = [
    {
      icon: <RocketOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
      title: "Boost Productivity",
      description:
        "Increase your efficiency by up to 300% with proven time management techniques.",
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 32, color: "#fa8c16" }} />,
      title: "Achieve Goals",
      description:
        "Turn your ambitions into achievements with structured planning and tracking.",
    },
    {
      icon: <BulbOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
      title: "Smart Insights",
      description:
        "Get intelligent recommendations based on your productivity patterns and habits.",
    },
    {
      icon: <TeamOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
      title: "Team Collaboration",
      description:
        "Work better together with shared calendars and collaborative task management.",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="home-container"
    >
      {/* Header */}
      <div className="home-header">
        <Row justify="space-between" align="middle">
          <Col>
            <motion.div variants={itemVariants}>
              <Title level={2} className="home-title">
                <ClockCircleOutlined style={{ marginRight: 10 }} />
                TimeFlow
              </Title>
            </motion.div>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                className="auth-button"
                icon={<LoginOutlined />}
                onClick={() => navigate("/auth")}
                style={{ color: "#111213ff" }}
              >
                Login
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => navigate("/auth")}
              >
                Sign Up
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Hero Section */}
      <div className="home-hero">
        <motion.div variants={itemVariants}>
          <Title level={1} className="hero-title">
            Master Your Time, Master Your Life
          </Title>
        </motion.div>

        <motion.div variants={itemVariants} className="home-hero-content">
          <Paragraph className="hero-description">
            Time is your most valuable asset - don't let it slip away unnoticed.
            Our comprehensive time management platform helps you reclaim control
            over your schedule, boost productivity, and achieve your goals with
            scientific precision. Whether you're a student, professional, or
            entrepreneur, our tools are designed to transform chaos into
            clarity. Join thousands of users who have already revolutionized
            their relationship with time and unlocked their true potential.
            Start your journey to peak productivity today and discover what you
            can accomplish when every moment counts.
          </Paragraph>
        </motion.div>

        <motion.div variants={itemVariants} className="home-hero-buttons">
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={() => navigate("/auth")}
              className="cta-button"
            >
              Get Started Free
            </Button>
            <Button
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate("/dashboard")}
              className="demo-button"
              style={{ color: "#111213ff" }}
            >
              Try Demo
            </Button>
          </Space>
        </motion.div>
      </div>

      {/* Services Section */}
      <div className="home-services">
        <motion.div variants={itemVariants} className="home-services-header">
          <Title level={2} style={{ color: "#001529" }}>
            Powerful Tools for Peak Performance
          </Title>
          <Paragraph className="services-intro">
            Everything you need to transform your productivity and achieve your
            goals in one integrated platform.
          </Paragraph>
        </motion.div>

        <Row gutter={[32, 32]}>
          {services.map((service, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <motion.div
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  hoverable
                  className="service-card"
                  onClick={() => navigate(service.path)}
                >
                  <div className="home-service-icon">{service.icon}</div>
                  <Title level={4} style={{ marginBottom: 15 }}>
                    {service.title}
                  </Title>
                  <Paragraph className="service-description">
                    {service.description}
                  </Paragraph>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Features Section */}
      <div className="home-features">
        <motion.div variants={itemVariants} className="home-features-header">
          <Title level={2} style={{ color: "#001529" }}>
            Why Choose TimeFlow?
          </Title>
        </motion.div>

        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <motion.div variants={itemVariants}>
                <Card className="feature-card">
                  <div className="home-feature-icon">{feature.icon}</div>
                  <Title level={5} style={{ marginBottom: 10 }}>
                    {feature.title}
                  </Title>
                  <Text style={{ color: "#666" }}>{feature.description}</Text>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Call to Action Section */}
      <div className="home-cta">
        <motion.div variants={itemVariants}>
          <Title level={2} style={{ color: "white", marginBottom: 20 }}>
            Ready to Transform Your Productivity?
          </Title>
          <Paragraph
            style={{
              fontSize: "1.1rem",
              color: "rgba(255, 255, 255, 0.9)",
              marginBottom: 30,
            }}
          >
            Join thousands of users who have already revolutionized their time
            management
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => navigate("/auth")}
            className="signup-button"
          >
            Start Your Free Trial
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="home-footer">
        <motion.div variants={itemVariants}>
          <Title level={4} className="footer-title">
            TimeFlow
          </Title>
          <Text className="footer-text">
            © 2025 TimeFlow. All rights reserved. Master your time, master your
            life.
          </Text>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
