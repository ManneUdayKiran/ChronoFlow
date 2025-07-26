import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { generateThemeConfig } from "./utils/themeUtils";
import MainLayout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Pomodoro from "./pages/Pomodoro";
import Settings from "./pages/Settings";
import AddTask from "./pages/AddTask";
import AIScheduler from "./pages/AIScheduler";
import AuthPage from "./pages/Auth";
import "./App.css";
import "./styles/dark-theme.css";

// Inner App component that uses the theme context
const AppContent: React.FC = () => {
  const { currentTheme } = useTheme();
  const themeConfig = generateThemeConfig(currentTheme);

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <PomodoroProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Calendar />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pomodoro"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Pomodoro />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-task"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AddTask />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-scheduler"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AIScheduler />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </PomodoroProvider>
      </AntApp>
    </ConfigProvider>
  );
};

// Main App component with theme provider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
