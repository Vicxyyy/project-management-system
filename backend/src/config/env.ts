import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  isDev(): boolean {
    return this.nodeEnv === 'development';
  },
  isProd(): boolean {
    return this.nodeEnv === 'production';
  },
  isTest(): boolean {
    return this.nodeEnv === 'test';
  },
} as const;

/**
 * Validates that all required environment variables are set.
 * Call this once at startup (skipped in test mode).
 */
export function validateConfig(): void {
  requireEnv('DATABASE_URL');
  requireEnv('JWT_SECRET');
}
