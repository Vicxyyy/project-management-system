import { config, validateConfig } from './config/env';
import logger from './config/logger';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './lib/prisma';

async function main(): Promise<void> {
  // Validate required env vars before doing anything else
  validateConfig();

  // Connect to the database
  await connectDatabase();

  // Create and start the HTTP server
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`   Environment : ${config.nodeEnv}`);
    logger.info(`   API base    : http://localhost:${config.port}/api/v1`);
    logger.info(`   Health      : http://localhost:${config.port}/api/v1/health`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
