import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Switch,
  Select,
  Button,
  Tabs,
  Typography,
  Divider,
  Input,
  Row,
  Col,
  notification,
  Spin,
} from "antd";
import {
  SaveOutlined,
  BellOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { userService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

const { Title } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const [generalForm] = Form.useForm();
  const [pomodoroForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [accountForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pomodoroSettings, setPomodoroSettings] = useState<any>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Use theme context
  const { themeMode, setTheme } = useTheme();

  // Load user data and settings on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const profileResponse = await userService.getProfile();
      const profile = profileResponse.data;
      setUserProfile(profile);

      // Set form values for general settings - use theme context as source of truth
      generalForm.setFieldsValue({
        theme: themeMode,
        // Add other general settings based on your backend model
      });

      // Set form values for account settings
      accountForm.setFieldsValue({
        email: profile.email,
        fullName: profile.full_name || "",
        username: profile.username,
      });

      // Set notification form values
      notificationForm.setFieldsValue({
        enableNotifications:
          profile.notification_settings?.notifications_enabled ?? true,
        soundAlerts: profile.notification_settings?.sound_enabled ?? true,
        desktopNotifications:
          profile.notification_settings?.desktop_notifications ?? true,
        reminderTime: profile.notification_settings?.reminder_time ?? 5,
      });

      // Load Pomodoro settings
      try {
        const pomodoroResponse = await userService.getPomodoroSettings();
        const settings = pomodoroResponse.data;
        setPomodoroSettings(settings);

        pomodoroForm.setFieldsValue({
          focusDuration: settings.focus_duration_minutes,
          shortBreakDuration: settings.short_break_duration_minutes,
          longBreakDuration: settings.long_break_duration_minutes,
          sessionsBeforeLongBreak: settings.long_break_interval,
          autoStartBreaks: settings.auto_start_breaks,
          autoStartPomodoros: settings.auto_start_pomodoros,
        });
      } catch (error) {
        console.error("Error loading Pomodoro settings:", error);
        // Set default values if no settings exist
        pomodoroForm.setFieldsValue({
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: true,
          autoStartPomodoros: false,
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      notification.error({
        message: "Error",
        description: "Failed to load user settings. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSubmit = async (values: any) => {
    try {
      setSaving(true);

      // Update theme using context (immediate UI change)
      setTheme(values.theme);

      // Also save to backend
      await userService.updateThemePreference(values.theme);

      notification.success({
        message: "Settings Saved",
        description: "Your general settings have been updated successfully.",
      });

      // Reload user data to reflect changes
      await loadUserData();
    } catch (error) {
      console.error("Error saving general settings:", error);
      notification.error({
        message: "Error",
        description: "Failed to save general settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePomodoroSubmit = async (values: any) => {
    try {
      setSaving(true);

      const pomodoroData = {
        focus_duration_minutes: values.focusDuration,
        short_break_duration_minutes: values.shortBreakDuration,
        long_break_duration_minutes: values.longBreakDuration,
        long_break_interval: values.sessionsBeforeLongBreak,
        auto_start_breaks: values.autoStartBreaks,
        auto_start_pomodoros: values.autoStartPomodoros,
      };

      await userService.updatePomodoroSettings(pomodoroData);

      notification.success({
        message: "Settings Saved",
        description: "Your Pomodoro settings have been updated successfully.",
      });

      // Reload user data to reflect changes
      await loadUserData();
    } catch (error) {
      console.error("Error saving Pomodoro settings:", error);
      notification.error({
        message: "Error",
        description: "Failed to save Pomodoro settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSubmit = async (values: any) => {
    try {
      setSaving(true);

      const notificationData = {
        notifications_enabled: values.enableNotifications,
        sound_enabled: values.soundAlerts,
        desktop_notifications: values.desktopNotifications,
        reminder_time: values.reminderTime,
      };

      await userService.updateNotificationSettings(notificationData);

      notification.success({
        message: "Settings Saved",
        description:
          "Your notification settings have been updated successfully.",
      });

      // Reload user data to reflect changes
      await loadUserData();
    } catch (error) {
      console.error("Error saving notification settings:", error);
      notification.error({
        message: "Error",
        description: "Failed to save notification settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAccountSubmit = async (values: any) => {
    try {
      setSaving(true);

      const profileData = {
        full_name: values.fullName,
        // Add other profile fields as needed
      };

      await userService.updateProfile(profileData);

      notification.success({
        message: "Settings Saved",
        description: "Your account settings have been updated successfully.",
      });

      // Reload user data to reflect changes
      await loadUserData();
    } catch (error) {
      console.error("Error saving account settings:", error);
      notification.error({
        message: "Error",
        description: "Failed to save account settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const connectGoogle = () => {
    // In a real app, this would initiate OAuth flow
    setTimeout(() => {
      setIsGoogleConnected(true);
      notification.success({
        message: "Connected",
        description: "Successfully connected to Google Calendar.",
      });
    }, 1500);
  };

  const disconnectGoogle = () => {
    setIsGoogleConnected(false);
    notification.info({
      message: "Disconnected",
      description: "Google Calendar has been disconnected.",
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>Settings</Title>

      <Tabs defaultActiveKey="general">
        <Tabs.TabPane tab="General" key="general">
          <div>
            <Card>
              <Form
                form={generalForm}
                layout="vertical"
                onFinish={handleGeneralSubmit}
              >
                <Title level={5}>General Settings</Title>
                <Divider />

                <Form.Item name="theme" label="Theme">
                  <Select>
                    <Option value="light">Light</Option>
                    <Option value="dark">Dark</Option>
                    <Option value="system">System Default</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="startOfWeek" label="Start of Week">
                  <Select>
                    <Option value="sunday">Sunday</Option>
                    <Option value="monday">Monday</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="timeFormat" label="Time Format">
                  <Select>
                    <Option value="12h">12-hour (AM/PM)</Option>
                    <Option value="24h">24-hour</Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Save Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab="Pomodoro"
          key="pomodoro"
          icon={<ClockCircleOutlined />}
        >
          <div>
            <Card>
              <Form
                form={pomodoroForm}
                layout="vertical"
                onFinish={handlePomodoroSubmit}
              >
                <Title level={5}>Pomodoro Settings</Title>
                <Divider />

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="focusDuration"
                      label="Focus Duration (minutes)"
                    >
                      <Select>
                        <Option value={15}>15 minutes</Option>
                        <Option value={25}>25 minutes</Option>
                        <Option value={30}>30 minutes</Option>
                        <Option value={45}>45 minutes</Option>
                        <Option value={60}>60 minutes</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="shortBreakDuration"
                      label="Short Break Duration (minutes)"
                    >
                      <Select>
                        <Option value={5}>5 minutes</Option>
                        <Option value={10}>10 minutes</Option>
                        <Option value={15}>15 minutes</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="longBreakDuration"
                      label="Long Break Duration (minutes)"
                    >
                      <Select>
                        <Option value={15}>15 minutes</Option>
                        <Option value={20}>20 minutes</Option>
                        <Option value={30}>30 minutes</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="sessionsBeforeLongBreak"
                      label="Sessions Before Long Break"
                    >
                      <Select>
                        <Option value={2}>2 sessions</Option>
                        <Option value={3}>3 sessions</Option>
                        <Option value={4}>4 sessions</Option>
                        <Option value={5}>5 sessions</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="autoStartBreaks"
                  label="Auto-start Breaks"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="autoStartPomodoros"
                  label="Auto-start Pomodoros"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Save Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab="Notifications"
          key="notifications"
          icon={<BellOutlined />}
        >
          <div>
            <Card>
              <Form
                form={notificationForm}
                layout="vertical"
                onFinish={handleNotificationSubmit}
              >
                <Title level={5}>Notification Settings</Title>
                <Divider />

                <Form.Item
                  name="enableNotifications"
                  label="Enable Notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="soundAlerts"
                  label="Sound Alerts"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="desktopNotifications"
                  label="Desktop Notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="reminderTime"
                  label="Task Reminder (minutes before)"
                >
                  <Select>
                    <Option value={5}>5 minutes</Option>
                    <Option value={10}>10 minutes</Option>
                    <Option value={15}>15 minutes</Option>
                    <Option value={30}>30 minutes</Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Save Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Account" key="account" icon={<UserOutlined />}>
          <div>
            <Card>
              <Form
                form={accountForm}
                layout="vertical"
                onFinish={handleAccountSubmit}
              >
                <Title level={5}>Account Settings</Title>
                <Divider />

                <Form.Item name="email" label="Email">
                  <Input disabled />
                </Form.Item>

                <Form.Item name="username" label="Username">
                  <Input disabled />
                </Form.Item>

                <Form.Item name="fullName" label="Full Name">
                  <Input />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Save Account Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;
