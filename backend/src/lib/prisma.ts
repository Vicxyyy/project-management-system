import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../config/logger';

// Prevent multiple PrismaClient instances in development (hot-reload safe)
declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'development') {
    const client = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    client.$on('query', (e: Prisma.QueryEvent) => {
      logger.debug(`Prisma Query (${e.duration}ms): ${e.query}`);
    });

    client.$on('error', (e: Prisma.LogEvent) => {
      logger.error('Prisma error:', e.message);
    });

    return client;
  }

  const client = new PrismaClient({
    log: [{ emit: 'event', level: 'error' }],
  });

  client.$on('error', (e: Prisma.LogEvent) => {
    logger.error('Prisma error:', e.message);
  });

  return client;
}

export const prisma: PrismaClient = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected successfully');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
