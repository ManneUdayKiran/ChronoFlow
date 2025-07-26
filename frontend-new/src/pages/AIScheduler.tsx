import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  DatePicker,
  Select,
  Timeline,
  Statistic,
  Progress,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  TimePicker,
  Switch,
  message,
  Tooltip,
  Alert,
  List,
  Badge,
  Divider,
} from "antd";
import {
  RobotOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BulbOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SettingOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { aiSchedulerService } from "../services/aiScheduler";
import type {
  SchedulingResponse,
  ScheduledTaskResult,
  UserSchedulingPreferences,
  SchedulingAnalytics,
} from "../services/aiScheduler";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AIScheduler: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [schedulingResult, setSchedulingResult] =
    useState<SchedulingResponse | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskResult[]>(
    []
  );
  const [preferences, setPreferences] =
    useState<UserSchedulingPreferences | null>(null);
  const [analytics, setAnalytics] = useState<SchedulingAnalytics | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs().add(7, "day"),
  ]);

  useEffect(() => {
    loadUserPreferences();
    loadTodaysSchedule();
    loadAnalytics();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const prefs = await aiSchedulerService.getUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const loadTodaysSchedule = async () => {
    try {
      const tasks = await aiSchedulerService.getTodaysSchedule();
      setScheduledTasks(tasks);
    } catch (error) {
      console.error("Failed to load scheduled tasks:", error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await aiSchedulerService.getSchedulingAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const handleScheduleTasks = async (
    timeRange: "today" | "week" | "custom"
  ) => {
    setLoading(true);
    try {
      let result: SchedulingResponse;

      if (timeRange === "today") {
        result = await aiSchedulerService.scheduleTasksForToday();
      } else if (timeRange === "week") {
        result = await aiSchedulerService.scheduleTasksForWeek();
      } else {
        result = await aiSchedulerService.scheduleTasks(
          dateRange[0].toISOString(),
          dateRange[1].toISOString()
        );
      }

      setSchedulingResult(result);
      loadTodaysSchedule(); // Refresh the schedule

      if (result.success) {
        message.success(
          `✨ Successfully scheduled ${result.scheduled_tasks.length} tasks!`
        );
      } else {
        message.warning(
          "Some tasks could not be scheduled. Check the results below."
        );
      }
    } catch (error) {
      message.error("Failed to schedule tasks. Please try again.");
      console.error("Scheduling error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await aiSchedulerService.updateTaskStatus(taskId, status as any);
      message.success("Task status updated!");
      loadTodaysSchedule();
    } catch (error) {
      message.error("Failed to update task status");
    }
  };

  const handleSavePreferences = async (values: any) => {
    try {
      await aiSchedulerService.updateUserPreferences(values);
      setPreferences(values);
      setShowPreferences(false);
      message.success(
        "Preferences saved! Next scheduling will use these settings."
      );
    } catch (error) {
      message.error("Failed to save preferences");
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "processing";
      case "scheduled":
        return "default";
      case "skipped":
        return "warning";
      default:
        return "default";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "#52c41a";
    if (score >= 0.6) return "#faad14";
    return "#ff4d4f";
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px" }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <RobotOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  🧠 AI Task Scheduler
                </Title>
                <Text type="secondary">
                  Intelligent scheduling powered by AI - optimized for your
                  productivity patterns
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setShowPreferences(true)}
              >
                Preferences
              </Button>
              <Button icon={<BarChartOutlined />} onClick={loadAnalytics}>
                Analytics
              </Button>
            </Space>
          </Col>
        </Row>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card title="🚀 Quick Schedule" style={{ marginBottom: "24px" }}>
          <Row gutter={16}>
            <Col span={8}>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                size="large"
                block
                loading={loading}
                onClick={() => handleScheduleTasks("today")}
              >
                Schedule Today
              </Button>
            </Col>
            <Col span={8}>
              <Button
                icon={<CalendarOutlined />}
                size="large"
                block
                loading={loading}
                onClick={() => handleScheduleTasks("week")}
              >
                Schedule This Week
              </Button>
            </Col>
            <Col span={8}>
              <Space.Compact style={{ width: "100%" }}>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange(dates)}
                  style={{ flex: 1 }}
                />
                <Button
                  icon={<CalendarOutlined />}
                  loading={loading}
                  onClick={() => handleScheduleTasks("custom")}
                >
                  Schedule
                </Button>
              </Space.Compact>
            </Col>
          </Row>

          {schedulingResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ marginTop: "16px" }}
            >
              <Alert
                type={schedulingResult.success ? "success" : "warning"}
                message={schedulingResult.scheduling_summary}
                description={
                  <div>
                    <p>
                      ✅ Scheduled: {schedulingResult.scheduled_tasks.length}{" "}
                      tasks
                    </p>
                    <p>
                      ⏱️ Total time:{" "}
                      {Math.round(
                        (schedulingResult.total_scheduled_time_minutes / 60) *
                          10
                      ) / 10}{" "}
                      hours
                    </p>
                    <p>
                      🎯 Efficiency:{" "}
                      {Math.round(
                        schedulingResult.schedule_efficiency_score * 100
                      )}
                      %
                    </p>
                    {schedulingResult.recommendations.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <Text strong>💡 AI Recommendations:</Text>
                        <ul style={{ marginTop: "4px", marginBottom: 0 }}>
                          {schedulingResult.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                }
                closable
              />
            </motion.div>
          )}
        </Card>
      </motion.div>

      <Row gutter={24}>
        {/* Today's Schedule */}
        <Col span={16}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  Today's AI-Generated Schedule
                  <Badge count={scheduledTasks.length} />
                </Space>
              }
              extra={
                <Button size="small" onClick={loadTodaysSchedule}>
                  Refresh
                </Button>
              }
            >
              {scheduledTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <RobotOutlined
                    style={{ fontSize: "48px", color: "#d9d9d9" }}
                  />
                  <p style={{ color: "#999", marginTop: "16px" }}>
                    No scheduled tasks for today. Click "Schedule Today" to get
                    started!
                  </p>
                </div>
              ) : (
                <Timeline>
                  {scheduledTasks.map((task) => (
                    <Timeline.Item
                      key={task.task_id}
                      color={getConfidenceColor(task.confidence_score)}
                      dot={
                        <Tooltip
                          title={`AI Confidence: ${Math.round(
                            task.confidence_score * 100
                          )}%`}
                        >
                          <StarOutlined
                            style={{
                              color: getConfidenceColor(task.confidence_score),
                            }}
                          />
                        </Tooltip>
                      }
                    >
                      <Card size="small" style={{ marginBottom: "8px" }}>
                        <Row justify="space-between" align="middle">
                          <Col span={16}>
                            <div>
                              <Text strong>{task.title}</Text>
                              <br />
                              <Text type="secondary">
                                {dayjs(task.scheduled_start).format("HH:mm")} -{" "}
                                {dayjs(task.scheduled_end).format("HH:mm")} (
                                {task.duration_minutes} min)
                              </Text>
                              <br />
                              <Text style={{ fontSize: "12px", color: "#666" }}>
                                💡 {task.reasoning}
                              </Text>
                            </div>
                          </Col>
                          <Col span={8} style={{ textAlign: "right" }}>
                            <Space direction="vertical" size="small">
                              <Progress
                                percent={Math.round(
                                  task.confidence_score * 100
                                )}
                                size="small"
                                status={
                                  task.confidence_score >= 0.7
                                    ? "success"
                                    : "normal"
                                }
                              />
                              <Space>
                                <Button
                                  size="small"
                                  icon={<PlayCircleOutlined />}
                                  onClick={() =>
                                    handleUpdateTaskStatus(
                                      task.task_id,
                                      "in_progress"
                                    )
                                  }
                                >
                                  Start
                                </Button>
                                <Button
                                  size="small"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() =>
                                    handleUpdateTaskStatus(
                                      task.task_id,
                                      "completed"
                                    )
                                  }
                                >
                                  Complete
                                </Button>
                              </Space>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* Analytics & Insights */}
        <Col span={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              title={
                <Space>
                  <TrophyOutlined />
                  Productivity Insights
                </Space>
              }
              style={{ marginBottom: "24px" }}
            >
              {analytics ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Completion Rate"
                        value={Math.round(analytics.completion_rate * 100)}
                        suffix="%"
                        valueStyle={{
                          color:
                            analytics.completion_rate >= 0.8
                              ? "#3f8600"
                              : "#cf1322",
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Accuracy Score"
                        value={Math.round(
                          analytics.scheduling_accuracy_score * 100
                        )}
                        suffix="%"
                        valueStyle={{
                          color:
                            analytics.scheduling_accuracy_score >= 0.7
                              ? "#3f8600"
                              : "#cf1322",
                        }}
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <div>
                    <Text strong>🔥 Peak Productivity Hour</Text>
                    <div style={{ fontSize: "24px", color: "#1890ff" }}>
                      {analytics.peak_productivity_hour
                        ? `${analytics.peak_productivity_hour}:00`
                        : "N/A"}
                    </div>
                  </div>

                  <div>
                    <Text strong>⭐ Top Time Slots</Text>
                    <List
                      size="small"
                      dataSource={analytics.most_productive_time_slots.slice(
                        0,
                        3
                      )}
                      renderItem={(slot) => (
                        <List.Item>
                          <Tag color="blue">{slot}</Tag>
                        </List.Item>
                      )}
                    />
                  </div>
                </Space>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <BarChartOutlined
                    style={{ fontSize: "32px", color: "#d9d9d9" }}
                  />
                  <p style={{ color: "#999", marginTop: "8px" }}>
                    Complete some scheduled tasks to see insights
                  </p>
                </div>
              )}
            </Card>

            {/* AI Tips */}
            <Card
              title={
                <Space>
                  <BulbOutlined />
                  AI Tips
                </Space>
              }
            >
              <List
                size="small"
                dataSource={[
                  "📅 Schedule important tasks during your peak hours",
                  "⚡ Break large tasks into 25-90 minute chunks",
                  "🔄 Use buffer time between meetings",
                  "🌅 Morning people: schedule creative work early",
                  "🌙 Evening people: save routine tasks for mornings",
                  "🎯 High-priority tasks get better time slots",
                ]}
                renderItem={(tip) => (
                  <List.Item>
                    <Text style={{ fontSize: "14px" }}>{tip}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Preferences Modal */}
      <Modal
        title="🛠️ Scheduling Preferences"
        open={showPreferences}
        onCancel={() => setShowPreferences(false)}
        footer={null}
        width={700}
      >
        {preferences && (
          <Form
            layout="vertical"
            initialValues={{
              ...preferences,
              work_start_time: dayjs(preferences.work_start_time, "HH:mm"),
              work_end_time: dayjs(preferences.work_end_time, "HH:mm"),
              peak_hours_start: dayjs(preferences.peak_hours_start, "HH:mm"),
              peak_hours_end: dayjs(preferences.peak_hours_end, "HH:mm"),
              avoid_scheduling_after: dayjs(
                preferences.avoid_scheduling_after,
                "HH:mm"
              ),
            }}
            onFinish={handleSavePreferences}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Work Start Time" name="work_start_time">
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Work End Time" name="work_end_time">
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Work Style" name="work_style">
              <Select>
                <Option value="morning_person">🌅 Morning Person</Option>
                <Option value="evening_person">🌙 Evening Person</Option>
                <Option value="flexible">🔄 Flexible</Option>
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Peak Hours Start" name="peak_hours_start">
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Peak Hours End" name="peak_hours_end">
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Buffer Time (minutes)"
                  name="buffer_time_minutes"
                >
                  <InputNumber min={0} max={60} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Avoid Scheduling After"
                  name="avoid_scheduling_after"
                >
                  <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="prefer_morning_for_hard_tasks"
              valuePropName="checked"
            >
              <Switch /> Prefer morning for difficult tasks
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Min Focus Block (min)"
                  name="minimum_focus_block_minutes"
                >
                  <InputNumber min={15} max={120} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Max Focus Block (min)"
                  name="maximum_focus_block_minutes"
                >
                  <InputNumber min={30} max={240} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save Preferences
                </Button>
                <Button onClick={() => setShowPreferences(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AIScheduler;
