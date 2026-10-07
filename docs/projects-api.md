# Projects API

**Base URL:** `/api/projects`  
**Authentication:** All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.  
**Data Isolation:** Every query is scoped to `req.user.id`. Users can only see and modify their own projects.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List authenticated user's projects |
| GET | `/api/projects/:id` | Get a single owned project |
| POST | `/api/projects` | Create a new project |
| PUT | `/api/projects/:id` | Update an owned project |
| DELETE | `/api/projects/:id` | Delete an owned project (cascades to tasks) |

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

## Project Object

```json
{
  "id": "clxyz123abc",
  "userId": "clxyz000user",
  "name": "E-Commerce Platform",
  "description": "Build a full-featured online store.",
  "status": "IN_PROGRESS",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-03-15T12:00:00.000Z"
}
```

**Field Reference:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | CUID, auto-generated |
| `userId` | string | Owner's user ID |
| `name` | string | 1–255 characters |
| `description` | string \| null | Up to 2000 characters |
| `status` | enum | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` |
| `startDate` | ISO datetime \| null | Must be ≤ endDate |
| `endDate` | ISO datetime \| null | Must be ≥ startDate |
| `createdAt` | ISO datetime | Auto-set on creation |
| `updatedAt` | ISO datetime | Auto-updated on change |

---

## GET /api/projects

List all projects owned by the authenticated user.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Case-insensitive partial match on `name` |
| `status` | enum | Filter by `NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED` |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "projects": [ { ...project } ],
    "count": 3
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid JWT |
| 400 | Invalid `status` query value |

**Examples:**

```bash
# All projects
GET /api/projects
Authorization: Bearer <token>

# Search by name
GET /api/projects?search=mobile
Authorization: Bearer <token>

# Filter by status
GET /api/projects?status=IN_PROGRESS
Authorization: Bearer <token>

# Combined
GET /api/projects?search=app&status=NOT_STARTED
Authorization: Bearer <token>
```

---

## GET /api/projects/:id

Get a single project. Returns 404 if the project does not exist **or** belongs to another user (safe IDOR prevention — no information leakage).

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Project CUID |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "project": { ...project }
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid JWT |
| 404 | Project not found, or belongs to another user |

---

## POST /api/projects

Create a new project for the authenticated user.

**Authentication:** Required

**Request Body (JSON):**

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `name` | ✅ | string | 1–255 characters |
| `description` | ❌ | string | Up to 2000 characters |
| `status` | ❌ | enum | Default: `NOT_STARTED` |
| `startDate` | ❌ | ISO date string | Must be ≤ `endDate` if both provided |
| `endDate` | ❌ | ISO date string | Must be ≥ `startDate` if both provided |

**Success Response — 201 Created:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": { ...project }
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 400 | Validation failure (missing name, invalid status, invalid dates, endDate < startDate) |
| 401 | Missing or invalid JWT |

**Example Request:**
```json
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mobile App Redesign",
  "description": "Redesign the mobile UI.",
  "status": "NOT_STARTED",
  "startDate": "2026-07-01",
  "endDate": "2026-12-31"
}
```

---

## PUT /api/projects/:id

Update an owned project. All fields are optional — send only the ones you want to change. Returns 404 if the project does not exist or belongs to another user.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Project CUID |

**Request Body (JSON) — all fields optional:**

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 1–255 characters |
| `description` | string \| null | Up to 2000 characters. Pass `null` to clear. |
| `status` | enum | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` |
| `startDate` | ISO date string \| null | Must be ≤ `endDate` if both present |
| `endDate` | ISO date string \| null | Must be ≥ `startDate` if both present |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": { ...updatedProject }
  }
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 400 | Validation failure |
| 401 | Missing or invalid JWT |
| 404 | Project not found, or belongs to another user |

---

## DELETE /api/projects/:id

Delete an owned project. All associated tasks are **automatically deleted** (Prisma cascade). Returns 404 if the project does not exist or belongs to another user.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Project CUID |

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 401 | Missing or invalid JWT |
| 404 | Project not found, or belongs to another user |

---

## Security Notes

- **Ownership enforcement:** Every read and write operation includes `userId` in the Prisma `where` clause. Client-supplied IDs alone are never trusted.
- **Safe 404:** When a resource does not exist or belongs to another user, the response is always `404 Not Found` — never `403 Forbidden`. This prevents an attacker from confirming whether a given ID exists.
- **No sensitive fields exposed:** `passwordHash` and other internal fields are never returned.
- **No raw SQL:** All queries use Prisma's type-safe query builder.
