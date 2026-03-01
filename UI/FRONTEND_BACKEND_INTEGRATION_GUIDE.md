# Frontend-Backend Integration Guide for BlackV C2

This comprehensive guide explains how the React frontend integrates with the Go backend server, including all API endpoints, expected JSON formats, and WebSocket communication.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Service Layer](#api-service-layer)
3. [Authentication](#authentication)
4. [Dashboard Integration](#dashboard-integration)
5. [Agents Page Integration](#agents-page-integration)
6. [Tasks Page Integration](#tasks-page-integration)
7. [Results Page Integration](#results-page-integration)
8. [Profiles Page Integration](#profiles-page-integration)
9. [Activity Page Integration](#activity-page-integration)
10. [User Management Integration](#user-management-integration)
11. [Settings Integration](#settings-integration)
12. [WebSocket Integration](#websocket-integration)
13. [Error Handling](#error-handling)
14. [Go Backend Implementation Examples](#go-backend-implementation-examples)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Pages      │  │  API Service │  │  WebSocket Context   │  │
│  │  (Dashboard, │──│  (api.ts)    │  │  (Real-time updates) │  │
│  │   Agents,    │  │              │  │                      │  │
│  │   Tasks...)  │  └──────────────┘  └──────────────────────┘  │
│  └──────────────┘         │                    │               │
│                           │                    │               │
└───────────────────────────┼────────────────────┼───────────────┘
                            │ HTTP/REST          │ WebSocket
                            ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Go Backend Server                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   REST API   │  │   WebSocket  │  │   Authentication     │  │
│  │   Handlers   │  │   Hub        │  │   (JWT)              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────┴──────────────────────────────────┐  │
│  │                    Data Storage                            │  │
│  │         (users.json, profiles.json, database)              │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Service Layer

The frontend uses a centralized API service located at `src/services/api.ts`. This file:

1. **Handles all HTTP requests** to the backend
2. **Manages authentication tokens** automatically
3. **Provides TypeScript interfaces** for type safety
4. **Includes error handling** for all requests

### Base Configuration

```typescript
const API_BASE_URL = 'http://localhost:8080/api';

// All authenticated requests include this header:
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <jwt-token>'
}
```

---

## Authentication

### Login Flow

**File:** `src/contexts/AuthContext.tsx`  
**Endpoint:** `POST /api/login`

#### Request
```json
{
  "username": "admin",
  "password": "password123"
}
```

#### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "email": "admin@blackv.local",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (401 Unauthorized)
```json
{
  "error": "Invalid credentials"
}
```

### Frontend Implementation

```typescript
// In AuthContext.tsx
const login = async (username: string, password: string) => {
  const response = await fetch('http://localhost:8080/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  const userData = await response.json();
  localStorage.setItem('auth_token', userData.token);
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
};
```

### Token Storage

- Token is stored in `localStorage` as `auth_token`
- User data is stored as `user`
- Token is included in all subsequent API requests

---

## Dashboard Integration

**File:** `src/pages/Dashboard.tsx`

### Endpoints

#### 1. Get Dashboard Metrics
**Endpoint:** `GET /api/dashboard/metrics`

**Response:**
```json
{
  "activeAgents": 12,
  "runningTasks": 8,
  "completedTasks": 847,
  "alerts": 3,
  "agentChange": "+3 from last hour",
  "taskQueuedCount": 2,
  "completedToday": 24
}
```

#### 2. Get Recent Activity
**Endpoint:** `GET /api/dashboard/activity`

**Response:**
```json
[
  {
    "id": "activity-001",
    "agent": "AGENT-001",
    "action": "Executed keylogger module",
    "time": "2 minutes ago",
    "status": "success"
  },
  {
    "id": "activity-002",
    "agent": "AGENT-007",
    "action": "Established persistence",
    "time": "5 minutes ago",
    "status": "success"
  }
]
```

### Frontend Usage

```typescript
// Load data on component mount
useEffect(() => {
  const loadData = async () => {
    const [metrics, activity] = await Promise.all([
      fetchDashboardMetrics(),
      fetchRecentActivity(),
    ]);
    setMetrics(metrics);
    setRecentActivity(activity);
  };
  loadData();
}, []);
```

---

## Agents Page Integration

**File:** `src/pages/Agents.tsx`

### Endpoints

#### 1. Get All Agents
**Endpoint:** `GET /api/agents`

**Response:**
```json
[
  {
    "id": "AGENT-001",
    "hostname": "WIN-DESKTOP-01",
    "ip": "192.168.1.105",
    "os": "Windows 11 Pro",
    "user": "admin",
    "status": "active",
    "lastSeen": "2024-01-15T14:30:00Z"
  },
  {
    "id": "AGENT-007",
    "hostname": "UBUNTU-SERVER",
    "ip": "10.0.0.42",
    "os": "Ubuntu 22.04 LTS",
    "user": "root",
    "status": "active",
    "lastSeen": "2024-01-15T14:28:00Z"
  }
]
```

#### 2. Delete Agent
**Endpoint:** `DELETE /api/agents/:agentId`

**Response:**
```json
{
  "message": "Agent deleted successfully"
}
```

### Real-time Updates

New agents are received via WebSocket with type `agent_created`:

```json
{
  "type": "agent_created",
  "data": {
    "id": "AGENT-NEW",
    "hostname": "NEW-COMPUTER",
    "ip": "192.168.1.200",
    "os": "Windows 10",
    "user": "user",
    "status": "active"
  },
  "timestamp": "2024-01-15T14:35:00Z"
}
```

---

## Tasks Page Integration

**File:** `src/pages/Tasks.tsx`

### Endpoints

#### 1. Get All Tasks
**Endpoint:** `GET /api/tasks`

**Response:**
```json
[
  {
    "id": "TASK-001",
    "agent": "AGENT-001",
    "command": "screenshot",
    "profile": "default",
    "status": "completed",
    "time": "5 min ago",
    "createdAt": "2024-01-15T14:30:00Z"
  }
]
```

#### 2. Create New Task
**Endpoint:** `POST /api/tasks`

**Request:**
```json
{
  "agentId": "AGENT-001",
  "command": "screenshot",
  "profile": "default"
}
```

**Response (201 Created):**
```json
{
  "id": "TASK-NEW",
  "agent": "AGENT-001",
  "command": "screenshot",
  "profile": "default",
  "status": "pending",
  "createdAt": "2024-01-15T14:35:00Z"
}
```

### Frontend Usage

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const newTask = await createTask({
    agentId: selectedAgent,
    command: command,
    profile: selectedProfile,
  });
  
  setTaskHistory((prev) => [newTask, ...prev]);
  toast.success("Task queued successfully");
};
```

### Real-time Updates

Tasks and results are updated via WebSocket:

**Task Created:**
```json
{
  "type": "task_created",
  "data": {
    "id": "TASK-NEW",
    "agent": "AGENT-001",
    "command": "screenshot",
    "status": "pending"
  }
}
```

**Task Result:**
```json
{
  "type": "task_result",
  "data": {
    "task_id": "TASK-NEW",
    "status": "completed",
    "output": "Screenshot captured successfully"
  }
}
```

---

## Results Page Integration

**File:** `src/pages/Results.tsx`

### Endpoints

#### 1. Get All Results
**Endpoint:** `GET /api/results`

**Response:**
```json
[
  {
    "id": "RESULT-001",
    "taskId": "TASK-001",
    "agent": "AGENT-001",
    "command": "screenshot",
    "timestamp": "2024-01-15T14:32:18Z",
    "output": "Screenshot captured successfully\nFile saved: /tmp/screenshot.png\nResolution: 1920x1080",
    "status": "success"
  }
]
```

#### 2. Delete Result
**Endpoint:** `DELETE /api/results/:resultId`

**Response:**
```json
{
  "message": "Result deleted successfully"
}
```

#### 3. Download Result
**Endpoint:** `GET /api/results/:resultId/download`

**Response:** Binary file with appropriate headers:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="result.txt"
```

### Frontend Usage

```typescript
// Delete a result
const handleDelete = async (resultId: string) => {
  await deleteResult(resultId);
  setResults((prev) => prev.filter((r) => r.id !== resultId));
  toast.success('Result deleted');
};

// Download a result
const handleDownload = async (result: TaskResult) => {
  const blob = await downloadResult(result.id);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.id}_${result.command}.txt`;
  a.click();
};
```

---

## Profiles Page Integration

**File:** `src/pages/Profiles.tsx`

### Endpoints

#### 1. Get All Profiles
**Endpoint:** `GET /api/profiles`

**Response:**
```json
[
  {
    "id": "default",
    "name": "Default Profile",
    "description": "Standard beacon configuration",
    "config": {
      "callbackInterval": 30,
      "jitter": 20,
      "maxRetries": 3,
      "timeout": 10,
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "encryption": true,
      "antiForensics": false
    }
  }
]
```

#### 2. Create Profile
**Endpoint:** `POST /api/profiles`

**Request:**
```json
{
  "name": "Stealth Mode",
  "description": "Low-visibility configuration",
  "config": {
    "callbackInterval": 300,
    "jitter": 50,
    "maxRetries": 5,
    "timeout": 30,
    "userAgent": "Mozilla/5.0...",
    "encryption": true,
    "antiForensics": true
  }
}
```

**Response (201 Created):**
```json
{
  "id": "stealth-mode",
  "name": "Stealth Mode",
  "description": "Low-visibility configuration",
  "config": { ... }
}
```

#### 3. Update Profile
**Endpoint:** `PUT /api/profiles/:profileId`

**Request:**
```json
{
  "name": "Stealth Mode",
  "description": "Updated description",
  "config": { ... }
}
```

**Response (200 OK):**
```json
{
  "id": "stealth-mode",
  "name": "Stealth Mode",
  "description": "Updated description",
  "config": { ... }
}
```

#### 4. Delete Profile
**Endpoint:** `DELETE /api/profiles/:profileId`

**Response:**
```json
{
  "message": "Profile deleted successfully"
}
```

---

## Activity Page Integration

**File:** `src/pages/Activity.tsx`

### Endpoints

#### Get Activity Logs
**Endpoint:** `GET /api/activity`

**Query Parameters:**
- `limit` (optional, default: 50) - Number of logs to return
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
[
  {
    "id": "log-001",
    "timestamp": "2024-01-15T14:42:33Z",
    "type": "success",
    "agent": "AGENT-001",
    "event": "Task completed successfully",
    "details": "Screenshot captured and saved"
  },
  {
    "id": "log-002",
    "timestamp": "2024-01-15T14:40:05Z",
    "type": "info",
    "agent": "AGENT-012",
    "event": "File transfer initiated",
    "details": "Downloading /etc/passwd"
  }
]
```

**Type values:** `success`, `error`, `warning`, `info`

---

## User Management Integration

**File:** `src/pages/UserManagement.tsx`

### Endpoints (Admin Only)

#### 1. Get All Users
**Endpoint:** `GET /api/users`

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@blackv.local",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### 2. Create User
**Endpoint:** `POST /api/users`

**Request:**
```json
{
  "username": "operator1",
  "email": "operator@blackv.local",
  "password": "securepassword",
  "role": "operator"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "username": "operator1",
  "email": "operator@blackv.local",
  "role": "operator",
  "createdAt": "2024-01-15T14:00:00Z"
}
```

#### 3. Delete User
**Endpoint:** `DELETE /api/users/:userId`

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### Role Permissions

| Role | Access |
|------|--------|
| `admin` | Full access - all pages and actions |
| `operator` | Can manage agents, tasks, profiles (no user management) |
| `viewer` | Read-only access to agents, tasks, results |

---

## Settings Integration

**File:** `src/pages/Settings.tsx`

### Endpoints

#### 1. Get Settings
**Endpoint:** `GET /api/settings`

**Response:**
```json
{
  "serverUrl": "http://localhost:8080",
  "wsUrl": "ws://localhost:8080",
  "callbackInterval": 30,
  "maxAgents": 100,
  "logLevel": "info",
  "encryptionEnabled": true
}
```

#### 2. Update Settings (Admin Only)
**Endpoint:** `PUT /api/settings`

**Request:**
```json
{
  "callbackInterval": 60,
  "maxAgents": 200,
  "logLevel": "debug"
}
```

**Response (200 OK):**
```json
{
  "serverUrl": "http://localhost:8080",
  "wsUrl": "ws://localhost:8080",
  "callbackInterval": 60,
  "maxAgents": 200,
  "logLevel": "debug",
  "encryptionEnabled": true
}
```

---

## WebSocket Integration

**File:** `src/contexts/WebSocketContext.tsx`

### Connection

The frontend connects to `ws://localhost:8080/` for real-time updates.

### Message Types

#### 1. Agent Created
```json
{
  "type": "agent_created",
  "data": {
    "id": "AGENT-NEW",
    "hostname": "NEW-COMPUTER",
    "ip": "192.168.1.200",
    "os": "Windows 10",
    "user": "user",
    "status": "active"
  },
  "timestamp": "2024-01-15T14:35:00Z"
}
```

#### 2. Task Created
```json
{
  "type": "task_created",
  "data": {
    "id": "TASK-NEW",
    "agent_id": "AGENT-001",
    "command": "screenshot",
    "status": "pending"
  },
  "timestamp": "2024-01-15T14:35:00Z"
}
```

#### 3. Task Result
```json
{
  "type": "task_result",
  "data": {
    "task_id": "TASK-001",
    "agent_id": "AGENT-001",
    "status": "completed",
    "output": "Command executed successfully",
    "command": "screenshot"
  },
  "timestamp": "2024-01-15T14:36:00Z"
}
```

### Frontend Usage

```typescript
// Subscribe to specific message types
const { messages } = useWebSocket("task_result");

// Subscribe to all messages
const { allMessages } = useWebSocket();

// Update state when new messages arrive
useEffect(() => {
  messages.forEach((msg) => {
    // Process new messages
  });
}, [messages]);
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

### Frontend Error Handling

```typescript
try {
  const data = await fetchAgents();
  setAgents(data);
} catch (error) {
  console.error('Failed to load agents:', error);
  toast.error('Failed to load agents');
}
```

---

## Go Backend Implementation Examples

### 1. Main Router Setup

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
)

func main() {
    r := gin.Default()
    
    // CORS Configuration
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173", "http://localhost:8080"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        AllowCredentials: true,
    }))
    
    // API Routes
    api := r.Group("/api")
    {
        // Public routes
        api.POST("/login", loginHandler)
        
        // Protected routes
        protected := api.Group("")
        protected.Use(authMiddleware())
        {
            // Dashboard
            protected.GET("/dashboard/metrics", getDashboardMetrics)
            protected.GET("/dashboard/activity", getRecentActivity)
            
            // Agents
            protected.GET("/agents", getAgents)
            protected.DELETE("/agents/:id", deleteAgent)
            
            // Tasks
            protected.GET("/tasks", getTasks)
            protected.POST("/tasks", createTask)
            
            // Results
            protected.GET("/results", getResults)
            protected.DELETE("/results/:id", deleteResult)
            protected.GET("/results/:id/download", downloadResult)
            
            // Profiles
            protected.GET("/profiles", getProfiles)
            protected.POST("/profiles", createProfile)
            protected.PUT("/profiles/:id", updateProfile)
            protected.DELETE("/profiles/:id", deleteProfile)
            
            // Activity
            protected.GET("/activity", getActivityLogs)
            
            // Users (Admin only)
            protected.GET("/users", adminOnly(), getUsers)
            protected.POST("/users", adminOnly(), createUser)
            protected.DELETE("/users/:id", adminOnly(), deleteUser)
            
            // Settings
            protected.GET("/settings", getSettings)
            protected.PUT("/settings", adminOnly(), updateSettings)
        }
    }
    
    // WebSocket
    r.GET("/", handleWebSocket)
    
    r.Run(":8080")
}
```

### 2. Login Handler Example

```go
func loginHandler(c *gin.Context) {
    var request struct {
        Username string `json:"username" binding:"required"`
        Password string `json:"password" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&request); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }
    
    // Find user in users.json
    user, err := findUser(request.Username)
    if err != nil {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // Verify password (using bcrypt)
    if !checkPassword(request.Password, user.Password) {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // Generate JWT token
    token, err := generateJWT(user)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to generate token"})
        return
    }
    
    c.JSON(200, gin.H{
        "id":       user.ID,
        "username": user.Username,
        "email":    user.Email,
        "role":     user.Role,
        "token":    token,
    })
}
```

### 3. Auth Middleware Example

```go
func authMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }
        
        // Extract token from "Bearer <token>"
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{"error": "Invalid authorization header"})
            c.Abort()
            return
        }
        
        token := parts[1]
        claims, err := validateJWT(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        c.Set("user_id", claims.UserID)
        c.Set("username", claims.Username)
        c.Set("role", claims.Role)
        c.Next()
    }
}
```

### 4. WebSocket Hub Example

```go
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
}

func (h *Hub) run() {
    for {
        select {
        case client := <-h.register:
            h.clients[client] = true
            
        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }
            
        case message := <-h.broadcast:
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
        }
    }
}

// Broadcast a message to all clients
func broadcastAgentCreated(agent Agent) {
    message := map[string]interface{}{
        "type": "agent_created",
        "data": agent,
        "timestamp": time.Now().Format(time.RFC3339),
    }
    jsonData, _ := json.Marshal(message)
    hub.broadcast <- jsonData
}
```

---

## Testing the Integration

1. **Start the Go backend:**
   ```bash
   go run main.go
   ```

2. **Start the React frontend:**
   ```bash
   npm run dev
   ```

3. **Test login:**
   - Navigate to `http://localhost:5173/login`
   - Enter credentials from `users.json`

4. **Verify WebSocket:**
   - Open browser DevTools → Network tab
   - Filter by "WS" to see WebSocket connection

5. **Test API calls:**
   - Navigate through pages
   - Check Network tab for API requests/responses

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Hash passwords with bcrypt
- [ ] Implement token expiration
- [ ] Validate all user inputs
- [ ] Use parameterized queries for database
- [ ] Implement rate limiting
- [ ] Log security events
- [ ] Regularly rotate JWT secrets
