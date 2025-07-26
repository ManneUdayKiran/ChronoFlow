import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Progress,
  Typography,
  Row,
  Col,
  Select,
  Statistic,
  Switch,
  App,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";
import { usePomodoroContext } from "../contexts/PomodoroContext";
import SessionHistory from "../components/SessionHistory";

const { Title, Text } = Typography;
const { Option } = Select;

const Pomodoro: React.FC = () => {
  // Get notification API from Ant Design App context
  const { notification } = App.useApp();

  // State for Lottie animation
  const [lottieAnimationData, setLottieAnimationData] = useState<any>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Get all state and functions from context
  const {
    // Timer settings
    focusDuration,
    setFocusDuration,
    breakDuration,
    setBreakDuration,
    longBreakDuration,
    setLongBreakDuration,
    sessionsBeforeLongBreak,
    setSessionsBeforeLongBreak,
    autoStartBreaks,
    setAutoStartBreaks,
    autoStartPomodoros,
    setAutoStartPomodoros,

    // Timer state
    timeLeft,
    isActive,
    currentMode,
    completedSessions,

    // Functions
    toggleTimer,
    resetTimer,
    formatTime,
    calculateProgress,
    getModeColor,
    calculateTotalFocusTime,
  } = usePomodoroContext();

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

  // Control animation based on timer state
  useEffect(() => {
    if (lottieRef.current) {
      if (timeLeft === 0 || !isActive) {
        // Pause animation when timer reaches 00:00 or when timer is paused
        lottieRef.current.pause();
      } else {
        // Play animation when timer is active and not at 00:00
        lottieRef.current.play();
      }
    }
  }, [timeLeft, isActive]);

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
            <Card>
              <div style={{ textAlign: "center" }}>
                <Title level={3}>
                  {currentMode === "focus"
                    ? "Focus Time"
                    : currentMode === "break"
                    ? "Short Break"
                    : "Long Break"}
                </Title>
                <div style={{ margin: "30px 0" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={timeLeft}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Title style={{ fontSize: 80, margin: 0 }}>
                        {formatTime(timeLeft)}
                      </Title>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginBottom: 30,
                  }}
                >
                  <Progress
                    type="circle"
                    percent={calculateProgress()}
                    strokeColor={getModeColor()}
                    width={300}
                    format={() => ""}
                  />
                  {/* Lottie Animation - Show when timer is active, positioned in center of progress */}
                  {lottieAnimationData && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Lottie
                        lottieRef={lottieRef}
                        animationData={lottieAnimationData}
                        style={{
                          height: 180,
                          width: 180,
                        }}
                        loop={true}
                      />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 30 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={
                      isActive ? (
                        <PauseCircleOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={toggleTimer}
                    style={{ marginRight: 16, width: 120, height: 45 }}
                  >
                    {isActive ? "Pause" : "Start"}
                  </Button>
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    onClick={resetTimer}
                    style={{ width: 120, height: 45, marginRight: 16 }}
                  >
                    Reset
                  </Button>
                  {/* <Button
                    size="large"
                    onClick={() => {
                      // Test notification using App context
                      notification.success({
                        message: "Test Notification! 🎉",
                        description:
                          "This is a test to make sure notifications work.",
                        placement: "topRight",
                        duration: 4,
                      });
                    }}
                    style={{ width: 120, height: 45 }}
                  >
                    Test Alert
                  </Button> */}
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <motion.div variants={itemVariants}>
                <Card title="Statistics" extra={<SettingOutlined />}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Completed"
                        value={completedSessions}
                        suffix="sessions"
                        valueStyle={{ color: "#3f8600" }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Focus Time"
                        value={calculateTotalFocusTime()}
                        suffix="min"
                        valueStyle={{ color: "#cf1322" }}
                      />
                    </Col>
                  </Row>
                </Card>
              </motion.div>
            </Col>

            <Col span={24}>
              <motion.div variants={itemVariants}>
                <Card title="Settings">
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Focus Duration:</Text>
                    <Select
                      value={focusDuration / 60}
                      onChange={(value) => setFocusDuration(value * 60)}
                      style={{ width: "100%", marginTop: 8 }}
                    >
                      <Option value={0.1}>6 seconds (test)</Option>
                      <Option value={1}>1 minute</Option>
                      <Option value={25}>25 minutes</Option>
                      <Option value={30}>30 minutes</Option>
                      <Option value={45}>45 minutes</Option>
                      <Option value={60}>60 minutes</Option>
                    </Select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Short Break Duration:</Text>
                    <Select
                      value={breakDuration / 60}
                      onChange={(value) => setBreakDuration(value * 60)}
                      style={{ width: "100%", marginTop: 8 }}
                    >
                      <Option value={5}>5 minutes</Option>
                      <Option value={10}>10 minutes</Option>
                      <Option value={15}>15 minutes</Option>
                    </Select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Long Break Duration:</Text>
                    <Select
                      value={longBreakDuration / 60}
                      onChange={(value) => setLongBreakDuration(value * 60)}
                      style={{ width: "100%", marginTop: 8 }}
                    >
                      <Option value={15}>15 minutes</Option>
                      <Option value={20}>20 minutes</Option>
                      <Option value={30}>30 minutes</Option>
                    </Select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Sessions Before Long Break:</Text>
                    <Select
                      value={sessionsBeforeLongBreak}
                      onChange={(value) => setSessionsBeforeLongBreak(value)}
                      style={{ width: "100%", marginTop: 8 }}
                    >
                      <Option value={2}>2 sessions</Option>
                      <Option value={3}>3 sessions</Option>
                      <Option value={4}>4 sessions</Option>
                      <Option value={5}>5 sessions</Option>
                    </Select>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Auto-start Breaks:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Switch
                        checked={autoStartBreaks}
                        onChange={setAutoStartBreaks}
                      />
                    </div>
                  </div>

                  <div>
                    <Text strong>Auto-start Pomodoros:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Switch
                        checked={autoStartPomodoros}
                        onChange={setAutoStartPomodoros}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <motion.div variants={itemVariants}>
            <SessionHistory />
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Pomodoro;
