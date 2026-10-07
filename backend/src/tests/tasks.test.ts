/**
 * Task Management Integration Tests — Phase 3
 *
 * Covers all required scenarios:
 *   - create, list, get by ID, update, delete
 *   - search, status filter, priority filter, combined filters
 *   - invalid priority, invalid status, invalid project
 *   - unauthenticated access
 *   - IDOR: another user's project/task (GET / PUT / DELETE)
 *   - User A cannot create task in User B's project
 *   - User A cannot move task to User B's project
 *   - Changing task status to COMPLETED
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import type { Application } from 'express';

// ── Constants ─────────────────────────────────────────────────────────────────

const TS = Date.now();
const USER_A_EMAIL = `task_test_a_${TS}@example.com`;
const USER_B_EMAIL = `task_test_b_${TS}@example.com`;
const VALID_PASSWORD = 'Password123!';

// ── State ─────────────────────────────────────────────────────────────────────

let app: Application;
let tokenA: string;
let tokenB: string;
let userAId: string;

/** A project owned by User A — used in most task tests */
let projectAId: string;
/** A project owned by User B — used in IDOR tests */
let projectBId: string;

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
    fullName: 'Task Test User A',
    email: USER_A_EMAIL,
    password: VALID_PASSWORD,
  });
  tokenA = resA.body.data.token;
  userAId = resA.body.data.user.id;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send({
    fullName: 'Task Test User B',
    email: USER_B_EMAIL,
    password: VALID_PASSWORD,
  });
  tokenB = resB.body.data.token;

  // Create a project for each user — shared across most tests
  const pA = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'User A Shared Project' });
  projectAId = pA.body.data.project.id;

  const pB = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({ name: 'User B Shared Project' });
  projectBId = pB.body.data.project.id;
});

afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  await prisma.user
    .deleteMany({ where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } })
    .catch(() => {});
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  it(
    'T1. Creates a task in an owned project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'First Task',
          description: 'A task description',
          projectId: projectAId,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: '2026-12-31',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.name).toBe('First Task');
      expect(res.body.data.task.priority).toBe('HIGH');
      expect(res.body.data.task.status).toBe('IN_PROGRESS');
      expect(res.body.data.task.userId).toBe(userAId);
      expect(res.body.data.task.projectId).toBe(projectAId);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );

  it(
    'T2. Creates a task with defaults (priority=MEDIUM, status=PENDING)',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Default Task', projectId: projectAId });

      expect(res.status).toBe(201);
      expect(res.body.data.task.priority).toBe('MEDIUM');
      expect(res.body.data.task.status).toBe('PENDING');
    }),
  );

  it('T3. Unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/tasks').send({ name: 'No Auth', projectId: 'any' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it(
    'T4. Missing name returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ projectId: projectAId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    }),
  );

  it(
    'T5. Missing projectId returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'No Project' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T6. Empty name returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '  ', projectId: projectAId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T7. Invalid priority returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Bad Priority', projectId: projectAId, priority: 'URGENT' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('LOW');
    }),
  );

  it(
    'T8. Invalid status returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Bad Status', projectId: projectAId, status: 'DONE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('PENDING');
    }),
  );

  it(
    'T9. Invalid dueDate returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Bad Date', projectId: projectAId, dueDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T10. SECURITY — User A cannot create task in User B project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Injected Task', projectId: projectBId });

      // Must refuse — 404 (project not found for this user)
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T11. Non-existent projectId returns 404',
    skipIfNoDB(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Ghost Project Task', projectId: 'does-not-exist-xyz' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  beforeAll(
    skipIfNoDB(async () => {
      // Seed a few tasks for User A to support filter tests
      await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({
        name: 'Design wireframes',
        projectId: projectAId,
        priority: 'LOW',
        status: 'PENDING',
      });

      await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({
        name: 'Implement API',
        projectId: projectAId,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
      });

      await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({
        name: 'Write tests',
        projectId: projectAId,
        priority: 'HIGH',
        status: 'COMPLETED',
      });

      // One task for User B — must never appear in User A's list
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'User B Secret Task', projectId: projectBId });
    }),
  );

  it(
    'T12. Returns only authenticated user tasks — not other users',
    skipIfNoDB(async () => {
      const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const tasks: Array<{ userId: string; name: string }> = res.body.data.tasks;
      tasks.forEach((t) => expect(t.userId).toBe(userAId));
      const names = tasks.map((t) => t.name);
      expect(names).not.toContain('User B Secret Task');
      expect(res.body.data.count).toBe(tasks.length);
    }),
  );

  it('T13. Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it(
    'T14. Search by name (case-insensitive)',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks?search=design')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const tasks: Array<{ name: string }> = res.body.data.tasks;
      tasks.forEach((t) => expect(t.name.toLowerCase()).toContain('design'));
    }),
  );

  it(
    'T15. Filter by status COMPLETED',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks?status=COMPLETED')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const tasks: Array<{ status: string }> = res.body.data.tasks;
      tasks.forEach((t) => expect(t.status).toBe('COMPLETED'));
    }),
  );

  it(
    'T16. Filter by priority HIGH',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const tasks: Array<{ priority: string }> = res.body.data.tasks;
      tasks.forEach((t) => expect(t.priority).toBe('HIGH'));
    }),
  );

  it(
    'T17. Combined filter: status=IN_PROGRESS & priority=HIGH',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks?status=IN_PROGRESS&priority=HIGH')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const tasks: Array<{ status: string; priority: string }> = res.body.data.tasks;
      tasks.forEach((t) => {
        expect(t.status).toBe('IN_PROGRESS');
        expect(t.priority).toBe('HIGH');
      });
    }),
  );

  it(
    'T18. Filter by projectId returns only tasks in that project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/tasks?projectId=${projectAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const tasks: Array<{ projectId: string }> = res.body.data.tasks;
      tasks.forEach((t) => expect(t.projectId).toBe(projectAId));
    }),
  );

  it(
    'T19. Invalid status filter returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks?status=BOGUS')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T20. Invalid priority filter returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks?priority=CRITICAL')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/tasks/:id', () => {
  let taskIdA: string;
  let taskIdB: string;

  beforeAll(
    skipIfNoDB(async () => {
      const rA = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'GetByID Task A', projectId: projectAId });
      taskIdA = rA.body.data.task.id;

      const rB = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'GetByID Task B', projectId: projectBId });
      taskIdB = rB.body.data.task.id;
    }),
  );

  it(
    'T21. Owner can get their own task',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.id).toBe(taskIdA);
      expect(res.body.data.task.userId).toBe(userAId);
    }),
  );

  it(
    'T22. IDOR — User A cannot get User B task (safe 404)',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskIdB}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T23. Non-existent task ID returns 404',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get('/api/tasks/nonexistent-task-id-xyz')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    }),
  );

  it('T24. Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/tasks/any-id');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tasks/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/tasks/:id', () => {
  let taskIdA: string;
  let taskIdB: string;
  let projectA2Id: string;

  beforeAll(
    skipIfNoDB(async () => {
      const rA = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Update Task A', projectId: projectAId, priority: 'LOW' });
      taskIdA = rA.body.data.task.id;

      const rB = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Update Task B', projectId: projectBId });
      taskIdB = rB.body.data.task.id;

      // A second project for User A — used in projectId move tests
      const pA2 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'User A Second Project' });
      projectA2Id = pA2.body.data.project.id;
    }),
  );

  it(
    'T25. Owner can update their own task',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Updated Task Name', priority: 'HIGH' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.name).toBe('Updated Task Name');
      expect(res.body.data.task.priority).toBe('HIGH');
    }),
  );

  it(
    'T26. Changing status to COMPLETED works',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('COMPLETED');
    }),
  );

  it(
    'T27. Owner can move task to another owned project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ projectId: projectA2Id });

      expect(res.status).toBe(200);
      expect(res.body.data.task.projectId).toBe(projectA2Id);
    }),
  );

  it(
    'T28. SECURITY — User A cannot move task to User B project',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ projectId: projectBId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T29. IDOR — User A cannot update User B task',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdB}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hijacked Task' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T30. Invalid priority on update returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ priority: 'CRITICAL' });

      expect(res.status).toBe(400);
    }),
  );

  it(
    'T31. Invalid status on update returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(400);
    }),
  );

  it(
    'T32. Empty name on update returns 400',
    skipIfNoDB(async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    }),
  );

  it('T33. Unauthenticated update returns 401', async () => {
    const res = await request(app).put('/api/tasks/any-id').send({ name: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  let taskIdA: string;
  let taskIdB: string;

  beforeAll(
    skipIfNoDB(async () => {
      const rA = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Delete Task A', projectId: projectAId });
      taskIdA = rA.body.data.task.id;

      const rB = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Delete Task B', projectId: projectBId });
      taskIdB = rB.body.data.task.id;
    }),
  );

  it(
    'T34. IDOR — User A cannot delete User B task',
    skipIfNoDB(async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskIdB}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }),
  );

  it(
    'T35. Owner can delete their own task',
    skipIfNoDB(async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    }),
  );

  it(
    'T36. Deleted task is gone — 404 on subsequent GET',
    skipIfNoDB(async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    }),
  );

  it('T37. Unauthenticated delete returns 401', async () => {
    const res = await request(app).delete('/api/tasks/any-id');
    expect(res.status).toBe(401);
  });
});
