/**
 * Utility functions for working with localStorage
 */

/**
 * Get an item from localStorage with type safety
 * @param key - The key to retrieve
 * @param defaultValue - Default value if key doesn't exist
 * @returns The parsed value or defaultValue
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Set an item in localStorage with type safety
 * @param key - The key to set
 * @param value - The value to store
 * @returns Boolean indicating success
 */
export const setStorageItem = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
    return false;
  }
};

/**
 * Remove an item from localStorage
 * @param key - The key to remove
 * @returns Boolean indicating success
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all items from localStorage
 * @returns Boolean indicating success
 */
export const clearStorage = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Get all keys from localStorage
 * @returns Array of keys
 */
export const getStorageKeys = (): string[] => {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('Error getting keys from localStorage:', error);
    return [];
  }
};

/**
 * Check if localStorage is available
 * @returns Boolean indicating if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Storage keys used in the application
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'chronoflow_auth_token',
  USER_PROFILE: 'chronoflow_user_profile',
  THEME: 'chronoflow_theme',
  POMODORO_SETTINGS: 'chronoflow_pomodoro_settings',
  NOTIFICATION_SETTINGS: 'chronoflow_notification_settings',
  RECENT_TASKS: 'chronoflow_recent_tasks',
  LANGUAGE: 'chronoflow_language',
};