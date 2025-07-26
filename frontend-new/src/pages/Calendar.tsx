import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Typography,
  Tag,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import { PlusOutlined, SyncOutlined, GoogleOutlined } from "@ant-design/icons";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion } from "framer-motion";
import { calendarService } from "../services/api";
import "../types/google.d.ts";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Google Calendar API configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES =
  "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    priority?: string;
    mode?: string;
    description?: string;
    location?: string;
    event_type?: string;
    all_day?: boolean;
  };
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [eventDetailsVisible, setEventDetailsVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [form] = Form.useForm();
  const [googleAuth, setGoogleAuth] = useState<any>(null);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

  // Initialize Google API
  useEffect(() => {
    const initializeGoogleAPI = async () => {
      // Check if Google credentials are configured
      if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
        console.warn(
          "Google Calendar integration is not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY environment variables."
        );
        return;
      }

      if (typeof window !== "undefined" && window.gapi) {
        try {
          await window.gapi.load("client:auth2", async () => {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              clientId: GOOGLE_CLIENT_ID,
              discoveryDocs: [DISCOVERY_DOC],
              scope: SCOPES,
            });

            const authInstance = window.gapi.auth2.getAuthInstance();
            setGoogleAuth(authInstance);
            setIsGoogleSignedIn(authInstance.isSignedIn.get());

            // Listen for sign-in state changes
            authInstance.isSignedIn.listen(setIsGoogleSignedIn);
          });
        } catch (error) {
          console.error("Error initializing Google API:", error);
          console.warn(
            "Google Calendar integration failed to initialize. Please check your Google API configuration."
          );
        }
      } else {
        console.warn(
          "Google API not loaded. Google Calendar integration will not be available."
        );
      }
    };

    initializeGoogleAPI();
  }, []);

  // Load events from backend
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);

      // Default to current month if no dates provided
      const start =
        startDate ||
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString();
      const end =
        endDate ||
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

      const response = await calendarService.getEvents({
        start_date: start,
        end_date: end,
      });
      const formattedEvents = response.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: getEventTypeColor(event.event_type),
        borderColor: getEventTypeColor(event.event_type),
        extendedProps: {
          priority: event.priority || "medium",
          mode: event.event_type || "other",
          description: event.description,
          location: event.location,
          event_type: event.event_type,
          all_day: event.all_day,
        },
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      message.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "WORK":
        return "#1890ff";
      case "PERSONAL":
        return "#52c41a";
      case "MEETING":
        return "#fa8c16";
      case "TASK":
        return "#f5222d";
      case "BREAK":
        return "#722ed1";
      default:
        return "#13c2c2";
    }
  };

  const signInWithGoogle = async () => {
    if (googleAuth) {
      try {
        await googleAuth.signIn();
        message.success("Successfully connected to Google Calendar");
      } catch (error) {
        console.error("Error signing in with Google:", error);
        message.error("Failed to connect to Google Calendar");
      }
    }
  };

  const signOutFromGoogle = async () => {
    if (googleAuth) {
      try {
        await googleAuth.signOut();
        message.success("Disconnected from Google Calendar");
      } catch (error) {
        console.error("Error signing out from Google:", error);
        message.error("Failed to disconnect from Google Calendar");
      }
    }
  };

  const syncWithGoogleCalendar = async () => {
    if (!isGoogleSignedIn) {
      message.warning("Please connect to Google Calendar first");
      return;
    }

    try {
      setLoading(true);
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: "startTime",
      });

      const googleEvents =
        response.result.items?.map((event: any) => ({
          id: `google_${event.id}`,
          title: event.summary || "No Title",
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          backgroundColor: "#ea4335",
          borderColor: "#ea4335",
          extendedProps: {
            priority: "medium",
            mode: "Google Calendar",
            description: event.description,
            location: event.location,
            event_type: "google",
            all_day: !!event.start.date,
          },
        })) || [];

      // Combine backend events with Google events
      const start = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();
      const end = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const response2 = await calendarService.getEvents({
        start_date: start,
        end_date: end,
      });
      const backendEvents = response2.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: getEventTypeColor(event.event_type),
        borderColor: getEventTypeColor(event.event_type),
        extendedProps: {
          priority: event.priority || "medium",
          mode: event.event_type || "other",
          description: event.description,
          location: event.location,
          event_type: event.event_type,
          all_day: event.all_day,
        },
      }));

      setEvents([...backendEvents, ...googleEvents]);
      message.success("Successfully synced with Google Calendar");
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      message.error("Failed to sync with Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent({
      ...info.event.extendedProps,
      id: info.event.id,
      title: info.event.title,
      start: info.event.start || null,
      end: info.event.end || null,
    });
    setEventDetailsVisible(true);
  };

  const closeEventDetails = () => {
    setEventDetailsVisible(false);
    setSelectedEvent(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const eventData = {
        title: values.title,
        description: values.description || "",
        start_time: values.timeRange[0].toISOString(),
        end_time: values.timeRange[1].toISOString(),
        event_type: values.event_type,
        location: values.location || "",
        all_day: false,
        color: getEventTypeColor(values.event_type),
      };

      await calendarService.createEvent(eventData);
      message.success("Event created successfully");

      setIsModalVisible(false);
      form.resetFields();

      // Reload events to show the new one
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      message.error("Failed to create event");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#f5222d";
      case "medium":
        return "#fa8c16";
      case "low":
        return "#52c41a";
      default:
        return "#1890ff";
    }
  };

  const handleDateChange = (info: any) => {
    // Load events for the new date range when user navigates
    const start = info.startStr;
    const end = info.endStr;
    loadEvents(start, end);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return dateObj.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={4}>Calendar</Title>
            <div>
              {GOOGLE_CLIENT_ID && GOOGLE_API_KEY && (
                <>
                  {!isGoogleSignedIn ? (
                    <Button
                      icon={<GoogleOutlined />}
                      onClick={signInWithGoogle}
                      style={{ marginRight: 8 }}
                    >
                      Connect Google Calendar
                    </Button>
                  ) : (
                    <Button
                      icon={<SyncOutlined />}
                      onClick={syncWithGoogleCalendar}
                      style={{ marginRight: 8 }}
                      loading={loading}
                    >
                      Sync with Google
                    </Button>
                  )}
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddEvent}
              >
                Add Event
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Card>
        <Spin spinning={loading} tip="Loading events...">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDateChange}
            height="auto"
            aspectRatio={1.5}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            nowIndicator={true}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
          />
        </Spin>
      </Card>

      <Modal
        title="Add Event"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="Add"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Event Title"
            rules={[{ required: true, message: "Please enter event title" }]}
          >
            <Input placeholder="Enter event title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Enter event description (optional)"
            />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Time Range"
            rules={[{ required: true, message: "Please select time range" }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item name="location" label="Location">
            <Input placeholder="Enter location (optional)" />
          </Form.Item>

          <Form.Item
            name="event_type"
            label="Event Type"
            rules={[{ required: true, message: "Please select event type" }]}
          >
            <Select placeholder="Select event type">
              <Option value="WORK">Work</Option>
              <Option value="PERSONAL">Personal</Option>
              <Option value="MEETING">Meeting</Option>
              <Option value="TASK">Task</Option>
              <Option value="BREAK">Break</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Event Details"
        open={eventDetailsVisible}
        onCancel={closeEventDetails}
        footer={[
          <Button key="close" onClick={closeEventDetails}>
            Close
          </Button>,
          <Button key="edit" type="primary">
            Edit
          </Button>,
        ]}
      >
        {selectedEvent && (
          <div>
            <Title level={4}>{selectedEvent.title}</Title>
            <p>
              <strong>Start:</strong> {formatDate(selectedEvent.start)}
            </p>
            <p>
              <strong>End:</strong> {formatDate(selectedEvent.end)}
            </p>
            {selectedEvent.description && (
              <p>
                <strong>Description:</strong> {selectedEvent.description}
              </p>
            )}
            {selectedEvent.location && (
              <p>
                <strong>Location:</strong> {selectedEvent.location}
              </p>
            )}
            <p>
              <strong>Type:</strong>{" "}
              <Tag
                color={getEventTypeColor(
                  selectedEvent.event_type || selectedEvent.mode
                )}
              >
                {(
                  selectedEvent.event_type ||
                  selectedEvent.mode ||
                  "other"
                ).toUpperCase()}
              </Tag>
            </p>
            {selectedEvent.priority && (
              <p>
                <strong>Priority:</strong>{" "}
                <Tag color={getPriorityColor(selectedEvent.priority)}>
                  {selectedEvent.priority.toUpperCase()}
                </Tag>
              </p>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Calendar;
