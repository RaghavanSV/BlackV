/**
 * API Service Layer for BlackV C2 Frontend
 * 
 * This file centralizes all API calls to the Go backend server.
 * All endpoints use the base URL: http://localhost:8080/api
 * 
 * AUTHENTICATION:
 * - Most endpoints require a JWT token in the Authorization header
 * - Token is stored in localStorage after successful login
 * - Format: "Bearer <token>"
 */

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Get the authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('blackv_token');
};

/**
 * Create headers with authentication token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Handle API response and errors
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
};

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  token: string;
}

/**
 * Login to the C2 server
 * 
 * BACKEND ENDPOINT: POST /api/login
 * 
 * Expected Request Body:
 * {
 *   "username": "admin",
 *   "password": "password123"
 * }
 * 
 * Expected Response (200 OK):
 * {
 *   "id": "uuid-string",
 *   "username": "admin",
 *   "email": "admin@example.com",
 *   "role": "admin",
 *   "token": "jwt-token-string"
 * }
 * 
 * Expected Response (401 Unauthorized):
 * {
 *   "error": "Invalid credentials"
 * }
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse<LoginResponse>(response);
};

// ============================================================================
// DASHBOARD APIs
// ============================================================================

export interface DashboardMetrics {
  activeAgents: number;
  runningTasks: number;
  completedTasks: number;
  alerts: number;
  agentChange: string;
  taskQueuedCount: number;
  completedToday: number;
}

export interface RecentActivity {
  id: string;
  agent: string;
  action: string;
  time: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Fetch dashboard metrics
 * 
 * BACKEND ENDPOINT: GET /api/dashboard/metrics
 * 
 * Expected Response (200 OK):
 * {
 *   "activeAgents": 12,
 *   "runningTasks": 8,
 *   "completedTasks": 847,
 *   "alerts": 3,
 *   "agentChange": "+3 from last hour",
 *   "taskQueuedCount": 2,
 *   "completedToday": 24
 * }
 */
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DashboardMetrics>(response);
};

/**
 * Fetch recent activity for dashboard
 * 
 * BACKEND ENDPOINT: GET /api/dashboard/activity
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "activity-uuid",
 *     "agent": "AGENT-001",
 *     "action": "Executed keylogger module",
 *     "time": "2 minutes ago",
 *     "status": "success"
 *   }
 * ]
 */
export const fetchRecentActivity = async (): Promise<RecentActivity[]> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/activity`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<RecentActivity[]>(response);
};

// ============================================================================
// AGENTS APIs
// ============================================================================

export interface Agent {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  user: string;
  status: 'active' | 'inactive';
  lastSeen: string;
}

/**
 * Fetch all agents
 * 
 * BACKEND ENDPOINT: GET /api/agents
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "AGENT-001",
 *     "hostname": "WIN-DESKTOP-01",
 *     "ip": "192.168.1.105",
 *     "os": "Windows 11 Pro",
 *     "user": "admin",
 *     "status": "active",
 *     "lastSeen": "2024-01-15T14:30:00Z"
 *   }
 * ]
 */
export const fetchAgents = async (): Promise<Agent[]> => {
  const response = await fetch(`${API_BASE_URL}/agents`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<any[]>(response);
  return data.map((agent) => ({
    id: agent.id,
    hostname: agent.hostname,
    ip: agent.ip,
    os: agent.os,
    user: agent.user,
    status: agent.status || 'active',
    lastSeen: agent.lastSeen || agent.last_seen || new Date().toISOString(),
  }));
};

/**
 * Delete an agent
 * 
 * BACKEND ENDPOINT: DELETE /api/agents/:agentId
 * 
 * Expected Response (200 OK):
 * {
 *   "message": "Agent deleted successfully"
 * }
 */
export const deleteAgent = async (agentId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
};

// ============================================================================
// TASKS APIs
// ============================================================================

export interface Task {
  id: string;
  agent: string;
  command: string;
  profile?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  time: string;
  createdAt?: string;
}

export interface CreateTaskRequest {
  agentId: string;
  command: string;
  profile?: string;
}

/**
 * Fetch all tasks
 * 
 * BACKEND ENDPOINT: GET /api/tasks
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "TASK-001",
 *     "agent": "AGENT-001",
 *     "command": "screenshot",
 *     "profile": "default",
 *     "status": "completed",
 *     "time": "5 min ago",
 *     "createdAt": "2024-01-15T14:30:00Z"
 *   }
 * ]
 */
export const fetchTasks = async (): Promise<Task[]> => {
  // NOTE: Backend uses singular noun: /api/task
  const response = await fetch(`${API_BASE_URL}/task`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Task[]>(response);
};

/**
 * Create a new task
 * 
 * BACKEND ENDPOINT: POST /api/tasks
 * 
 * Expected Request Body:
 * {
 *   "agentId": "AGENT-001",
 *   "command": "screenshot",
 *   "profile": "default"
 * }
 * 
 * Expected Response (201 Created):
 * {
 *   "id": "TASK-NEW",
 *   "agent": "AGENT-001",
 *   "command": "screenshot",
 *   "profile": "default",
 *   "status": "pending",
 *   "createdAt": "2024-01-15T14:30:00Z"
 * }
 */
export const createTask = async (task: CreateTaskRequest): Promise<Task> => {
  // NOTE: Backend uses singular noun: /api/task
  const response = await fetch(`${API_BASE_URL}/task`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });
  return handleResponse<Task>(response);
};

// ============================================================================
// RESULTS APIs
// ============================================================================

export interface TaskResult {
  id: string;
  taskId: string;
  agent: string;
  command: string;
  timestamp: string;
  output: string;
  status?: 'success' | 'error';
}

/**
 * Fetch all task results
 * 
 * BACKEND ENDPOINT: GET /api/results
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "RESULT-001",
 *     "taskId": "TASK-001",
 *     "agent": "AGENT-001",
 *     "command": "screenshot",
 *     "timestamp": "2024-01-15T14:32:18Z",
 *     "output": "Screenshot captured successfully\nFile saved: /tmp/screenshot.png",
 *     "status": "success"
 *   }
 * ]
 */
export const fetchResults = async (): Promise<TaskResult[]> => {
  const response = await fetch(`${API_BASE_URL}/results`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TaskResult[]>(response);
};

/**
 * Delete a result
 * 
 * BACKEND ENDPOINT: DELETE /api/results/:resultId
 * 
 * Expected Response (200 OK):
 * {
 *   "message": "Result deleted successfully"
 * }
 */
export const deleteResult = async (resultId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/results/${resultId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
};

/**
 * Download result file
 * 
 * BACKEND ENDPOINT: GET /api/results/:resultId/download
 * 
 * Returns: Binary file data with appropriate Content-Disposition header
 */
export const downloadResult = async (resultId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/results/${resultId}/download`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Download failed');
  }
  return response.blob();
};

// ============================================================================
// PROFILES APIs
// ============================================================================

export interface Profile {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
}

/**
 * Fetch all profiles
 * 
 * BACKEND ENDPOINT: GET /api/profiles
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "default",
 *     "name": "Default Profile",
 *     "description": "Standard beacon configuration",
 *     "config": {
 *       "callbackInterval": 30,
 *       "jitter": 20,
 *       "maxRetries": 3,
 *       "timeout": 10,
 *       "userAgent": "Mozilla/5.0...",
 *       "encryption": true,
 *       "antiForensics": false
 *     }
 *   }
 * ]
 */
export const fetchProfiles = async (): Promise<Profile[]> => {
  const response = await fetch(`${API_BASE_URL}/profiles`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<any>(response);
  // Handle both array and { profiles: [...] } response formats
  const profilesArray = Array.isArray(data) ? data : (data.profiles || []);
  return profilesArray.map((p: any) => ({
    id: p.id || p.ID || '',
    name: p.name || p.Name || 'Unnamed Profile',
    description: p.description || p.Description || '',
    config: p.config || p.Config || {},
  }));
};

/**
 * Create a new profile
 * 
 * BACKEND ENDPOINT: POST /api/profiles
 * 
 * Expected Request Body:
 * {
 *   "name": "New Profile",
 *   "description": "Custom beacon profile",
 *   "config": { ... }
 * }
 * 
 * Expected Response (201 Created):
 * {
 *   "id": "new-profile",
 *   "name": "New Profile",
 *   "description": "Custom beacon profile",
 *   "config": { ... }
 * }
 */
export const createProfile = async (profile: Omit<Profile, 'id'>): Promise<Profile> => {
  const response = await fetch(`${API_BASE_URL}/profiles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(profile),
  });
  return handleResponse<Profile>(response);
};

/**
 * Update a profile
 * 
 * BACKEND ENDPOINT: PUT /api/profiles/:profileId
 * 
 * Expected Request Body:
 * {
 *   "name": "Updated Profile",
 *   "description": "Updated description",
 *   "config": { ... }
 * }
 * 
 * Expected Response (200 OK):
 * {
 *   "id": "profile-id",
 *   "name": "Updated Profile",
 *   "description": "Updated description",
 *   "config": { ... }
 * }
 */
export const updateProfile = async (profileId: string, profile: Partial<Profile>): Promise<Profile> => {
  const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profile),
  });
  return handleResponse<Profile>(response);
};

/**
 * Delete a profile
 * 
 * BACKEND ENDPOINT: DELETE /api/profiles/:profileId
 * 
 * Expected Response (200 OK):
 * {
 *   "message": "Profile deleted successfully"
 * }
 */
export const deleteProfile = async (profileId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
};

// ============================================================================
// ACTIVITY APIs
// ============================================================================

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'warning' | 'info';
  agent: string;
  event: string;
  details: string;
}

/**
 * Fetch activity logs
 * 
 * BACKEND ENDPOINT: GET /api/activity
 * 
 * Query Parameters:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "log-uuid",
 *     "timestamp": "2024-01-15T14:42:33Z",
 *     "type": "success",
 *     "agent": "AGENT-001",
 *     "event": "Task completed successfully",
 *     "details": "Screenshot captured and saved"
 *   }
 * ]
 */
export const fetchActivityLogs = async (limit = 50, offset = 0): Promise<ActivityLog[]> => {
  const response = await fetch(`${API_BASE_URL}/activity?limit=${limit}&offset=${offset}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ActivityLog[]>(response);
};

// ============================================================================
// USER MANAGEMENT APIs
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'operator' | 'viewer';
}

/**
 * Fetch all users (Admin only)
 * 
 * BACKEND ENDPOINT: GET /api/users
 * 
 * Expected Response (200 OK):
 * [
 *   {
 *     "id": "uuid-1",
 *     "username": "admin",
 *     "email": "admin@example.com",
 *     "role": "admin",
 *     "createdAt": "2024-01-01T00:00:00Z"
 *   }
 * ]
 * 
 * Expected Response (403 Forbidden):
 * {
 *   "error": "Access denied. Admin role required."
 * }
 */
export const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User[]>(response);
};

/**
 * Create a new user (Admin only)
 * 
 * BACKEND ENDPOINT: POST /api/users
 * 
 * Expected Request Body:
 * {
 *   "username": "newuser",
 *   "email": "newuser@example.com",
 *   "password": "securepassword",
 *   "role": "viewer"
 * }
 * 
 * Expected Response (201 Created):
 * {
 *   "id": "uuid-3",
 *   "username": "newuser",
 *   "email": "newuser@example.com",
 *   "role": "viewer",
 *   "createdAt": "2024-01-03T00:00:00Z"
 * }
 */
export const createUser = async (user: CreateUserRequest): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  });
  return handleResponse<User>(response);
};

/**
 * Delete a user (Admin only)
 * 
 * BACKEND ENDPOINT: DELETE /api/users/:userId
 * 
 * Expected Response (200 OK):
 * {
 *   "message": "User deleted successfully"
 * }
 */
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
};

// ============================================================================
// SETTINGS APIs
// ============================================================================

export interface Settings {
  serverUrl: string;
  wsUrl: string;
  callbackInterval: number;
  maxAgents: number;
  logLevel: string;
  encryptionEnabled: boolean;
}

/**
 * Fetch server settings
 * 
 * BACKEND ENDPOINT: GET /api/settings
 * 
 * Expected Response (200 OK):
 * {
 *   "serverUrl": "http://localhost:8080",
 *   "wsUrl": "ws://localhost:8080",
 *   "callbackInterval": 30,
 *   "maxAgents": 100,
 *   "logLevel": "info",
 *   "encryptionEnabled": true
 * }
 */
export const fetchSettings = async (): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Settings>(response);
};

/**
 * Update server settings (Admin only)
 * 
 * BACKEND ENDPOINT: PUT /api/settings
 * 
 * Expected Request Body:
 * {
 *   "callbackInterval": 60,
 *   "maxAgents": 200,
 *   "logLevel": "debug"
 * }
 * 
 * Expected Response (200 OK):
 * {
 *   "serverUrl": "http://localhost:8080",
 *   "wsUrl": "ws://localhost:8080",
 *   "callbackInterval": 60,
 *   "maxAgents": 200,
 *   "logLevel": "debug",
 *   "encryptionEnabled": true
 * }
 */
export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  return handleResponse<Settings>(response);
};
