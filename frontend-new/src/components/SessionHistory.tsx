import React, { useEffect, useState } from "react";
import { Card, List, Typography, Tag, Space, Statistic, Row, Col } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { usePomodoroContext } from "../contexts/PomodoroContext";

const { Title, Text } = Typography;

interface SessionHistoryProps {
  limit?: number;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ limit = 10 }) => {
  const { sessions } = usePomodoroContext();
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalFocusTime: 0,
    todaySessions: 0,
  });

  useEffect(() => {
    // Get recent sessions
    const sortedSessions = [...sessions]
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, limit);

    setRecentSessions(sortedSessions);

    // Calculate stats
    const completed = sessions.filter((s) => s.completed);
    const totalFocusTime = completed
      .filter((s) => s.type === "focus")
      .reduce((acc, s) => acc + s.duration / 60, 0); // Convert to minutes

    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      (s) => new Date(s.startTime).toDateString() === today && s.completed
    ).length;

    setStats({
      totalSessions: sessions.length,
      completedSessions: completed.length,
      totalFocusTime: Math.round(totalFocusTime),
      todaySessions,
    });
  }, [sessions, limit]);

  const getStatusIcon = (session: any) => {
    if (session.completed) {
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    }
    return <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "focus":
        return "#1890ff";
      case "break":
        return "#52c41a";
      case "long-break":
        return "#722ed1";
      default:
        return "#d9d9d9";
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedSessions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Focus Time"
              value={stats.totalFocusTime}
              suffix="min"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Today"
              value={stats.todaySessions}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Session History */}
      <Card>
        <Title level={4} style={{ marginBottom: 16 }}>
          Recent Sessions
        </Title>

        {recentSessions.length > 0 ? (
          <List
            dataSource={recentSessions}
            renderItem={(session: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStatusIcon(session)}
                  title={
                    <Space>
                      <Tag color={getTypeColor(session.type)}>
                        {session.type.charAt(0).toUpperCase() +
                          session.type.slice(1)}
                      </Tag>
                      <Text>{formatDuration(session.duration)}</Text>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">
                        {formatTime(session.startTime)}
                        {session.endTime && ` - ${formatTime(session.endTime)}`}
                      </Text>
                      <Text type="secondary">
                        {new Date(session.startTime).toLocaleDateString()}
                      </Text>
                    </Space>
                  }
                />
                <div>
                  <Tag color={session.completed ? "success" : "warning"}>
                    {session.completed ? "Completed" : "Interrupted"}
                  </Tag>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">
            No sessions yet. Start your first Pomodoro session!
          </Text>
        )}
      </Card>
    </motion.div>
  );
};

export default SessionHistory;
