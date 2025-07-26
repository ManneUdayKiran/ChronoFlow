import axios from "axios";

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1", // Corrected to match backend API prefix
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Unauthorized - clear local storage and redirect to login
        localStorage.removeItem("token");
        // In a real app, you might redirect to login page
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Task related API calls
export const taskService = {
  getTasks: async (params?: {
    status?: string;
    priority?: string;
    tag?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
    skip?: number;
  }) => {
    const response = await api.get("/tasks", { params });
    return response;
  },

  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response;
  },

  createTask: async (taskData: any) => {
    const response = await api.post("/tasks", taskData);
    return response;
  },

  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response;
  },

  getTaskStats: async () => {
    const response = await api.get("/tasks/stats");
    return response;
  },
};

// Calendar related API calls
export const calendarService = {
  getEvents: async (params?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
  }) => {
    const response = await api.get("/calendar", { params });
    return response;
  },

  createEvent: async (eventData: any) => {
    const response = await api.post("/calendar", eventData);
    return response;
  },

  updateEvent: async (id: string, eventData: any) => {
    const response = await api.put(`/calendar/${id}`, eventData);
    return response;
  },

  deleteEvent: async (id: string) => {
    const response = await api.delete(`/calendar/${id}`);
    return response;
  },
};

// Pomodoro related API calls
export const pomodoroService = {
  getSettings: async () => {
    const response = await api.get("/pomodoro/settings");
    return response;
  },

  updateSettings: async (settingsData: any) => {
    const response = await api.put("/pomodoro/settings", settingsData);
    return response;
  },

  saveSession: async (sessionData: any) => {
    const response = await api.post("/pomodoro/sessions", sessionData);
    return response;
  },

  getSessionHistory: async (params?: {
    from_date?: string;
    to_date?: string;
    limit?: number;
  }) => {
    const response = await api.get("/pomodoro/sessions", { params });
    return response;
  },
};

// User related API calls
export const userService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post("/auth/login/json", credentials);
    return response;
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) => {
    const response = await api.post("/auth/register", userData);
    return response;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put("/users/profile", profileData);
    return response;
  },

  getPomodoroSettings: async () => {
    const response = await api.get("/users/pomodoro-settings");
    return response;
  },

  updatePomodoroSettings: async (settingsData: any) => {
    const response = await api.put("/users/pomodoro-settings", settingsData);
    return response;
  },

  updateNotificationSettings: async (notificationData: any) => {
    const response = await api.put("/users/profile", {
      notification_settings: notificationData,
    });
    return response;
  },

  updateThemePreference: async (theme: string) => {
    const response = await api.put("/users/profile", {
      theme_preference: theme,
    });
    return response;
  },
};

// AI suggestions related API calls
export const aiService = {
  getSuggestions: async () => {
    const response = await api.get("/ai/task-suggestions");
    return response;
  },

  getTaskSuggestions: async (input: string) => {
    const response = await api.post("/ai/analyze-task", {
      task_description: input,
      user_context: {},
    });
    return response;
  },

  getProductivityInsights: async (params: {
    time_period: "day" | "week" | "month";
    include_task_data?: boolean;
    include_pomodoro_data?: boolean;
    include_calendar_data?: boolean;
  }) => {
    const response = await api.post("/ai/productivity-insights", params);
    return response;
  },

  generateCompletion: async (
    messages: Array<{ role: string; content: string }>,
    model?: string
  ) => {
    const response = await api.post("/ai/completion", {
      messages,
      model: model || "anthropic/claude-3-sonnet:beta",
    });
    return response;
  },
};

export default api;
