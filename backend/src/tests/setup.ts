/**
 * Test setup file.
 * Runs once before the entire test suite.
 *
 * Sets up test environment variables so the app can boot without
 * a real .env file. Uses a strong fake JWT_SECRET for signing test tokens.
 *
 * DATABASE_URL must point to a real PostgreSQL instance for integration tests.
 * If not set, tests that hit the DB will be skipped or fail with a clear message.
 */

// Set test env vars BEFORE any module imports that read process.env
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // OS assigns a random port for each test run
process.env.JWT_SECRET =
  'test_secret_at_least_64_chars_long_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// DATABASE_URL should already be set in the shell environment.
// If it is not set, integration tests will fail with a connection error.
// That is intentional — use a dedicated test database, not production.
if (!process.env.DATABASE_URL) {
  console.warn(
    '\n⚠️  DATABASE_URL is not set. Integration tests that require the database will fail.\n' +
      '   Set DATABASE_URL in your environment or a .env.test file to run them.\n',
  );
}
