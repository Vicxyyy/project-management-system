/**
 * Prisma Seed Script
 *
 * Creates a small, repeatable dataset for development and testing.
 * Safe to run multiple times — uses upsert to avoid duplicates.
 *
 * Run:  npm run seed   (from backend/)
 */

import { PrismaClient, ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      // In production, passwords are hashed via bcrypt. This is a placeholder hash.
      passwordHash: '$2b$10$PLACEHOLDER_HASH_FOR_SEED_DATA_ONLY_DO_NOT_USE',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      passwordHash: '$2b$10$PLACEHOLDER_HASH_FOR_SEED_DATA_ONLY_DO_NOT_USE',
    },
  });

  console.log(`  ✅ Users created: ${alice.fullName}, ${bob.fullName}`);

  // ── Projects ───────────────────────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      userId: alice.id,
      name: 'E-Commerce Platform',
      description: 'Build a full-featured online store with payments and inventory management.',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'seed-project-2' },
    update: {},
    create: {
      id: 'seed-project-2',
      userId: alice.id,
      name: 'Mobile App Redesign',
      description: 'Redesign the existing mobile application with a modern UI/UX.',
      status: ProjectStatus.NOT_STARTED,
      startDate: new Date('2026-07-01'),
    },
  });

  const project3 = await prisma.project.upsert({
    where: { id: 'seed-project-3' },
    update: {},
    create: {
      id: 'seed-project-3',
      userId: bob.id,
      name: 'Data Pipeline',
      description: 'ETL pipeline for processing customer analytics data.',
      status: ProjectStatus.COMPLETED,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-01-31'),
    },
  });

  console.log(`  ✅ Projects created: ${project1.name}, ${project2.name}, ${project3.name}`);

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasks = [
    // Alice — E-Commerce Platform
    {
      id: 'seed-task-1',
      userId: alice.id,
      projectId: project1.id,
      name: 'Set up project repository',
      description: 'Initialize monorepo, configure CI/CD pipelines.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      dueDate: new Date('2026-01-15'),
    },
    {
      id: 'seed-task-2',
      userId: alice.id,
      projectId: project1.id,
      name: 'Design database schema',
      description: 'Create ERD and define all tables, relations, and indexes.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      dueDate: new Date('2026-01-31'),
    },
    {
      id: 'seed-task-3',
      userId: alice.id,
      projectId: project1.id,
      name: 'Implement product catalog API',
      description: 'CRUD endpoints for products, categories, and inventory.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date('2026-03-15'),
    },
    {
      id: 'seed-task-4',
      userId: alice.id,
      projectId: project1.id,
      name: 'Integrate payment gateway',
      description: 'Stripe integration with webhooks for order confirmation.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: new Date('2026-05-01'),
    },
    // Alice — Mobile App Redesign
    {
      id: 'seed-task-5',
      userId: alice.id,
      projectId: project2.id,
      name: 'Conduct UX research',
      description: 'User interviews and competitive analysis.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: new Date('2026-07-31'),
    },
    {
      id: 'seed-task-6',
      userId: alice.id,
      projectId: project2.id,
      name: 'Create wireframes',
      description: 'Low-fidelity wireframes for all key screens.',
      priority: TaskPriority.LOW,
      status: TaskStatus.PENDING,
      dueDate: new Date('2026-08-15'),
    },
    // Bob — Data Pipeline
    {
      id: 'seed-task-7',
      userId: bob.id,
      projectId: project3.id,
      name: 'Ingest raw data sources',
      description: 'Connect to S3 buckets and Kafka topics.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      dueDate: new Date('2025-10-31'),
    },
    {
      id: 'seed-task-8',
      userId: bob.id,
      projectId: project3.id,
      name: 'Build transformation layer',
      description: 'dbt models for cleaning and aggregating raw events.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      dueDate: new Date('2025-12-15'),
    },
    {
      id: 'seed-task-9',
      userId: bob.id,
      projectId: project3.id,
      name: 'Set up monitoring dashboards',
      description: 'Grafana dashboards for pipeline health metrics.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      dueDate: new Date('2026-01-20'),
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log(`  ✅ Tasks created: ${tasks.length} tasks`);
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('  Seed users:');
  console.log(`    alice@example.com  (id: ${alice.id})`);
  console.log(`    bob@example.com    (id: ${bob.id})`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
