import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentDetails from "./pages/AgentDetails";
import Tasks from "./pages/Tasks";
import Results from "./pages/Results";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Setting";
import Profiles from "./pages/Profiles";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import SidebarLayout from "./layouts/SidebarLayout";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes with sidebar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="agents" element={<Agents />} />
            <Route path="agents/:id" element={<AgentDetails />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="results" element={<Results />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profiles" element={<Profiles />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
