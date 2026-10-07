# Tasks API

**Base URL:** `/api/tasks`  
**Authentication:** All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.  
**Data Isolation:** Every query is scoped to `req.user.id`. Users can only see and modify their own tasks.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List authenticated user's tasks (with filters) |
| GET | `/api/tasks/:id` | Get a single owned task |
| POST | `/api/tasks` | Create a task inside an owned project |
| PUT | `/api/tasks/:id` | Update an owned task |
| DELETE | `/api/tasks/:id` | Delete an owned task |

---

## Common Response Envelope

**Success:**
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

---

## Task Object

```json
{
  "id": "clxyz456task",
  "userId": "clxyz000user",
  "projectId": "clxyz123abc",
  "name": "Implement product catalog API",
  "description": "CRUD endpoints for products.",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2026-03-15T00:00:00.000Z",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-02-20T14:30:00.000Z",
  "project": {
    "id": "clxyz123abc",
    "name": "E-Commerce Platform",
    "status": "IN_PROGRESS"
  }
}
```

> **Note:** The `project` object is included in all responses for context. It is a subset of the full project record.

**Field Reference:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | CUID, auto-generated |
| `userId` | string | Owner's user ID |
| `projectId` | string | Parent project CUID |
| `name` | string | 1–255 characters |
| `description` | string \| null | Up to 2000 characters |
| `priority` | enum | `LOW` \| `MEDIUM` \| `HIGH` — default `MEDIUM` |
| `status` | enum | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` — default `PENDING` |
| `dueDate` | ISO datetime \| null | Optional due date |
| `createdAt` | ISO datetime | Auto-set on creation |
| `updatedAt` | ISO datetime | Auto-updated on change |
| `project` | object | Embedded project summary |

---

## GET /api/tasks

List all tasks owned by the authenticated user. Supports search and multiple independent filters that can be freely combined.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Case-insensitive partial match on `name` |
| `status` | enum | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` |
| `priority` | enum | `LOW` \| `MEDIUM` \| `HIGH` |
| `projectId` | string | Filter tasks to a specific project (must be owned by the user) |

> All filters are optional and can be combined freely.

**Success Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "tasks": [ { ...task } ],
    "count": 5
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid JWT |
| 400 | Invalid `status` or `priority` query value |

**Examples:**

```bash
# All tasks
GET /api/tasks
Authorization: Bearer <token>

# Search by name
GET /api/tasks?search=design
Authorization: Bearer <token>

# Filter by status
GET /api/tasks?status=COMPLETED
Authorization: Bearer <token>

# Filter by priority
GET /api/tasks?priority=HIGH
Authorization: Bearer <token>

# Combined: status + priority
GET /api/tasks?status=IN_PROGRESS&priority=HIGH
Authorization: Bearer <token>

# Filter by project
GET /api/tasks?projectId=clxyz123abc
Authorization: Bearer <token>

# All filters combined
GET /api/tasks?search=api&status=IN_PROGRESS&priority=HIGH&projectId=clxyz123abc
Authorization: Bearer <token>
```

---

## GET /api/tasks/:id

Get a single task. Returns 404 if the task does not exist **or** belongs to another user (safe IDOR prevention).

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task CUID |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "task": { ...task }
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid JWT |
| 404 | Task not found, or belongs to another user |

---

## POST /api/tasks

Create a new task inside a project owned by the authenticated user. The server **verifies that `projectId` belongs to the requesting user** before creating the task — preventing cross-user task injection.

**Authentication:** Required

**Request Body (JSON):**

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `projectId` | ✅ | string | Must be a project owned by the authenticated user |
| `name` | ✅ | string | 1–255 characters |
| `description` | ❌ | string | Up to 2000 characters |
| `priority` | ❌ | enum | Default: `MEDIUM` |
| `status` | ❌ | enum | Default: `PENDING` |
| `dueDate` | ❌ | ISO date string | Optional |

**Success Response — 201 Created:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": { ...task }
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 400 | Validation failure (missing name, missing projectId, invalid priority/status, invalid date) |
| 401 | Missing or invalid JWT |
| 404 | `projectId` does not exist or belongs to another user |

**Example Request:**
```json
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "clxyz123abc",
  "name": "Implement payment gateway",
  "description": "Stripe integration with webhooks.",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-05-01"
}
```

---

## PUT /api/tasks/:id

Update an owned task. All fields are optional. Returns 404 if the task does not exist or belongs to another user.

**Special rule:** If `projectId` is changed, the **new** project must also be owned by the authenticated user.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task CUID |

**Request Body (JSON) — all fields optional:**

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 1–255 characters |
| `description` | string \| null | Up to 2000 characters. Pass `null` to clear. |
| `projectId` | string | New parent project — must be owned by the user |
| `priority` | enum | `LOW` \| `MEDIUM` \| `HIGH` |
| `status` | enum | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` |
| `dueDate` | ISO date string \| null | Pass `null` to clear |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": { ...updatedTask }
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 400 | Validation failure (invalid enum, empty name) |
| 401 | Missing or invalid JWT |
| 404 | Task not found, belongs to another user, or new `projectId` is not owned |

**Changing status to COMPLETED:**
```json
PUT /api/tasks/clxyz456task
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "COMPLETED" }
```
→ Returns 200 with `status: "COMPLETED"`. This always works normally.

---

## DELETE /api/tasks/:id

Delete an owned task. Returns 404 if the task does not exist or belongs to another user.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task CUID |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid JWT |
| 404 | Task not found, or belongs to another user |

---

## Security Notes

- **Project ownership enforced on creation:** `POST /api/tasks` verifies `projectId` belongs to `req.user.id` before inserting the task. User A cannot inject tasks into User B's project.
- **Project ownership enforced on move:** `PUT /api/tasks/:id` with a new `projectId` verifies the target project is owned by `req.user.id`. User A cannot move a task into User B's project.
- **Ownership enforcement on all reads and writes:** Every `findFirst`, `update`, and `delete` includes `userId` in the Prisma `where` clause.
- **Safe 404:** All not-found and unauthorized cases return `404 Not Found`, not `403 Forbidden`. This prevents enumeration attacks.
- **No sensitive fields exposed:** `passwordHash` and other internal fields are never returned.
- **No raw SQL:** All queries use Prisma's type-safe query builder.

---

## Priority Enum Reference

| Value | Meaning |
|-------|---------|
| `LOW` | Nice-to-have, not urgent |
| `MEDIUM` | Standard priority (default) |
| `HIGH` | Urgent or blocking |

## Status Enum Reference

| Value | Meaning |
|-------|---------|
| `PENDING` | Not yet started (default) |
| `IN_PROGRESS` | Work is ongoing |
| `COMPLETED` | Done |
