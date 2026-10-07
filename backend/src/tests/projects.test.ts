/**
 * Project Management Integration Tests — Phase 3
 *
 * Covers all 14+ scenarios required by the spec:
 *   - create, list, get by ID, update, delete
 *   - search, status filter, invalid status
 *   - missing name, invalid date, date consistency
 *   - unauthenticated access
 *   - cross-user IDOR prevention (GET / PUT / DELETE)
 *
 * These are real integration tests that hit a real PostgreSQL database.
 * DATABASE_URL must be set in the environment.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import type { Application } from 'express';

// ── Constants ─────────────────────────────────────────────────────────────────

const TS = Date.now();
const USER_A_EMAIL = `proj_test_a_${TS}@example.com`;
const USER_B_EMAIL = `proj_test_b_${TS}@example.com`;
const VALID_PASSWORD = 'Password123!';

// ── State ─────────────────────────────────────────────────────────────────────

let app: Application;
let tokenA: string;
let tokenB: string;
let userAId: string;

/**
 * A static JWT signed with the test secret (set in setup.ts).
 * Valid for 1 hour. No DB user needed — used only for tests that
 * exercise validation logic (which fires before any DB query).
 */
const STATIC_TOKEN = jwt.sign(
  { sub: 'static-test-user-id' },
  'test_secret_at_least_64_chars_long_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  { expiresIn: '1h' },
);

// ── Skip helper ───────────────────────────────────────────────────────────────

function skipIfNoDB(fn: () => Promise<void>) {
  if (!process.env.DATABASE_URL) {
    return async () => {
      console.warn('Skipped: DATABASE_URL not set');
    };
  }
  return fn;
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = createApp();

  if (!process.env.DATABASE_URL) return;

  // Register User A
  const resA = await request(app).post('/api/auth/register').send({
    fullName: 'Project Test User A',
    email: USER_A_EMAIL,
    password: VALID_PASSWORD,
  });
  tokenA = resA.body.data.token;
  userAId = resA.body.data.user.id;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send({
    fullName: 'Project Test User B',
    email: USER_B_EMAIL,
    password: VALID_PASSWORD,
  });
  tokenB = resB.body.data.token;
});

afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  await prisma.user
    .deleteMany({ where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } })
    .catch(() => {});
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/projects', () => {
  it(
    'P1. Creates a project for the authenticated user',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Alpha Project',
          description: 'A test project',
          status: 'IN_PROGRESS',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Alpha Project');
      expect(res.body.data.project.status).toBe('IN_PROGRESS');
      expect(res.body.data.project.userId).toBe(userAId);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );

  it(
    'P2. Creates a project with minimal fields (only name)',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Minimal Project' });

      expect(res.status).toBe(201);
      expect(res.body.data.project.status).toBe('NOT_STARTED');
    }),
  );

  it('P3. Unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'No Auth' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('P4. Missing name returns 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${STATIC_TOKEN}`)
      .send({ description: 'No name supplied' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('P5. Empty name (whitespace only) returns 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${STATIC_TOKEN}`)
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('P6. Invalid status returns 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${STATIC_TOKEN}`)
      .send({ name: 'Bad Status', status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('NOT_STARTED');
  });

  it('P7. Invalid date string returns 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${STATIC_TOKEN}`)
      .send({ name: 'Bad Date', startDate: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('P8. endDate before startDate returns 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${STATIC_TOKEN}`)
      .send({
        name: 'Date Order Error',
        startDate: '2026-06-01',
        endDate: '2026-01-01',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('End date');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  beforeAll(
    skipIfNoDB(async () => {
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Alpha List Project ONE', status: 'IN_PROGRESS' });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Alpha List Project TWO', status: 'COMPLETED' });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Beta List Project', status: 'NOT_STARTED' });
    }),
  );

  it(
    'P9. Returns only authenticated user projects — not other users',
    skipIfNoDB(async () => {
      const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const projects: Array<{ userId: string; name: string }> = res.body.data.projects;
      projects.forEach((p) => expect(p.userId).toBe(userAId));
      const names = projects.map((p) => p.name);
      expect(names).not.toContain('Beta List Project');
      expect(res.body.data.count).toBe(projects.length);
    }),
  );

  it('P10. Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it(
    'P11. Search by name (case-insensitive)',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/projects?search=alpha+list')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const projects: Array<{ name: string }> = res.body.data.projects;
      projects.forEach((p) => expect(p.name.toLowerCase()).toContain('alpha list'));
    }),
  );

  it(
    'P12. Filter by status IN_PROGRESS',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/projects?status=IN_PROGRESS')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const projects: Array<{ status: string }> = res.body.data.projects;
      projects.forEach((p) => expect(p.status).toBe('IN_PROGRESS'));
    }),
  );

  it(
    'P13. Filter by status COMPLETED',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/projects?status=COMPLETED')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const projects: Array<{ status: string }> = res.body.data.projects;
      projects.forEach((p) => expect(p.status).toBe('COMPLETED'));
    }),
  );

  it(
    'P14. Invalid status filter returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/projects?status=BOGUS')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/projects/:id', () => {
  let projectIdA: string;
  let projectIdB: string;

  beforeAll(
    skipIfNoDB(async () => {
      const rA = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'GetByID Project A' });
      projectIdA = rA.body.data.project.id;

      const rB = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'GetByID Project B' });
      projectIdB = rB.body.data.project.id;
    }),
  );

  it(
    'P15. Owner can get their own project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/projects/${projectIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project.id).toBe(projectIdA);
      expect(res.body.data.project.userId).toBe(userAId);
    }),
  );

  it(
    'P16. IDOR — User A cannot get User B project (safe 404)',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/projects/${projectIdB}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'P17. Non-existent ID returns 404',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/projects/nonexistent-id-abc123')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    }),
  );

  it('P18. Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/projects/any-id');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/projects/:id', () => {
  let projectIdA: string;
  let projectIdB: string;

  beforeAll(
    skipIfNoDB(async () => {
      const rA = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Update Target A' });
      projectIdA = rA.body.data.project.id;

      const rB = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Update Target B' });
      projectIdB = rB.body.data.project.id;
    }),
  );

  it(
    'P19. Owner can update their own project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/projects/${projectIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Updated Name', status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.project.name).toBe('Updated Name');
      expect(res.body.data.project.status).toBe('IN_PROGRESS');
    }),
  );

  it(
    'P20. IDOR — User A cannot update User B project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/projects/${projectIdB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hijacked Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'P21. Invalid status on update returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/projects/${projectIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'INVALID' });

      expect(res.status).toBe(400);
    }),
  );

  it(
    'P22. Empty name on update returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/projects/${projectIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    }),
  );

  it('P23. Unauthenticated update returns 401', async () => {
    const res = await request(app).put('/api/projects/any-id').send({ name: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/projects/:id', () => {
  let projectIdA: string;
  let projectIdB: string;

  beforeAll(
    skipIfNoDB(async () => {
      const rA = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Delete Target A' });
      projectIdA = rA.body.data.project.id;

      const rB = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Delete Target B' });
      projectIdB = rB.body.data.project.id;
    }),
  );

  it(
    'P24. IDOR — User A cannot delete User B project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectIdB}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'P25. Owner can delete their own project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    }),
  );

  it(
    'P26. Deleted project is gone — 404 on subsequent GET',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/projects/${projectIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    }),
  );

  it('P27. Unauthenticated delete returns 401', async () => {
    const res = await request(app).delete('/api/projects/any-id');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CASCADE: DELETE project removes its tasks
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/projects/:id — cascade to tasks', () => {
  it(
    'P28. Deleting a project also deletes its tasks',
    skipIfNoDB(async () => {
      const pRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Cascade Delete Project' });
      const pid = pRes.body.data.project.id;

      const tRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Cascade Task', projectId: pid });
      const taskId = tRes.body.data.task.id;

      await request(app).delete(`/api/projects/${pid}`).set('Authorization', `Bearer ${tokenA}`);

      const taskCheck = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(taskCheck.status).toBe(404);
    }),
  );
});
