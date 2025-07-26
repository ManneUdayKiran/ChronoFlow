import api from "./api";

export interface TaskForScheduling {
  task_id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  deadline?: string;
  estimated_time_minutes: number;
  tags: string[];
  requires_focus?: boolean;
  can_be_split?: boolean;
  dependencies?: string[];
}

export interface ScheduledTaskResult {
  task_id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  confidence_score: number;
  reasoning: string;
  calendar_event_id?: string;
}

export interface SchedulingResponse {
  success: boolean;
  scheduled_tasks: ScheduledTaskResult[];
  unscheduled_tasks: string[];
  scheduling_summary: string;
  recommendations: string[];
  total_scheduled_time_minutes: number;
  schedule_efficiency_score: number;
}

export interface UserSchedulingPreferences {
  work_start_time: string;
  work_end_time: string;
  work_style: "morning_person" | "evening_person" | "flexible";
  peak_hours_start: string;
  peak_hours_end: string;
  buffer_time_minutes: number;
  prefer_morning_for_hard_tasks: boolean;
  avoid_scheduling_after: string;
  minimum_focus_block_minutes: number;
  maximum_focus_block_minutes: number;
}

export interface SchedulingAnalytics {
  user_id: string;
  date: string;
  total_tasks_scheduled: number;
  total_time_scheduled_minutes: number;
  completion_rate: number;
  average_task_duration_minutes: number;
  peak_productivity_hour?: number;
  most_productive_time_slots: string[];
  scheduling_accuracy_score: number;
}

class AISchedulerService {
  /**
   * 🧠 Schedule tasks using AI
   */
  async scheduleTasks(
    dateRangeStart: string,
    dateRangeEnd: string,
    taskIds?: string[],
    includeGoogleCalendar: boolean = true,
    forceReschedule: boolean = false
  ): Promise<SchedulingResponse> {
    const params = new URLSearchParams({
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      include_google_calendar: includeGoogleCalendar.toString(),
      force_reschedule: forceReschedule.toString(),
    });

    if (taskIds && taskIds.length > 0) {
      taskIds.forEach((id) => params.append("task_ids", id));
    }

    const response = await api.post(`/ai-scheduler/schedule-tasks?${params}`);
    return response.data;
  }

  /**
   * Get scheduled tasks for a date range
   */
  async getScheduledTasks(
    startDate?: string,
    endDate?: string,
    statusFilter?: string
  ): Promise<ScheduledTaskResult[]> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (statusFilter) params.set("status_filter", statusFilter);

    const response = await api.get(`/ai-scheduler/scheduled-tasks?${params}`);
    return response.data;
  }

  /**
   * Reschedule a specific task
   */
  async rescheduleTask(
    taskId: string,
    newStartTime: string,
    reason: string = "User requested"
  ): Promise<{ message: string }> {
    const response = await api.put(
      `/ai-scheduler/scheduled-tasks/${taskId}/reschedule`,
      {
        new_start_time: newStartTime,
        reason,
      }
    );
    return response.data;
  }

  /**
   * Update task status (start, complete, skip, etc.)
   */
  async updateTaskStatus(
    taskId: string,
    newStatus:
      | "pending"
      | "scheduled"
      | "in_progress"
      | "completed"
      | "skipped"
      | "rescheduled",
    actualStart?: string,
    actualEnd?: string
  ): Promise<{ message: string }> {
    const response = await api.put(
      `/ai-scheduler/scheduled-tasks/${taskId}/status`,
      {
        new_status: newStatus,
        actual_start: actualStart,
        actual_end: actualEnd,
      }
    );
    return response.data;
  }

  /**
   * Get user's scheduling preferences
   */
  async getUserPreferences(): Promise<UserSchedulingPreferences> {
    const response = await api.get("/ai-scheduler/preferences");
    return response.data;
  }

  /**
   * Update user's scheduling preferences
   */
  async updateUserPreferences(
    preferences: UserSchedulingPreferences
  ): Promise<{ message: string }> {
    const response = await api.put("/ai-scheduler/preferences", preferences);
    return response.data;
  }

  /**
   * Get scheduling analytics and productivity insights
   */
  async getSchedulingAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<SchedulingAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    const response = await api.get(`/ai-scheduler/analytics?${params}`);
    return response.data;
  }

  /**
   * Helper: Schedule tasks for today
   */
  async scheduleTasksForToday(taskIds?: string[]): Promise<SchedulingResponse> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      8,
      0
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      20,
      0
    );

    return this.scheduleTasks(
      startOfDay.toISOString(),
      endOfDay.toISOString(),
      taskIds
    );
  }

  /**
   * Helper: Schedule tasks for this week
   */
  async scheduleTasksForWeek(taskIds?: string[]): Promise<SchedulingResponse> {
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay(),
      8,
      0
    );
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() + 6,
      20,
      0
    );

    return this.scheduleTasks(
      startOfWeek.toISOString(),
      endOfWeek.toISOString(),
      taskIds
    );
  }

  /**
   * Helper: Get today's scheduled tasks
   */
  async getTodaysSchedule(): Promise<ScheduledTaskResult[]> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    return this.getScheduledTasks(
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );
  }

  /**
   * Helper: Get this week's scheduled tasks
   */
  async getWeekSchedule(): Promise<ScheduledTaskResult[]> {
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() + 7
    );

    return this.getScheduledTasks(
      startOfWeek.toISOString(),
      endOfWeek.toISOString()
    );
  }
}

export const aiSchedulerService = new AISchedulerService();
