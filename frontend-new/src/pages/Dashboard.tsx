import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Progress,
  List,
  Tag,
  Button,
  Statistic,
  Spin,
  message,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { taskService, pomodoroService, aiService } from "../services/api";
import { usePomodoroContext } from "../contexts/PomodoroContext";

const { Title, Text } = Typography;

// Types for API data
interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed" | "cancelled";
  estimated_time_minutes?: number;
  actual_time_minutes?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  upcoming_tasks: number;
  completion_rate: number;
  average_completion_time?: number;
  tasks_by_priority: Record<string, number>;
  tasks_by_tag: Record<string, number>;
}

interface PomodoroSession {
  id: string;
  session_type: "focus" | "short_break" | "long_break";
  duration_minutes: number;
  status: "completed" | "interrupted" | "skipped";
  start_time: string;
  end_time: string;
  related_task_id?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { sessions: localSessions } = usePomodoroContext(); // Get local sessions
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch tasks, task stats, and recent sessions in parallel
        const [tasksResponse, statsResponse, sessionsResponse] =
          await Promise.all([
            taskService.getTasks({ limit: 20 }), // Fetch all recent tasks, not just todo
            taskService.getTaskStats(),
            pomodoroService.getSessionHistory({ limit: 10 }),
          ]);

        setTasks(tasksResponse.data || []);
        setTaskStats(statsResponse.data);
        setSessions(sessionsResponse.data || []);

        // Debug logging
        console.log("Dashboard data loaded:");
        console.log("Tasks:", tasksResponse.data);
        console.log("Task Stats:", statsResponse.data);
        console.log("Sessions:", sessionsResponse.data);

        // Fetch AI suggestions
        try {
          const aiResponse = await aiService.getSuggestions();
          if (aiResponse.data && Array.isArray(aiResponse.data)) {
            // Extract suggestions text from API response
            const suggestions = aiResponse.data.map((item: any) => {
              if (typeof item === "string") {
                return item;
              } else if (item.title && item.description) {
                return `${item.title}: ${item.description}`;
              } else if (item.title) {
                return item.title;
              } else if (item.description) {
                return item.description;
              }
              return "Focus on your priorities";
            });
            setAiSuggestions(suggestions);
          } else {
            setAiSuggestions([
              "Consider organizing your tasks by priority to improve productivity.",
              "Try using the Pomodoro technique for better focus.",
              "Review your completed tasks to track your progress.",
            ]);
          }
        } catch (aiError) {
          console.log("AI suggestions not available:", aiError);
          // Set fallback suggestions
          setAiSuggestions([
            "Consider organizing your tasks by priority to improve productivity.",
            "Try using the Pomodoro technique for better focus.",
            "Review your completed tasks to track your progress.",
            "Take regular breaks to maintain energy throughout the day.",
            "Plan your most important tasks for your peak energy hours.",
          ]);
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        message.error(
          "Failed to load dashboard data. Please try refreshing the page."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      setTasksLoading(true);
      await taskService.updateTask(taskId, { status: "completed" });

      // Refresh tasks and stats
      const [tasksResponse, statsResponse] = await Promise.all([
        taskService.getTasks({ limit: 20 }), // Fetch all recent tasks
        taskService.getTaskStats(),
      ]);

      setTasks(tasksResponse.data || []);
      setTaskStats(statsResponse.data);
      message.success("Task completed successfully!");
    } catch (error: any) {
      console.error("Error completing task:", error);
      message.error("Failed to complete task. Please try again.");
    } finally {
      setTasksLoading(false);
    }
  };

  // Calculate focus time from sessions
  const calculateFocusTime = () => {
    const today = new Date().toDateString();

    // Calculate from backend sessions (in minutes)
    const backendFocusTime = sessions
      .filter(
        (session) =>
          new Date(session.start_time).toDateString() === today &&
          session.session_type === "focus" &&
          session.status === "completed"
      )
      .reduce((total, session) => total + session.duration_minutes, 0);

    // Calculate from local sessions (in seconds, convert to minutes)
    // Only include sessions that don't have a permanent ID (not yet synced to backend)
    const localFocusTime = localSessions
      .filter(
        (session) =>
          new Date(session.startTime).toDateString() === today &&
          session.type === "focus" &&
          session.completed &&
          session.id.startsWith("temp_") // Only count unsynced sessions
      )
      .reduce((total, session) => total + Math.round(session.duration / 60), 0);

    console.log(
      "Dashboard focus time - Backend:",
      backendFocusTime,
      "Local:",
      localFocusTime
    );

    // Return total focus time in minutes
    return backendFocusTime + localFocusTime;
  };

  // Generate focus plan from sessions or create a mock one
  const generateFocusPlan = () => {
    if (sessions.length === 0) {
      return [
        {
          time: "09:00 - 10:30",
          task: "Focus on priority tasks",
          mode: "Focus (Pomodoro)",
        },
        {
          time: "10:30 - 10:45",
          task: "Break",
          mode: "Rest",
        },
        {
          time: "10:45 - 12:15",
          task: "Continue with tasks",
          mode: "Focus (Pomodoro)",
        },
      ];
    }

    // Generate plan from recent sessions (simplified)
    return sessions.slice(0, 3).map((session, index) => ({
      time: `${new Date(session.start_time).toLocaleTimeString()} - ${new Date(
        session.end_time
      ).toLocaleTimeString()}`,
      task: session.related_task_id
        ? `Task: ${session.related_task_id}`
        : "Focus Session",
      mode: session.session_type === "focus" ? "Focus (Pomodoro)" : "Rest",
    }));
  };

  const focusPlan = generateFocusPlan();

  // Calculate productivity streak based on actual user activity
  const getProductivityStreak = () => {
    // Add completed tasks
    const completedTaskDates = tasks
      .filter((task) => task.status === "completed" && task.completed_at)
      .map((task) => new Date(task.completed_at!).toDateString());

    // Add completed focus sessions from backend
    const backendSessionDates = sessions
      .filter(
        (session) =>
          session.session_type === "focus" && session.status === "completed"
      )
      .map((session) => new Date(session.start_time).toDateString());

    // Add completed focus sessions from local context
    const localSessionDates = localSessions
      .filter((session) => session.type === "focus" && session.completed)
      .map((session) => new Date(session.startTime).toDateString());

    // Get unique dates with activity
    const uniqueActivityDates = Array.from(
      new Set([
        ...completedTaskDates,
        ...backendSessionDates,
        ...localSessionDates,
      ])
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort by most recent first

    if (uniqueActivityDates.length === 0) return 0;

    // Calculate consecutive days from today backwards
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Check if there's activity today or yesterday (to be more forgiving)
    const hasRecentActivity =
      uniqueActivityDates.includes(today) ||
      uniqueActivityDates.includes(yesterday);

    if (!hasRecentActivity) return 0;

    // Count consecutive days backwards from the most recent activity
    for (let i = 0; i < uniqueActivityDates.length; i++) {
      const currentDate = new Date(uniqueActivityDates[i]);
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

      // Allow for same day or within 1 day tolerance
      const dayDifference =
        Math.abs(currentDate.getTime() - expectedDate.getTime()) /
        (24 * 60 * 60 * 1000);

      if (dayDifference <= 1) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    return streak;
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const totalTasks = tasks.length;
  const completionRate = Math.round((completedTasks / totalTasks) * 100) || 0;
  const pendingTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress"
  ).length;
  const overdueCount = tasks.filter((task) => {
    if (task.status === "completed") return false;
    return task.deadline && new Date(task.deadline) < new Date();
  }).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Custom empty state component for tasks
  const renderTasksEmptyState = () => {
    const activeTasks = tasks.filter((task) => task.status !== "completed");

    if (tasks.length === 0) {
      // No tasks at all
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Text type="secondary">No tasks found</Text>
              <br />
              <Text type="secondary">
                Create your first task to get started!
              </Text>
            </div>
          }
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/add-task")}
          >
            Create New Task
          </Button>
        </Empty>
      );
    } else if (activeTasks.length === 0) {
      // All tasks completed
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Text type="secondary">All tasks completed! 🎉</Text>
              <br />
              <Text type="secondary">Great job! Ready for more?</Text>
            </div>
          }
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/add-task")}
          >
            Add New Task
          </Button>
        </Empty>
      );
    }

    return null; // Return null if there are active tasks (normal list will render)
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <motion.div variants={itemVariants}>
            <Card>
              <Statistic
                title="Task Completion"
                value={completionRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
              <Progress percent={completionRate} status="active" />
              <Text type="secondary">{`${completedTasks} of ${totalTasks} tasks completed`}</Text>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <motion.div variants={itemVariants}>
            <Card>
              <Statistic
                title="Focus Time Today"
                value={calculateFocusTime()}
                suffix="min"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
              <Progress
                percent={Math.round(
                  Math.min((calculateFocusTime() / 180) * 100, 100)
                )}
                status="active"
                strokeColor="#1890ff"
              />
              <Text type="secondary">{`${Math.round(
                Math.min((calculateFocusTime() / 180) * 100, 100)
              )}% of daily goal (180 min)`}</Text>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <motion.div variants={itemVariants}>
            <Card>
              <Statistic
                title="Productivity Streak"
                value={getProductivityStreak()}
                suffix="days"
                prefix={<FireOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
              <Progress
                percent={Math.min(getProductivityStreak() * 10, 100)}
                status="active"
                strokeColor="#ff4d4f"
              />
              <Text type="secondary">Keep it up!</Text>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={16} lg={16} xl={16}>
          <motion.div variants={itemVariants}>
            <Card
              title="Today's Tasks"
              extra={<Button type="link">View All</Button>}
            >
              {(() => {
                const activeTasks = tasks.filter(
                  (task) => task.status !== "completed"
                );
                const emptyState = renderTasksEmptyState();

                if (emptyState) {
                  return emptyState;
                }

                return (
                  <List
                    itemLayout="horizontal"
                    dataSource={activeTasks}
                    renderItem={(task) => (
                      <List.Item
                        actions={[
                          <Button
                            key="complete"
                            type="text"
                            icon={<CheckCircleOutlined />}
                            loading={tasksLoading}
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            Complete
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <Text strong>{task.title}</Text>
                              <Tag
                                color={getPriorityColor(task.priority)}
                                style={{ marginLeft: 8 }}
                              >
                                {task.priority.toUpperCase()}
                              </Tag>
                            </div>
                          }
                          description={
                            task.deadline
                              ? `Due: ${formatDate(task.deadline)}`
                              : "No due date"
                          }
                        />
                      </List.Item>
                    )}
                  />
                );
              })()}
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <motion.div variants={itemVariants}>
            <Card title="Today's Focus Plan">
              <List
                itemLayout="horizontal"
                dataSource={focusPlan}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.time}
                      description={
                        <div>
                          <Text>{item.task}</Text>
                          <br />
                          <Tag color={item.mode === "Rest" ? "green" : "blue"}>
                            {item.mode}
                          </Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
              <Button type="primary" block style={{ marginTop: 16 }}>
                Start Next Focus Session
              </Button>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <motion.div variants={itemVariants}>
            <Card title="AI Suggestions">
              <List
                itemLayout="horizontal"
                dataSource={aiSuggestions}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta description={item} />
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Dashboard;
