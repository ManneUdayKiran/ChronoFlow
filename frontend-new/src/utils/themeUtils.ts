import { theme } from "antd";
import { STORAGE_KEYS, getStorageItem, setStorageItem } from "./storageUtils";

// Theme types
export type ThemeMode = "light" | "dark" | "system";

// Priority colors for tasks and events
export const priorityColors = {
  high: "#f5222d", // Red
  medium: "#fa8c16", // Orange
  low: "#52c41a", // Green
  none: "#d9d9d9", // Light grey
};

// Tag colors for different categories
export const tagColors = [
  "#108ee9", // Blue
  "#722ed1", // Purple
  "#eb2f96", // Pink
  "#fa8c16", // Orange
  "#a0d911", // Lime
  "#13c2c2", // Cyan
  "#fa541c", // Volcano
  "#2f54eb", // Geekblue
  "#52c41a", // Green
  "#faad14", // Gold
];

// Get a consistent color for a tag based on its name
export const getTagColor = (tagName: string): string => {
  // Simple hash function to get a consistent index
  const hash = tagName.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return tagColors[hash % tagColors.length];
};

// Get system preference for dark mode
export const getSystemThemePreference = (): "light" | "dark" => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

// Get current theme mode from storage or system preference
export const getCurrentThemeMode = (): "light" | "dark" => {
  const savedTheme = getStorageItem<ThemeMode>(STORAGE_KEYS.THEME, "system");

  if (savedTheme === "system") {
    return getSystemThemePreference();
  }

  return savedTheme;
};

// Set theme mode and save to storage
export const setThemeMode = (mode: ThemeMode): void => {
  setStorageItem(STORAGE_KEYS.THEME, mode);
};

// Listen for system theme changes
export const setupThemeListener = (
  callback: (isDark: boolean) => void
): (() => void) => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener("change", listener);

  // Return cleanup function
  return () => mediaQuery.removeEventListener("change", listener);
};

// Generate Ant Design theme config based on mode
export const generateThemeConfig = (mode: "light" | "dark") => {
  const { defaultAlgorithm, darkAlgorithm } = theme;

  return {
    algorithm: mode === "dark" ? darkAlgorithm : defaultAlgorithm,
    token: {
      // Custom token overrides
      colorPrimary: mode === "dark" ? "#1890ff" : "#1890ff",
      borderRadius: 6,
      // Dark theme specific colors
      colorBgContainer: mode === "dark" ? "#141414" : "#ffffff",
      colorBgElevated: mode === "dark" ? "#1f1f1f" : "#ffffff",
      colorBgLayout: mode === "dark" ? "#000000" : "#f0f2f5",
      colorText: mode === "dark" ? "#ffffff" : "#000000",
      colorTextSecondary:
        mode === "dark" ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)",
      colorBorder: mode === "dark" ? "#434343" : "#d9d9d9",
      colorSplit: mode === "dark" ? "#434343" : "#f0f0f0",
    },
    components: {
      // Component-specific token overrides
      Card: {
        colorBgContainer: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorBorderSecondary: mode === "dark" ? "#434343" : "#f0f0f0",
        boxShadow: mode === "dark" ? "none" : "0 1px 2px rgba(0, 0, 0, 0.03)",
      },
      Layout: {
        colorBgHeader: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorBgBody: mode === "dark" ? "#141414" : "#f0f2f5",
        colorBgTrigger: mode === "dark" ? "#1f1f1f" : "#ffffff",
      },
      Menu: {
        colorBgContainer: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorItemBg: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorItemBgSelected: mode === "dark" ? "#1890ff" : "#e6f7ff",
        colorItemBgHover: mode === "dark" ? "#262626" : "#f5f5f5",
      },
      Button: {
        colorBgContainer: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorBorder: mode === "dark" ? "#434343" : "#d9d9d9",
      },
      Input: {
        colorBgContainer: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorBorder: mode === "dark" ? "#434343" : "#d9d9d9",
      },
      Select: {
        colorBgContainer: mode === "dark" ? "#1f1f1f" : "#ffffff",
        colorBgElevated: mode === "dark" ? "#262626" : "#ffffff",
      },
      // Add more component overrides as needed
    },
  };
};

// Animation variants for framer-motion
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

// Responsive breakpoints (matching Ant Design's grid system)
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

// Helper to generate responsive styles
export const responsive = {
  isMobile: () => window.innerWidth < breakpoints.md,
  isTablet: () =>
    window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg,
  isDesktop: () => window.innerWidth >= breakpoints.lg,
};
