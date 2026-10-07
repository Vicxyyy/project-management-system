import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { AppError } from '../errors/AppError';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';

/** Number of bcrypt salt rounds. 12 is a good balance of security vs. speed. */
const SALT_ROUNDS = 12;

/** Shape of the safe user object we return — never includes passwordHash. */
export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Full auth response returned after register/login. */
export interface AuthResponse {
  user: SafeUser;
  token: string;
}

/**
 * Strips passwordHash from a user record.
 * Always use this before returning user data in API responses.
 */
export function toSafeUser(user: {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
}): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

/**
 * Register a new user.
 * - Checks for duplicate email
 * - Hashes password with bcrypt
 * - Creates user in DB
 * - Returns safe user object + JWT
 */
export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { fullName, email, password } = input;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Hash password — NEVER store plaintext
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { fullName, email, passwordHash },
  });

  const token = signToken(user.id);

  return { user: toSafeUser(user), token };
}

/**
 * Authenticate an existing user.
 * - Looks up user by email
 * - Compares password with bcrypt
 * - Returns safe user object + JWT
 *
 * Uses a generic "Invalid credentials" message for both
 * "email not found" and "wrong password" to prevent user enumeration.
 */
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt comparison to prevent timing attacks,
  // even when the user does not exist.
  const dummyHash = '$2b$12$invalidhashusedtopreventimaginarytimingattacks........';
  const passwordHash = user?.passwordHash ?? dummyHash;
  const isValid = await bcrypt.compare(password, passwordHash);

  if (!user || !isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user.id);

  return { user: toSafeUser(user), token };
}

/**
 * Fetch the authenticated user by ID.
 * Called by GET /api/auth/me after middleware verifies the JWT.
 */
export async function getUserById(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toSafeUser(user);
}
