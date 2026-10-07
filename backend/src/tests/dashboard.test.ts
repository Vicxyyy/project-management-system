import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import type { Application } from 'express';

const TS = Date.now();
const USER_EMAIL = `dashboard_test_${TS}@example.com`;
const VALID_PASSWORD = 'Password123!';

let app: Application;
let token: string;

function skipIfNoDB(fn: () => Promise<void>) {
  if (!process.env.DATABASE_URL) {
    return async () => {
      console.warn('Skipped: DATABASE_URL not set');
    };
  }
  return fn;
}

beforeAll(async () => {
  app = createApp();

  if (!process.env.DATABASE_URL) return;

  const res = await request(app).post('/api/auth/register').send({
    fullName: 'Dashboard Test User',
    email: USER_EMAIL,
    password: VALID_PASSWORD,
  });
  token = res.body.data.token;
});

afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  await prisma.user.deleteMany({ where: { email: USER_EMAIL } }).catch(() => {});
  await prisma.$disconnect();
});

describe('GET /api/dashboard', () => {
  it('1. Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it(
    '2. Returns zero for new user',
    skipIfNoDB(async () => {
      const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalProjects).toBe(0);
      expect(res.body.data.totalTasks).toBe(0);
      expect(res.body.data.completedTasks).toBe(0);
    }),
  );

  it(
    '3. Returns correct counts after creating projects and tasks',
    skipIfNoDB(async () => {
      // Create 1 IN_PROGRESS project, 1 COMPLETED project
      const p1 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'P1', status: 'IN_PROGRESS' });
      const p2 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'P2', status: 'COMPLETED' });

      // Create 1 PENDING task in P1, 2 COMPLETED tasks in P2
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'T1', projectId: p1.body.data.project.id, status: 'PENDING' });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'T2', projectId: p2.body.data.project.id, status: 'COMPLETED' });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'T3', projectId: p2.body.data.project.id, status: 'COMPLETED' });

      const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalProjects).toBe(2);
      expect(res.body.data.projectsInProgress).toBe(1);
      expect(res.body.data.totalTasks).toBe(3);
      expect(res.body.data.completedTasks).toBe(2);
      expect(res.body.data.pendingTasks).toBe(1);
    }),
  );
});
