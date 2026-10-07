# Database Schema Reference

> Database: PostgreSQL  
> ORM: Prisma  
> Schema file: `backend/prisma/schema.prisma`

---

## Enums

### `ProjectStatus`
| Value         | Description                          |
|---------------|--------------------------------------|
| `NOT_STARTED` | Project not yet begun                |
| `IN_PROGRESS` | Project currently active             |
| `COMPLETED`   | Project finished                     |

### `TaskPriority`
| Value    | Description    |
|----------|----------------|
| `LOW`    | Low priority   |
| `MEDIUM` | Medium priority |
| `HIGH`   | High priority  |

### `TaskStatus`
| Value         | Description              |
|---------------|--------------------------|
| `PENDING`     | Task not yet started     |
| `IN_PROGRESS` | Task currently active    |
| `COMPLETED`   | Task finished            |

---

## Tables

### `users`

| Column         | Type        | Constraints                   |
|----------------|-------------|-------------------------------|
| `id`           | `String`    | PK, CUID, auto-generated      |
| `fullName`     | `String`    | NOT NULL                      |
| `email`        | `String`    | NOT NULL, UNIQUE              |
| `passwordHash` | `String`    | NOT NULL (bcrypt in Phase 2)  |
| `createdAt`    | `DateTime`  | NOT NULL, default: now()      |
| `updatedAt`    | `DateTime`  | NOT NULL, auto-updated        |

**Indexes:** `email`

---

### `projects`

| Column        | Type             | Constraints                        |
|---------------|------------------|------------------------------------|
| `id`          | `String`         | PK, CUID, auto-generated           |
| `userId`      | `String`         | FK → `users.id` (CASCADE DELETE)   |
| `name`        | `String`         | NOT NULL                           |
| `description` | `String?`        | Nullable                           |
| `status`      | `ProjectStatus`  | NOT NULL, default: `NOT_STARTED`   |
| `startDate`   | `DateTime?`      | Nullable                           |
| `endDate`     | `DateTime?`      | Nullable                           |
| `createdAt`   | `DateTime`       | NOT NULL, default: now()           |
| `updatedAt`   | `DateTime`       | NOT NULL, auto-updated             |

**Indexes:** `userId`, `status`

---

### `tasks`

| Column        | Type           | Constraints                          |
|---------------|----------------|--------------------------------------|
| `id`          | `String`       | PK, CUID, auto-generated             |
| `userId`      | `String`       | FK → `users.id` (CASCADE DELETE)     |
| `projectId`   | `String`       | FK → `projects.id` (CASCADE DELETE)  |
| `name`        | `String`       | NOT NULL                             |
| `description` | `String?`      | Nullable                             |
| `priority`    | `TaskPriority` | NOT NULL, default: `MEDIUM`          |
| `status`      | `TaskStatus`   | NOT NULL, default: `PENDING`         |
| `dueDate`     | `DateTime?`    | Nullable                             |
| `createdAt`   | `DateTime`     | NOT NULL, default: now()             |
| `updatedAt`   | `DateTime`     | NOT NULL, auto-updated               |

**Indexes:** `userId`, `projectId`, `status`, `priority`

---

## Relationships

```
User ──(1:N)──> Project
User ──(1:N)──> Task
Project ──(1:N)──> Task
Task ──(N:1)──> User
Task ──(N:1)──> Project
```

- Deleting a **User** cascades to all their **Projects** and **Tasks**
- Deleting a **Project** cascades to all its **Tasks**
- A **Task** always belongs to both a **User** and a **Project**

---

## ER Diagram

```
┌──────────────────────┐
│         users        │
├──────────────────────┤
│ id (PK, CUID)        │
│ fullName             │
│ email (UNIQUE)       │
│ passwordHash         │
│ createdAt            │
│ updatedAt            │
└──────────┬───────────┘
           │ 1
           │
     ──────┼──────
     │           │
     │ N         │ N
     ▼           ▼
┌────────────────────┐      ┌──────────────────────┐
│      projects      │      │        tasks         │
├────────────────────┤      ├──────────────────────┤
│ id (PK, CUID)      │      │ id (PK, CUID)        │
│ userId (FK)        │◄─────│ userId (FK)          │
│ name               │      │ projectId (FK)       │
│ description?       │      │ name                 │
│ status             │      │ description?         │
│ startDate?         │ 1  N │ priority             │
│ endDate?           │──────│ status               │
│ createdAt          │      │ dueDate?             │
│ updatedAt          │      │ createdAt            │
└────────────────────┘      │ updatedAt            │
                            └──────────────────────┘
```

---

## Seed Data

The seed script (`backend/prisma/seed.ts`) creates:

- **2 users**: Alice Johnson, Bob Smith
- **3 projects**: E-Commerce Platform, Mobile App Redesign, Data Pipeline
- **9 tasks**: distributed across projects with varied statuses and priorities

Run with: `cd backend && npm run seed`

The seed uses `upsert` — safe to run multiple times.
