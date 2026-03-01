import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./components/layout/SidebarLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Tasks from "./pages/Tasks";
import Profiles from "./pages/Profiles";
import Results from "./pages/Results";
import Activity from "./pages/Activity";

import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WebSocketProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={
                <ProtectedRoute>
                  <SidebarLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/profiles" element={<Profiles />} />
                <Route path="/results" element={<Results />} />
                <Route path="/activity" element={<Activity />} />
                
                <Route path="/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <UserManagement />
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
