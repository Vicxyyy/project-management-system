# Architecture Overview

## Project: Full Stack Developer Project Management System

> Phase 1 — Foundation & Database

---

## Monorepo Structure

```
project-root/
├── backend/          # Node.js + Express + TypeScript API
├── web/              # React + Vite + TypeScript + Tailwind SPA
├── mobile/           # Expo + React Native + TypeScript app
├── docs/             # Project documentation
├── package.json      # npm workspaces root
└── .gitignore
```

---

## Technology Decisions

| Layer    | Technology                          | Rationale                                              |
|----------|-------------------------------------|--------------------------------------------------------|
| Backend  | Node.js + Express + TypeScript      | Mature, fast, widely supported                         |
| ORM      | Prisma                              | Type-safe DB access, great DX, migration tooling        |
| Database | PostgreSQL                          | ACID compliant, relational, robust for production       |
| Web      | React + Vite + Tailwind + RQ        | Fast DX, TanStack Query for server state management     |
| Mobile   | Expo + React Native + Expo Router   | Cross-platform, file-based routing, SecureStore for JWT |
| Auth     | JWT (Phase 2)                       | Stateless, works across web and mobile                  |

---

## Backend Architecture

```
backend/src/
├── config/
│   ├── env.ts          # Env var loading & validation
│   └── logger.ts       # Winston logger (console dev / file prod)
├── errors/
│   └── AppError.ts     # Custom error hierarchy with HTTP status codes
├── lib/
│   └── prisma.ts       # Singleton PrismaClient with query logging
├── middleware/
│   └── errorHandler.ts # Centralized error + 404 middleware
├── routes/
│   ├── index.ts        # Route registry (mount all groups here)
│   └── health.ts       # GET /api/v1/health
├── app.ts              # Express app factory
└── index.ts            # Server entry point + graceful shutdown
```

### Request Lifecycle

```
HTTP Request
  → CORS middleware
  → Body parsing
  → Morgan logging
  → Router (mounted at /api/v1)
    → Route handler
      → Service / DB layer
      → Response
  → notFoundHandler (no match)
  → errorHandler (catch all errors)
```

### Environment Variables

| Variable       | Required | Description                        |
|----------------|----------|------------------------------------|
| DATABASE_URL   | ✅        | PostgreSQL connection string        |
| PORT           | ✅        | HTTP listen port (default: 5000)    |
| JWT_SECRET     | Phase 2  | Secret for signing JWTs             |
| JWT_EXPIRES_IN | Phase 2  | JWT expiry (e.g. 7d)               |
| CORS_ORIGIN    | ✅        | Allowed CORS origin(s)              |
| NODE_ENV       | ✅        | development \| production \| test   |

---

## Web Architecture

```
web/src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx   # Root shell: sidebar + top bar + Outlet
│       ├── Sidebar.tsx     # Navigation sidebar with active state
│       └── TopBar.tsx      # Header with page title + user avatar
├── lib/
│   └── apiClient.ts        # Type-safe fetch wrapper (all HTTP methods)
├── pages/
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── TasksPage.tsx
│   └── NotFoundPage.tsx
├── types/
│   └── index.ts            # Shared TypeScript types (mirrors Prisma schema)
├── App.tsx                 # BrowserRouter + route definitions
├── main.tsx                # React DOM root + TanStack Query provider
├── index.css               # Tailwind base + component layer
└── vite-env.d.ts
```

### Data Fetching Strategy

- **TanStack Query** manages all server state (caching, refetching, loading/error states)
- `apiClient.ts` is a thin `fetch` wrapper injected into query functions
- Phase 2 will add request interceptors for `Authorization: Bearer <token>` injection

---

## Mobile Architecture

```
mobile/app/
├── _layout.tsx             # Root Stack navigator
└── (tabs)/
    ├── _layout.tsx         # Tab bar configuration
    ├── index.tsx           # Dashboard screen
    ├── projects.tsx        # Projects screen
    └── tasks.tsx           # Tasks screen
```

- **Expo Router** (file-based routing, similar to Next.js App Router)
- **expo-secure-store** installed and ready for JWT storage in Phase 2
- Tab navigation with Ionicons

---

## Database

See [database-schema.md](./database-schema.md) for the full schema reference.

---

## API Versioning

All API routes are prefixed with `/api/v1` for future backward compatibility.

Current endpoints:

| Method | Path               | Description            |
|--------|--------------------|------------------------|
| GET    | /api/v1/health     | Service health check   |

Phase 2+ will add:

| Method | Path                       | Description                |
|--------|----------------------------|----------------------------|
| POST   | /api/v1/auth/register      | Register new user          |
| POST   | /api/v1/auth/login         | Login                      |
| GET    | /api/v1/projects           | List projects              |
| POST   | /api/v1/projects           | Create project             |
| GET    | /api/v1/projects/:id       | Get project detail         |
| PATCH  | /api/v1/projects/:id       | Update project             |
| DELETE | /api/v1/projects/:id       | Delete project             |
| GET    | /api/v1/tasks              | List tasks                 |
| POST   | /api/v1/tasks              | Create task                |
| PATCH  | /api/v1/tasks/:id          | Update task                |
| DELETE | /api/v1/tasks/:id          | Delete task                |

---

## Development Workflow

```bash
# Install all dependencies (from project root)
npm install

# Start backend in dev mode (auto-restart on file change)
cd backend && npm run dev

# Start web in dev mode
cd web && npm run dev

# Start mobile
cd mobile && npx expo start

# Run database migration
cd backend && npm run migrate

# Seed the database
cd backend && npm run seed
```

---

## Security Notes

- `.env` files are in `.gitignore` — never committed
- Passwords stored only as bcrypt hashes (implemented in Phase 2)
- JWT secrets must be at least 64 characters in production
- CORS is restricted to known origins
- Rate limiting will be added in Phase 2
