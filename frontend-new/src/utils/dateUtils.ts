/**
 * Utility functions for date and time operations
 */

/**
 * Format a date to a readable string
 * @param date - Date to format
 * @param format - Format type ('full', 'date', 'time', 'datetime', 'relative')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format: 'full' | 'date' | 'time' | 'datetime' | 'relative' = 'full'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Format options
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const fullOptions: Intl.DateTimeFormatOptions = { ...dateOptions, ...timeOptions };

  switch (format) {
    case 'date':
      return dateObj.toLocaleDateString(undefined, dateOptions);
    case 'time':
      return dateObj.toLocaleTimeString(undefined, timeOptions);
    case 'datetime':
      return dateObj.toLocaleDateString(undefined, fullOptions);
    case 'relative':
      if (diffMs < 0) {
        return `in ${formatTimeDuration(-diffMs)}`;
      } else if (diffMs < 60000) { // less than a minute
        return 'just now';
      } else if (diffMs < 3600000) { // less than an hour
        const mins = Math.floor(diffMs / 60000);
        return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffMs < 86400000) { // less than a day
        const hours = Math.floor(diffMs / 3600000);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDays < 7) { // less than a week
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else if (diffDays < 30) { // less than a month
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else if (diffDays < 365) { // less than a year
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      } else { // more than a year
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
      }
    case 'full':
    default:
      return dateObj.toLocaleDateString(undefined, fullOptions);
  }
};

/**
 * Format a time duration in milliseconds to a readable string
 * @param ms - Duration in milliseconds
 * @param format - Format type ('short', 'long', 'timer')
 * @returns Formatted duration string
 */
export const formatTimeDuration = (ms: number, format: 'short' | 'long' | 'timer' = 'long'): string => {
  if (ms <= 0) {
    return format === 'timer' ? '00:00:00' : '0 seconds';
  }

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  switch (format) {
    case 'short':
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    case 'timer':
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    case 'long':
    default:
      const parts = [];
      if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
      }
      if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
      }
      if (seconds > 0 && hours === 0) { // Only show seconds if less than an hour
        parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
      }
      return parts.join(' ');
  }
};

/**
 * Get the start and end of a week containing the given date
 * @param date - Date within the week
 * @param startDay - Day to start the week (0 = Sunday, 1 = Monday, etc.)
 * @returns Object with start and end dates
 */
export const getWeekRange = (date: Date = new Date(), startDay: number = 1): { start: Date, end: Date } => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < startDay ? 7 : 0) + day - startDay;
  
  // Set to start of the week
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  const start = new Date(result);
  
  // Set to end of the week
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  
  return { start, end: result };
};

/**
 * Get the start and end of a month containing the given date
 * @param date - Date within the month
 * @returns Object with start and end dates
 */
export const getMonthRange = (date: Date = new Date()): { start: Date, end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns Boolean indicating if the date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns Boolean indicating if the date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  return dateObj.getTime() < now.getTime();
};

/**
 * Get a color based on the proximity to a deadline
 * @param deadline - Deadline date
 * @returns Color string (green, orange, red, or grey)
 */
export const getDeadlineColor = (deadline: Date | string | null): string => {
  if (!deadline) return 'grey';
  
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(deadlineDate.getTime())) return 'grey';
  
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffMs < 0) return 'red'; // Past deadline
  if (diffDays <= 1) return 'orange'; // Due within 24 hours
  if (diffDays <= 3) return 'gold'; // Due within 3 days
  return 'green'; // Due in more than 3 days
};

/**
 * Group dates by day, week, or month
 * @param dates - Array of dates to group
 * @param groupBy - Grouping type ('day', 'week', 'month')
 * @returns Object with grouped dates
 */
export const groupDatesByPeriod = <T>(items: T[], dateAccessor: (item: T) => Date | string, groupBy: 'day' | 'week' | 'month' = 'day'): Record<string, T[]> => {
  const result: Record<string, T[]> = {};
  
  items.forEach(item => {
    const date = dateAccessor(item);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return;
    
    let key: string;
    
    switch (groupBy) {
      case 'week':
        const weekRange = getWeekRange(dateObj);
        key = `${weekRange.start.toISOString().split('T')[0]} to ${weekRange.end.toISOString().split('T')[0]}`;
        break;
      case 'month':
        key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'day':
      default:
        key = dateObj.toISOString().split('T')[0];
        break;
    }
    
    if (!result[key]) {
      result[key] = [];
    }
    
    result[key].push(item);
  });
  
  return result;
};