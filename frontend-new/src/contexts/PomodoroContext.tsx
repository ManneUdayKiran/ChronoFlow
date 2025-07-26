import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { App } from "antd";
import {
  showBrowserNotification,
  requestNotificationPermission,
} from "../utils/notificationUtils";
import { pomodoroService } from "../services/api";

interface PomodoroSession {
  id: string; // Changed to string to match backend UUID
  startTime: Date;
  endTime: Date | null;
  duration: number;
  type: "focus" | "break" | "long-break";
  completed: boolean;
}

interface PomodoroContextType {
  // Timer settings
  focusDuration: number;
  setFocusDuration: (duration: number) => void;
  breakDuration: number;
  setBreakDuration: (duration: number) => void;
  longBreakDuration: number;
  setLongBreakDuration: (duration: number) => void;
  sessionsBeforeLongBreak: number;
  setSessionsBeforeLongBreak: (sessions: number) => void;
  autoStartBreaks: boolean;
  setAutoStartBreaks: (autoStart: boolean) => void;
  autoStartPomodoros: boolean;
  setAutoStartPomodoros: (autoStart: boolean) => void;

  // Timer state
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  currentMode: "focus" | "break" | "long-break";
  setCurrentMode: (mode: "focus" | "break" | "long-break") => void;
  completedSessions: number;
  setCompletedSessions: (sessions: number) => void;
  sessions: PomodoroSession[];
  setSessions: (sessions: PomodoroSession[]) => void;
  currentSession: PomodoroSession | null;
  setCurrentSession: (session: PomodoroSession | null) => void;

  // Functions
  startNewSession: (type: "focus" | "break" | "long-break") => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
  calculateProgress: () => number;
  getModeColor: () => string;
  calculateTotalFocusTime: () => number; // Returns total focus time in minutes
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(
  undefined
);

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error(
      "usePomodoroContext must be used within a PomodoroProvider"
    );
  }
  return context;
};

interface PomodoroProviderProps {
  children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({
  children,
}) => {
  // Get notification API from Ant Design App context
  const { notification } = App.useApp();

  // Timer settings - load from localStorage with defaults
  const [focusDuration, setFocusDuration] = useState(() => {
    const saved = localStorage.getItem("pomodoroFocusDuration");
    return saved ? parseInt(saved) : 25 * 60;
  });
  const [breakDuration, setBreakDuration] = useState(() => {
    const saved = localStorage.getItem("pomodoroBreakDuration");
    return saved ? parseInt(saved) : 5 * 60;
  });
  const [longBreakDuration, setLongBreakDuration] = useState(() => {
    const saved = localStorage.getItem("pomodoroLongBreakDuration");
    return saved ? parseInt(saved) : 15 * 60;
  });
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(() => {
    const saved = localStorage.getItem("pomodoroSessionsBeforeLongBreak");
    return saved ? parseInt(saved) : 4;
  });
  const [autoStartBreaks, setAutoStartBreaks] = useState(() => {
    const saved = localStorage.getItem("pomodoroAutoStartBreaks");
    return saved ? JSON.parse(saved) : true;
  });
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(() => {
    const saved = localStorage.getItem("pomodoroAutoStartPomodoros");
    return saved ? JSON.parse(saved) : false;
  });

  // Timer state - load from localStorage with defaults
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem("pomodoroTimeLeft");
    return saved
      ? parseInt(saved)
      : localStorage.getItem("pomodoroFocusDuration")
      ? parseInt(localStorage.getItem("pomodoroFocusDuration")!)
      : 25 * 60;
  });
  const [isActive, setIsActive] = useState(() => {
    const saved = localStorage.getItem("pomodoroIsActive");
    return saved ? JSON.parse(saved) : false;
  });
  const [currentMode, setCurrentMode] = useState<
    "focus" | "break" | "long-break"
  >(() => {
    const saved = localStorage.getItem("pomodoroCurrentMode");
    return saved ? JSON.parse(saved) : "focus";
  });
  const [completedSessions, setCompletedSessions] = useState(() => {
    const saved = localStorage.getItem("pomodoroCompletedSessions");
    return saved ? parseInt(saved) : 0;
  });
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(
    () => {
      const saved = localStorage.getItem("pomodoroCurrentSession");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          startTime: new Date(parsed.startTime),
          endTime: parsed.endTime ? new Date(parsed.endTime) : null,
        };
      }
      return null;
    }
  );

  // Notification settings (loaded from user preferences)
  const [notificationSettings, setNotificationSettings] = useState({
    enableNotifications: true,
    enableDesktopNotifications: true,
    enableSoundAlerts: true,
  });

  // Refs
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission on component mount
  useEffect(() => {
    if (notificationSettings.enableDesktopNotifications) {
      requestNotificationPermission();
    }
  }, [notificationSettings.enableDesktopNotifications]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
    );
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Timer logic - runs in background even when component is unmounted
  useEffect(() => {
    if (isActive) {
      timer.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer.current!);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timer.current) {
      clearInterval(timer.current);
    }

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [isActive]);

  // Sync timeLeft when mode changes and no session is active
  useEffect(() => {
    if (!currentSession && !isActive) {
      const correctDuration =
        currentMode === "focus"
          ? focusDuration
          : currentMode === "break"
          ? breakDuration
          : longBreakDuration;
      setTimeLeft(correctDuration);
    }
  }, [
    currentMode,
    focusDuration,
    breakDuration,
    longBreakDuration,
    currentSession,
    isActive,
  ]);

  // Auto-save sessions to localStorage whenever sessions or completedSessions change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToLocal(sessions, completedSessions);
    }
  }, [sessions, completedSessions]);

  // Persist timer settings to localStorage
  useEffect(() => {
    localStorage.setItem("pomodoroFocusDuration", focusDuration.toString());
  }, [focusDuration]);

  useEffect(() => {
    localStorage.setItem("pomodoroBreakDuration", breakDuration.toString());
  }, [breakDuration]);

  useEffect(() => {
    localStorage.setItem(
      "pomodoroLongBreakDuration",
      longBreakDuration.toString()
    );
  }, [longBreakDuration]);

  useEffect(() => {
    localStorage.setItem(
      "pomodoroSessionsBeforeLongBreak",
      sessionsBeforeLongBreak.toString()
    );
  }, [sessionsBeforeLongBreak]);

  useEffect(() => {
    localStorage.setItem(
      "pomodoroAutoStartBreaks",
      JSON.stringify(autoStartBreaks)
    );
  }, [autoStartBreaks]);

  useEffect(() => {
    localStorage.setItem(
      "pomodoroAutoStartPomodoros",
      JSON.stringify(autoStartPomodoros)
    );
  }, [autoStartPomodoros]);

  // Persist timer state to localStorage
  useEffect(() => {
    localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
  }, [timeLeft]);

  useEffect(() => {
    localStorage.setItem("pomodoroIsActive", JSON.stringify(isActive));
  }, [isActive]);

  useEffect(() => {
    localStorage.setItem("pomodoroCurrentMode", JSON.stringify(currentMode));
  }, [currentMode]);

  useEffect(() => {
    localStorage.setItem(
      "pomodoroCompletedSessions",
      completedSessions.toString()
    );
  }, [completedSessions]);

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem(
        "pomodoroCurrentSession",
        JSON.stringify(currentSession)
      );
    } else {
      localStorage.removeItem("pomodoroCurrentSession");
    }
  }, [currentSession]);

  // Handle timer completion
  const handleTimerComplete = () => {
    console.log(
      "Timer completed - currentMode:",
      currentMode,
      "currentSession:",
      currentSession
    );

    // Play audio notification if enabled
    if (notificationSettings.enableSoundAlerts && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Update current session
    if (currentSession) {
      const endTime = new Date();
      const actualDurationMs =
        endTime.getTime() - currentSession.startTime.getTime();
      const actualDurationSeconds = Math.round(actualDurationMs / 1000);

      console.log(
        "Completing session:",
        currentSession.type,
        "actual duration:",
        actualDurationSeconds,
        "seconds"
      );

      const updatedSession = {
        ...currentSession,
        endTime: endTime,
        duration: actualDurationSeconds, // Store actual duration in seconds
        completed: true,
      };

      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((session) =>
          session.id === currentSession.id ? updatedSession : session
        );
        // Save to localStorage immediately when session completes
        const newCompletedCount =
          updatedSession.type === "focus"
            ? completedSessions + 1
            : completedSessions;
        console.log(
          "Session completed, updating completed count:",
          completedSessions,
          "->",
          newCompletedCount
        );
        saveSessionsToLocal(updatedSessions, newCompletedCount);
        return updatedSessions;
      });

      // Save completed session to backend
      saveSessionToBackend(updatedSession);

      setCurrentSession(null);
    }

    // Always show in-app notification (primary notification method)
    const sessionMessages = {
      focus: {
        message: "Focus Session Complete! 🎉",
        description: "Great job! Time for a well-deserved break.",
      },
      break: {
        message: "Break Complete! ⚡",
        description: "Break time is over. Ready to focus again?",
      },
      "long-break": {
        message: "Long Break Complete! 🚀",
        description: "Your long break is over. Ready for a new cycle?",
      },
    };

    const currentMessage = sessionMessages[currentMode];

    // Show Ant Design notification (always visible)
    notification.success({
      message: currentMessage.message,
      description: currentMessage.description,
      placement: "topRight",
      duration: 6,
    });

    // Try to show browser notification as well (if permission granted)
    if (notificationSettings.enableDesktopNotifications) {
      try {
        showBrowserNotification(currentMessage.message, {
          message: currentMessage.message,
          description: currentMessage.description,
        });
      } catch (error) {
        console.log("Browser notification failed:", error);
      }
    }

    // Request browser notification permission for future use
    if (Notification.permission === "default") {
      requestNotificationPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }

    if (currentMode === "focus") {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);

      console.log(
        "Focus session completed. Starting break. autoStartBreaks:",
        autoStartBreaks
      );

      // Always stop the timer first when transitioning between sessions
      setIsActive(false);

      // Determine if it's time for a long break
      if (newCompletedSessions % sessionsBeforeLongBreak === 0) {
        console.log("Time for long break");
        setCurrentMode("long-break");
        setTimeLeft(longBreakDuration);
        if (autoStartBreaks) {
          // Use setTimeout to ensure state updates are applied before starting new session
          setTimeout(() => {
            console.log(
              "Auto-starting long break session with duration:",
              longBreakDuration
            );
            startNewSession("long-break");
          }, 200); // Increased delay to ensure state updates
        }
      } else {
        console.log("Time for short break");
        setCurrentMode("break");
        setTimeLeft(breakDuration);
        if (autoStartBreaks) {
          // Use setTimeout to ensure state updates are applied before starting new session
          setTimeout(() => {
            console.log(
              "Auto-starting break session with duration:",
              breakDuration
            );
            startNewSession("break");
          }, 200); // Increased delay to ensure state updates
        }
      }
    } else {
      // After break, start a new focus session
      setCurrentMode("focus");
      setTimeLeft(focusDuration);
      setIsActive(false); // Always stop the timer first

      if (autoStartPomodoros) {
        // Use setTimeout to ensure state updates are applied before starting new session
        setTimeout(() => {
          startNewSession("focus");
        }, 200); // Increased delay to ensure state updates
      }
    }
  };

  // Load sessions from backend and localStorage on component mount
  useEffect(() => {
    const loadSessionHistory = async () => {
      try {
        // First, load from localStorage for immediate access
        const localSessions = localStorage.getItem("pomodoroSessions");
        const localCompletedSessions = localStorage.getItem(
          "pomodoroCompletedSessions"
        );

        if (localSessions) {
          const parsedSessions = JSON.parse(localSessions).map(
            (session: any) => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : null,
            })
          );
          setSessions(parsedSessions);
        }

        if (localCompletedSessions) {
          setCompletedSessions(parseInt(localCompletedSessions));
        }

        // Then try to sync with backend if authenticated
        const token = localStorage.getItem("token");
        if (!token) return; // Skip backend if not authenticated

        const response = await pomodoroService.getSessionHistory({
          limit: 100, // Load last 100 sessions
        });

        const backendSessions = response.data.map((session: any) => ({
          id: session.id,
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : null,
          duration: session.duration_minutes * 60, // Convert minutes to seconds
          type: session.session_type.toLowerCase() as
            | "focus"
            | "break"
            | "long-break",
          completed: session.status === "COMPLETED",
        }));

        // Merge with local sessions (backend takes precedence for completed sessions)
        const mergedSessions = [...backendSessions];

        // Add any local sessions that aren't in backend (e.g., in-progress sessions)
        if (localSessions) {
          const parsedLocalSessions = JSON.parse(localSessions);
          parsedLocalSessions.forEach((localSession: any) => {
            const existsInBackend = backendSessions.some(
              (bs: any) => bs.id === localSession.id
            );
            if (!existsInBackend) {
              mergedSessions.push({
                ...localSession,
                startTime: new Date(localSession.startTime),
                endTime: localSession.endTime
                  ? new Date(localSession.endTime)
                  : null,
              });
            }
          });
        }

        setSessions(mergedSessions);
        const backendCompletedCount = backendSessions.filter(
          (s: any) => s.completed && s.type === "focus"
        ).length;
        setCompletedSessions(backendCompletedCount);

        // Update localStorage with merged data
        localStorage.setItem(
          "pomodoroSessions",
          JSON.stringify(mergedSessions)
        );
        localStorage.setItem(
          "pomodoroCompletedSessions",
          backendCompletedCount.toString()
        );
      } catch (error) {
        console.error("Failed to load session history:", error);
        // Continue with local state if backend fails
      }
    };

    loadSessionHistory();
  }, []); // Only run once on mount

  // Save sessions to localStorage immediately for persistence
  const saveSessionsToLocal = (
    sessionsToSave: PomodoroSession[],
    completedCount: number
  ) => {
    try {
      localStorage.setItem("pomodoroSessions", JSON.stringify(sessionsToSave));
      localStorage.setItem(
        "pomodoroCompletedSessions",
        completedCount.toString()
      );
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
    }
  };

  // Save completed session to backend
  const saveSessionToBackend = async (session: PomodoroSession) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // Skip if not authenticated

      // Map frontend session types to backend expected format
      const getBackendSessionType = (type: string) => {
        switch (type) {
          case "focus":
            return "focus";
          case "break":
            return "short_break";
          case "long-break":
            return "long_break";
          default:
            return "focus";
        }
      };

      const sessionData = {
        session_type: getBackendSessionType(session.type),
        duration_minutes: Math.max(1, Math.round(session.duration / 60)), // Ensure minimum 1 minute
        status: session.completed ? "completed" : "interrupted",
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString() || new Date().toISOString(),
        notes: "", // Could be extended to include notes
      };

      console.log("Saving session to backend:", sessionData);
      const response = await pomodoroService.saveSession(sessionData);

      // Update session with backend ID if it was a temporary ID
      if (session.id.startsWith("temp_") && response.data.id) {
        setSessions((prevSessions) =>
          prevSessions.map((s) =>
            s.id === session.id ? { ...s, id: response.data.id } : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to save session to backend:", error);
      // Continue with local state if backend fails
    }
  };

  // Start a new session
  const startNewSession = (type: "focus" | "break" | "long-break") => {
    // Don't create a new session if there's already an active one
    if (currentSession && !currentSession.completed) {
      console.log("Session already active, not creating new one");
      setIsActive(true);
      return;
    }

    // Ensure the timer is set to the correct duration for the session type
    const sessionDuration =
      type === "focus"
        ? focusDuration
        : type === "break"
        ? breakDuration
        : longBreakDuration;

    console.log(`Starting new ${type} session with duration:`, sessionDuration);

    // Set the time left if it's not already set correctly
    setTimeLeft(sessionDuration);

    const newSession: PomodoroSession = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID until saved to backend
      startTime: new Date(),
      endTime: null,
      duration: sessionDuration,
      type,
      completed: false,
    };

    setSessions((prevSessions) => {
      const newSessions = [...prevSessions, newSession];
      // Save to localStorage immediately when session starts
      saveSessionsToLocal(newSessions, completedSessions);
      return newSessions;
    });
    setCurrentSession(newSession);
    setIsActive(true);

    console.log(`Session started - timeLeft should be:`, sessionDuration);
  };

  // Start or pause timer
  const toggleTimer = () => {
    if (!isActive && !currentSession) {
      startNewSession(currentMode);
    } else {
      setIsActive(!isActive);
    }
  };

  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(
      currentMode === "focus"
        ? focusDuration
        : currentMode === "break"
        ? breakDuration
        : longBreakDuration
    );

    // If there's an active session, mark it as incomplete
    if (currentSession) {
      const endTime = new Date();
      const actualDurationMs =
        endTime.getTime() - currentSession.startTime.getTime();
      const actualDurationSeconds = Math.round(actualDurationMs / 1000);

      const updatedSession = {
        ...currentSession,
        endTime: endTime,
        duration: actualDurationSeconds, // Store actual duration in seconds
        completed: false,
      };

      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((session) =>
          session.id === currentSession.id ? updatedSession : session
        );
        // Save to localStorage when session is interrupted
        saveSessionsToLocal(updatedSessions, completedSessions);
        return updatedSessions;
      });

      // Save interrupted session to backend
      saveSessionToBackend(updatedSession);

      setCurrentSession(null);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    const totalDuration =
      currentMode === "focus"
        ? focusDuration
        : currentMode === "break"
        ? breakDuration
        : longBreakDuration;
    return Math.round(((totalDuration - timeLeft) / totalDuration) * 100);
  };

  // Get color based on current mode
  const getModeColor = (): string => {
    switch (currentMode) {
      case "focus":
        return "#f5222d";
      case "break":
        return "#52c41a";
      case "long-break":
        return "#1890ff";
      default:
        return "#f5222d";
    }
  };

  // Calculate total focus time from completed sessions
  const calculateTotalFocusTime = (): number => {
    const completedFocusSessions = sessions.filter(
      (session) => session.type === "focus" && session.completed
    );

    console.log(
      "Calculating focus time - completed focus sessions:",
      completedFocusSessions
    );

    const totalTime = completedFocusSessions.reduce(
      (total, session) => total + Math.round(session.duration / 60),
      0
    );

    console.log("Total focus time calculated:", totalTime, "minutes");
    return totalTime;
  };

  // Update timeLeft when duration settings change
  useEffect(() => {
    if (!isActive && !currentSession) {
      setTimeLeft(
        currentMode === "focus"
          ? focusDuration
          : currentMode === "break"
          ? breakDuration
          : longBreakDuration
      );
    }
  }, [
    focusDuration,
    breakDuration,
    longBreakDuration,
    currentMode,
    isActive,
    currentSession,
  ]);

  const value: PomodoroContextType = {
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
    setTimeLeft,
    isActive,
    setIsActive,
    currentMode,
    setCurrentMode,
    completedSessions,
    setCompletedSessions,
    sessions,
    setSessions,
    currentSession,
    setCurrentSession,

    // Functions
    startNewSession,
    toggleTimer,
    resetTimer,
    formatTime,
    calculateProgress,
    getModeColor,
    calculateTotalFocusTime,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};
