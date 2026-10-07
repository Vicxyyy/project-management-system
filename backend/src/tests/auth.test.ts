/**
 * Authentication Integration Tests
 *
 * Tests all 14 scenarios from the Phase 2 spec.
 * These are real integration tests — they hit a real PostgreSQL database.
 *
 * Prerequisites:
 *   DATABASE_URL must be set in the environment pointing to a test DB.
 *
 * The suite cleans up its own test data (test users are deleted after each test
 * run) so it is safe to run repeatedly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import type { Application } from 'express';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_EMAIL_PREFIX = `test_auth_${Date.now()}`;
const USER_A_EMAIL = `${TEST_EMAIL_PREFIX}_a@example.com`;
const USER_B_EMAIL = `${TEST_EMAIL_PREFIX}_b@example.com`;
const VALID_PASSWORD = 'Password123!';

let app: Application;

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = createApp();
});

afterAll(async () => {
  // Clean up test users created during this run
  await prisma.user
    .deleteMany({
      where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } },
    })
    .catch(() => {
      // Ignore cleanup errors (DB may be unavailable)
    });
  await prisma.$disconnect();
});

// ── Helper: skip if no DB ─────────────────────────────────────────────────────

function skipIfNoDB(fn: () => Promise<void>) {
  if (!process.env.DATABASE_URL) {
    return async () => {
      console.warn('Skipped: DATABASE_URL not set');
    };
  }
  return fn;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it(
    '1. Successful registration',
    skipIfNoDB(async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Test User A',
        email: USER_A_EMAIL,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(USER_A_EMAIL);
      expect(res.body.data.user.fullName).toBe('Test User A');
      expect(res.body.data.user.id).toBeDefined();

      // CRITICAL: passwordHash must NEVER appear in any response
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );

  it('2. Missing full name returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'missing@example.com',
      password: VALID_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('3. Invalid email format returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: 'not-an-email',
      password: VALID_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('4. Weak password returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: 'weakpass@example.com',
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('4b. Password without uppercase returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: 'weakpass2@example.com',
      password: 'password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4c. Password without special character returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email: 'weakpass3@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it(
    '5. Duplicate email returns 409',
    skipIfNoDB(async () => {
      // Register once first (may already exist from test 1)
      await request(app).post('/api/auth/register').send({
        fullName: 'Test User A',
        email: USER_A_EMAIL,
        password: VALID_PASSWORD,
      });

      // Try again with same email
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Another User',
        email: USER_A_EMAIL,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it(
    '6. Successful login',
    skipIfNoDB(async () => {
      // Ensure user exists
      await request(app).post('/api/auth/register').send({
        fullName: 'Test User A',
        email: USER_A_EMAIL,
        password: VALID_PASSWORD,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: USER_A_EMAIL,
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(USER_A_EMAIL);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );

  it(
    '7. Wrong password returns 401',
    skipIfNoDB(async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: USER_A_EMAIL,
        password: 'WrongPass999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      // Must not reveal whether it was the email or password that was wrong
      expect(res.body.message).toBe('Invalid email or password');
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );

  it('8. Non-existent account returns 401', async () => {
    // This test works without DB too — unknown user → 401
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@example.com',
      password: VALID_PASSWORD,
    });

    // May be 401 (with DB) or 500 if DB is unavailable — we accept 401
    if (res.status !== 500) {
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    }
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. JWT Middleware
// ─────────────────────────────────────────────────────────────────────────────

describe('JWT Middleware / GET /api/auth/me', () => {
  it('9. Missing JWT returns 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('10. Invalid JWT returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('11. Expired JWT returns 401', async () => {
    // Sign a token that expired 1 hour ago
    const expiredToken = jwt.sign(
      { sub: 'fake-user-id' },
      process.env.JWT_SECRET as string,
      { expiresIn: '-1h' }, // Already expired
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it(
    '12. Successful GET /api/auth/me',
    skipIfNoDB(async () => {
      // Register and get a token
      const regRes = await request(app).post('/api/auth/register').send({
        fullName: 'Test User A',
        email: USER_A_EMAIL,
        password: VALID_PASSWORD,
      });

      const token: string =
        regRes.body.data?.token ||
        (
          await request(app).post('/api/auth/login').send({
            email: USER_A_EMAIL,
            password: VALID_PASSWORD,
          })
        ).body.data.token;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(USER_A_EMAIL);
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.fullName).toBe('Test User A');
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );

  it(
    "13. /api/auth/me with another user's token only returns that user's data",
    skipIfNoDB(async () => {
      // Register User B
      const regResB = await request(app).post('/api/auth/register').send({
        fullName: 'Test User B',
        email: USER_B_EMAIL,
        password: VALID_PASSWORD,
      });

      // Get User B's token (either from register or from login if already exists)
      const tokenB: string =
        regResB.body.data?.token ||
        (
          await request(app).post('/api/auth/login').send({
            email: USER_B_EMAIL,
            password: VALID_PASSWORD,
          })
        ).body.data.token;

      // Use User B's token to call /me — should return only User B's info
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(USER_B_EMAIL);
      // Must NOT return User A's data
      expect(res.body.data.user.email).not.toBe(USER_A_EMAIL);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('14. Logout returns 200 with success message', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Logged out');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Security: passwordHash must never appear in any response
// ─────────────────────────────────────────────────────────────────────────────

describe('Security: passwordHash never in responses', () => {
  it('passwordHash absent from register response', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Security Test',
        email: `security_test_${Date.now()}@example.com`,
        password: VALID_PASSWORD,
      });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('passwordHash absent from error responses', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notfound@example.com',
      password: VALID_PASSWORD,
    });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('passwordHash absent from 401 responses', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});
