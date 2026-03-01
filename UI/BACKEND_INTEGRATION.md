# Backend Integration Guide for BlackV C2

## Overview
This guide explains how to integrate the BlackV C2 frontend with your Go backend server.

## Authentication System

### 1. Login Endpoint
**URL:** `POST http://localhost:8080/api/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (Success - 200 OK):**
```json
{
  "id": "uuid-string",
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "token": "jwt-token-string"
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

**Implementation Notes:**
- Read user credentials from `users.json` file
- Validate username and password
- Generate JWT token upon successful authentication
- Return user data including role for permission management

---

## User Management Endpoints

### 2. Get All Users
**URL:** `GET http://localhost:8080/api/users`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-1",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid-2",
    "username": "operator1",
    "email": "operator@example.com",
    "role": "operator",
    "created_at": "2024-01-02T00:00:00Z"
  }
]
```

**Access Control:**
- Only accessible to users with `admin` role
- Verify JWT token in Authorization header
- Return 403 Forbidden if user is not admin

---

### 3. Create User
**URL:** `POST http://localhost:8080/api/users`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "viewer"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-3",
  "username": "newuser",
  "email": "newuser@example.com",
  "role": "viewer",
  "created_at": "2024-01-03T00:00:00Z"
}
```

**Access Control:**
- Only accessible to users with `admin` role
- Validate that username/email are unique
- Hash password before storing
- Add new user to `users.json` file

---

### 4. Delete User
**URL:** `DELETE http://localhost:8080/api/users/{userId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Access Control:**
- Only accessible to users with `admin` role
- Cannot delete your own account
- Remove user from `users.json` file

---

## WebSocket Integration

The frontend already connects to `ws://localhost:8080/` for real-time updates. Your Go backend should broadcast these message types:

### Agent Created
```json
{
  "type": "agent_created",
  "data": {
    "id": "uuid",
    "hostname": "DESKTOP-ABC123",
    "ip": "192.168.1.100",
    "os": "Windows 10",
    "status": "active"
  }
}
```

### Task Created
```json
{
  "type": "task_created",
  "data": {
    "id": "uuid",
    "agent_id": "agent-uuid",
    "command": "whoami",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Task Result
```json
{
  "type": "task_result",
  "data": {
    "task_id": "task-uuid",
    "status": "completed",
    "output": "command output here",
    "error": null
  }
}
```

---

## Users JSON File Structure

Create a `users.json` file in your backend with this structure:

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "admin",
      "email": "admin@blackv.local",
      "password": "$2a$10$hashedpasswordhere",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "operator",
      "email": "operator@blackv.local",
      "password": "$2a$10$hashedpasswordhere",
      "role": "operator",
      "created_at": "2024-01-02T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "viewer",
      "email": "viewer@blackv.local",
      "password": "$2a$10$hashedpasswordhere",
      "role": "viewer",
      "created_at": "2024-01-03T00:00:00Z"
    }
  ]
}
```

**Role Definitions:**
- `admin`: Full access - can manage users, agents, tasks, and settings
- `operator`: Can create tasks and manage agents, but cannot manage users
- `viewer`: Read-only access to agents, tasks, and results

---

## JWT Token Implementation

Your backend should:
1. Generate JWT tokens with user ID and role in claims
2. Set appropriate expiration time (e.g., 24 hours)
3. Validate tokens on all protected endpoints
4. Include user role in token claims for permission checks

**Example JWT Claims:**
```json
{
  "user_id": "uuid",
  "username": "admin",
  "role": "admin",
  "exp": 1704153600
}
```

---

## CORS Configuration

Make sure your Go backend allows requests from the frontend:

```go
// Enable CORS
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:5173", "http://localhost:8080"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

---

## Security Best Practices

1. **Password Hashing:** Use bcrypt to hash passwords before storing
2. **JWT Secret:** Use a strong, random secret key for JWT signing
3. **HTTPS:** Use HTTPS in production (not HTTP)
4. **Token Expiration:** Implement token refresh mechanism
5. **Rate Limiting:** Add rate limiting to prevent brute force attacks
6. **Input Validation:** Validate all user inputs on the backend
7. **SQL Injection:** If using a database, use parameterized queries

---

## Testing the Integration

1. Start your Go backend server: `go run main.go`
2. Start the frontend: `npm run dev`
3. Navigate to `http://localhost:5173/login`
4. Try logging in with credentials from `users.json`
5. Verify WebSocket connection in browser DevTools (Network tab)

---

## Frontend Features by Role

### Admin
- Full access to all pages
- User Management page (create/delete users)
- Can perform all actions

### Operator
- Access to Dashboard, Agents, Tasks, Profiles, Results, Activity, Settings
- Cannot access User Management
- Can create tasks and manage agents

### Viewer
- Access to Dashboard, Agents, Tasks, Results, Activity
- Read-only access
- Cannot create or modify anything

---

## Error Handling

The frontend handles these error scenarios:
- Invalid credentials (401)
- Unauthorized access (403)
- Server errors (500)
- Network errors (connection refused)
- WebSocket disconnection (auto-reconnect)

Make sure your backend returns appropriate HTTP status codes and error messages.
