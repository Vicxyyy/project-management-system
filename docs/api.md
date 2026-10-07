# API Documentation

## Authentication
All protected routes require a JWT token in the `Authorization` header:
`Authorization: Bearer <token>`

### Register
`POST /api/auth/register`
- **Body**: `{ "fullName": "John Doe", "email": "john@example.com", "password": "password123" }`
- **Response**: `{ "token": "jwt...", "user": { "id": "...", "email": "..." } }`

### Login
`POST /api/auth/login`
- **Body**: `{ "email": "john@example.com", "password": "password123" }`
- **Response**: `{ "token": "jwt...", "user": { "id": "...", "email": "..." } }`

### Logout
`POST /api/auth/logout`
- **Response**: `{ "message": "Logged out successfully" }`

### Get Current User
`GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "user": { "id": "...", "email": "...", "fullName": "..." } }`

---

## Dashboard

### Get Dashboard Statistics
`GET /api/dashboard`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "totalProjects": 5,
  "totalTasks": 12,
  "completedTasks": 3,
  "pendingTasks": 9,
  "projectsInProgress": 2
}
```

---

## Projects

### Get All Projects
`GET /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "projects": [ { "id": "...", "name": "...", "status": "NOT_STARTED", ... } ] }`

### Get Single Project
`GET /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "project": { "id": "...", ... } }`

### Create Project
`POST /api/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "New App", "description": "Details...", "status": "NOT_STARTED" }`
- **Response**: `{ "project": { "id": "...", ... } }`

### Update Project
`PUT /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "Updated App", "status": "IN_PROGRESS" }`
- **Response**: `{ "project": { "id": "...", ... } }`

### Delete Project
`DELETE /api/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "message": "Project deleted successfully" }`

---

## Tasks

### Get All Tasks
`GET /api/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "tasks": [ { "id": "...", "name": "...", "status": "PENDING", "projectId": "..." } ] }`

### Get Single Task
`GET /api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "task": { "id": "...", ... } }`

### Create Task
`POST /api/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "Setup DB", "description": "...", "status": "PENDING", "priority": "HIGH", "projectId": "..." }`
- **Response**: `{ "task": { "id": "...", ... } }`

### Update Task
`PUT /api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name": "Updated DB Setup", "status": "COMPLETED" }`
- **Response**: `{ "task": { "id": "...", ... } }`

### Delete Task
`DELETE /api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "message": "Task deleted successfully" }`
