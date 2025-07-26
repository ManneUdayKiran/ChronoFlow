import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  InputNumber,
  Row,
  Col,
  Typography,
  Tag,
  Divider,
  message,
} from "antd";
import {
  SaveOutlined,
  AudioOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { taskService } from "../services/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AddTask: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock function to simulate voice recognition
  const toggleVoiceRecognition = () => {
    setIsRecording(!isRecording);

    // Simulate receiving voice input after 2 seconds
    if (!isRecording) {
      setTimeout(() => {
        form.setFieldsValue({
          title: "Prepare presentation for team meeting",
          description:
            "Create slides for the quarterly review and prepare talking points.",
        });
        setIsRecording(false);

        // Simulate AI suggestions
        setAiSuggestions([
          "Schedule this for tomorrow morning when your energy is highest",
          "This task typically takes you 90 minutes to complete",
          "Consider using Pomodoro technique (3 sessions) for this task",
        ]);
      }, 2000);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      // Prepare task data
      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority || "medium",
        status: "todo",
        deadline: values.deadline ? values.deadline.toISOString() : null,
        estimated_time_minutes: values.estimated_time_minutes,
        tags: values.tags || [],
      };

      console.log("Creating task:", taskData);

      // Save task to backend
      const response = await taskService.createTask(taskData);
      console.log("Task created successfully:", response.data);

      message.success("Task created successfully!");

      // Navigate back to dashboard
      navigate("/");
    } catch (error: any) {
      console.error("Error creating task:", error);
      message.error("Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={16} lg={16} xl={16}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Title level={4}>Add New Task</Title>
                  <Button
                    icon={<AudioOutlined />}
                    type={isRecording ? "primary" : "default"}
                    danger={isRecording}
                    onClick={toggleVoiceRecognition}
                  >
                    {isRecording ? "Recording..." : "Voice Input"}
                  </Button>
                </div>
              }
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  priority: "medium",
                  estimatedTime: 30,
                }}
              >
                <Form.Item
                  name="title"
                  label="Task Title"
                  rules={[
                    { required: true, message: "Please enter task title" },
                  ]}
                >
                  <Input
                    placeholder="What do you need to do?"
                    prefix={<TagOutlined />}
                  />
                </Form.Item>

                <Form.Item name="description" label="Description">
                  <TextArea
                    rows={4}
                    placeholder="Add details about your task"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="deadline"
                      label="Deadline"
                      rules={[
                        { required: true, message: "Please select a deadline" },
                      ]}
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: "100%" }}
                        placeholder="Select date and time"
                        prefix={<CalendarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="estimatedTime"
                      label="Estimated Time (minutes)"
                      rules={[
                        {
                          required: true,
                          message: "Please enter estimated time",
                        },
                      ]}
                    >
                      <InputNumber
                        min={5}
                        max={480}
                        style={{ width: "100%" }}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="priority"
                      label="Priority"
                      rules={[
                        { required: true, message: "Please select priority" },
                      ]}
                    >
                      <Select placeholder="Select priority">
                        <Option value="high">High</Option>
                        <Option value="medium">Medium</Option>
                        <Option value="low">Low</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="tags" label="Tags">
                      <Select mode="tags" placeholder="Add tags">
                        <Option value="work">Work</Option>
                        <Option value="personal">Personal</Option>
                        <Option value="study">Study</Option>
                        <Option value="health">Health</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    size="large"
                    loading={loading}
                  >
                    Save Task
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <motion.div variants={itemVariants}>
            <Card title="AI Suggestions">
              {aiSuggestions.length > 0 ? (
                <>
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <Tag color="blue">AI Suggestion</Tag>
                      <Text>{suggestion}</Text>
                    </div>
                  ))}
                  <Divider />
                  <Text type="secondary">
                    These suggestions are based on your past behavior and
                    productivity patterns.
                  </Text>
                </>
              ) : (
                <Text type="secondary">
                  Add task details to receive AI-powered suggestions for optimal
                  scheduling and productivity.
                </Text>
              )}
            </Card>

            <Card title="Quick Templates" style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button
                  block
                  onClick={() => {
                    form.setFieldsValue({
                      title: "Team Meeting",
                      description: "Regular team sync-up meeting",
                      estimatedTime: 60,
                      priority: "medium",
                      tags: ["work", "meeting"],
                    });
                  }}
                >
                  Team Meeting
                </Button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Button
                  block
                  onClick={() => {
                    form.setFieldsValue({
                      title: "Project Deadline",
                      description: "Complete and submit project deliverables",
                      estimatedTime: 120,
                      priority: "high",
                      tags: ["work", "deadline"],
                    });
                  }}
                >
                  Project Deadline
                </Button>
              </div>
              <div>
                <Button
                  block
                  onClick={() => {
                    form.setFieldsValue({
                      title: "Study Session",
                      description: "Focused learning time",
                      estimatedTime: 90,
                      priority: "medium",
                      tags: ["study", "personal"],
                    });
                  }}
                >
                  Study Session
                </Button>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default AddTask;
