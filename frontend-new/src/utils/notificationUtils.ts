import { notification } from "antd";

// Types for notification
type NotificationType = "success" | "info" | "warning" | "error";
type NotificationPlacement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight";

interface NotificationOptions {
  message: string;
  description?: string;
  duration?: number;
  placement?: NotificationPlacement;
  onClick?: () => void;
}

/**
 * Show a notification with Ant Design's notification component
 * @param type - Type of notification (success, info, warning, error)
 * @param options - Notification options
 */
export const showNotification = (
  type: NotificationType,
  {
    message,
    description = "",
    duration = 4.5,
    placement = "topRight",
    onClick,
  }: NotificationOptions
) => {
  notification[type]({
    message,
    description,
    duration,
    placement,
    onClick,
  });
};

/**
 * Show a success notification
 * @param options - Notification options
 */
export const showSuccess = (options: NotificationOptions) => {
  showNotification("success", options);
};

/**
 * Show an info notification
 * @param options - Notification options
 */
export const showInfo = (options: NotificationOptions) => {
  showNotification("info", options);
};

/**
 * Show a warning notification
 * @param options - Notification options
 */
export const showWarning = (options: NotificationOptions) => {
  showNotification("warning", options);
};

/**
 * Show an error notification
 * @param options - Notification options
 */
export const showError = (options: NotificationOptions) => {
  showNotification("error", options);
};

/**
 * Show a task completion notification
 * @param taskName - Name of the completed task
 */
export const showTaskComplete = (taskName: string) => {
  showSuccess({
    message: "Task Completed",
    description: `You've completed "${taskName}"!`,
  });
};

/**
 * Show a pomodoro session notification
 * @param sessionType - Type of session (focus, break, long break)
 */
export const showPomodoroNotification = (
  sessionType: "focus" | "break" | "longBreak"
) => {
  const messages = {
    focus: {
      message: "Focus Session Complete",
      description: "Great job! Time for a break.",
    },
    break: {
      message: "Break Complete",
      description: "Break time is over. Ready to focus again?",
    },
    longBreak: {
      message: "Long Break Complete",
      description: "Your long break is over. Ready for a new cycle?",
    },
  };

  const { message, description } = messages[sessionType];
  showSuccess({ message, description });
};

/**
 * Show a deadline approaching notification
 * @param taskName - Name of the task
 * @param timeLeft - Time left description (e.g., "1 hour")
 */
export const showDeadlineNotification = (
  taskName: string,
  timeLeft: string
) => {
  showWarning({
    message: "Deadline Approaching",
    description: `"${taskName}" is due in ${timeLeft}.`,
    duration: 0, // Doesn't auto-close
  });
};

/**
 * Request permission for browser notifications
 * @returns Promise resolving to the permission state
 */
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      return await Notification.requestPermission();
    }

    return "denied";
  };

/**
 * Show a browser notification (not Ant Design)
 * @param title - Notification title
 * @param options - Browser notification options
 */
export const showBrowserNotification = (
  title: string,
  options?: NotificationOptions
) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    // Fall back to Ant Design notification
    showInfo({
      message: title,
      description: options?.description,
    });
    return;
  }

  // Show browser notification
  new Notification(title, {
    body: options?.description,
    icon: "/favicon.ico", // Add your app icon path
  });
};
