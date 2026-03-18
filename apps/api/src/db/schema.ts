import { pgTable, pgUUID, varchar, text, timestamp, boolean, jsonb, decimal } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Detect database type from environment
const isPostgres = process.env.DATABASE_URL?.startsWith('postgresql');

// Helper for generating IDs
const generateId = () => createId();

// Users table - works for both PostgreSQL and SQLite
const baseUsers = {
  id: isPostgres
    ? pgUUID('id').defaultRandom().primaryKey()
    : sqliteText('id').primaryKey().$defaultFn(generateId),
  email: isPostgres
    ? varchar('email', { length: 255 }).notNull().unique()
    : sqliteText('email').notNull().unique(),
  passwordHash: isPostgres
    ? varchar('password_hash', { length: 255 }).notNull()
    : sqliteText('password_hash').notNull(),
  name: isPostgres
    ? varchar('name', { length: 255 })
    : sqliteText('name'),
  role: isPostgres
    ? varchar('role', { length: 50 }).notNull().default('user')
    : sqliteText('role').notNull().default('user'),
  createdAt: isPostgres
    ? timestamp('created_at').defaultNow().notNull()
    : sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: isPostgres
    ? timestamp('updated_at').defaultNow().notNull()
    : sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
};

export const users = isPostgres
  ? pgTable('users', baseUsers)
  : sqliteTable('users', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      email: sqliteText('email').notNull().unique(),
      passwordHash: sqliteText('password_hash').notNull(),
      name: sqliteText('name'),
      role: sqliteText('role').notNull().default('user'),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
      updatedAt: sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Ideas table
export const ideas = isPostgres
  ? pgTable('ideas', {
      id: pgUUID('id').defaultRandom().primaryKey(),
      title: varchar('title', { length: 255 }).notNull(),
      description: text('description'),
      status: varchar('status', { length: 50 }).notNull().default('draft'),
      createdById: pgUUID('created_by_id').notNull().references(() => users.id),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at').defaultNow().notNull(),
    })
  : sqliteTable('ideas', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      title: sqliteText('title').notNull(),
      description: sqliteText('description'),
      status: sqliteText('status').notNull().default('draft'),
      createdById: sqliteText('created_by_id').notNull().references(() => users.id),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
      updatedAt: sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Plans table
export const plans = isPostgres
  ? pgTable('plans', {
      id: pgUUID('id').defaultRandom().primaryKey(),
      ideaId: pgUUID('idea_id').notNull().references(() => ideas.id),
      content: text('content').notNull(),
      version: integer('version').notNull().default(1),
      status: varchar('status', { length: 50 }).notNull().default('draft'),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at').defaultNow().notNull(),
    })
  : sqliteTable('plans', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      ideaId: sqliteText('idea_id').notNull().references(() => ideas.id),
      content: sqliteText('content').notNull(),
      version: integer('version').notNull().default(1),
      status: sqliteText('status').notNull().default('draft'),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
      updatedAt: sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Tasks table
export const tasks = isPostgres
  ? pgTable('tasks', {
      id: pgUUID('id').defaultRandom().primaryKey(),
      planId: pgUUID('plan_id').notNull().references(() => plans.id),
      title: varchar('title', { length: 255 }).notNull(),
      description: text('description'),
      status: varchar('status', { length: 50 }).notNull().default('todo'),
      priority: varchar('priority', { length: 50 }).notNull().default('medium'),
      assigneeId: pgUUID('assignee_id').references(() => users.id),
      estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
      actualHours: decimal('actual_hours', { precision: 6, scale: 2 }),
      dueDate: timestamp('due_date'),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at').defaultNow().notNull(),
    })
  : sqliteTable('tasks', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      planId: sqliteText('plan_id').notNull().references(() => plans.id),
      title: sqliteText('title').notNull(),
      description: sqliteText('description'),
      status: sqliteText('status').notNull().default('todo'),
      priority: sqliteText('priority').notNull().default('medium'),
      assigneeId: sqliteText('assignee_id').references(() => users.id),
      estimatedHours: sqliteText('estimated_hours'),
      actualHours: sqliteText('actual_hours'),
      dueDate: sqliteText('due_date'),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
      updatedAt: sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Clusters table
export const clusters = isPostgres
  ? pgTable('clusters', {
      id: pgUUID('id').defaultRandom().primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      apiServer: varchar('api_server', { length: 500 }).notNull(),
      context: varchar('context', { length: 255 }),
      environment: varchar('environment', { length: 50 }).notNull().default('development'),
      isActive: boolean('is_active').notNull().default(true),
      config: jsonb('config'),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at').defaultNow().notNull(),
    })
  : sqliteTable('clusters', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      name: sqliteText('name').notNull(),
      apiServer: sqliteText('api_server').notNull(),
      context: sqliteText('context'),
      environment: sqliteText('environment').notNull().default('development'),
      isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
      config: sqliteText('config', { mode: 'json' }),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
      updatedAt: sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Deployments table
export const deployments = isPostgres
  ? pgTable('deployments', {
      id: pgUUID('id').defaultRandom().primaryKey(),
      taskId: pgUUID('task_id').notNull().references(() => tasks.id),
      clusterId: pgUUID('cluster_id').notNull().references(() => clusters.id),
      status: varchar('status', { length: 50 }).notNull().default('pending'),
      version: varchar('version', { length: 255 }),
      deployedAt: timestamp('deployed_at'),
      rollbackVersion: varchar('rollback_version', { length: 255 }),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at').defaultNow().notNull(),
    })
  : sqliteTable('deployments', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      taskId: sqliteText('task_id').notNull().references(() => tasks.id),
      clusterId: sqliteText('cluster_id').notNull().references(() => clusters.id),
      status: sqliteText('status').notNull().default('pending'),
      version: sqliteText('version'),
      deployedAt: sqliteText('deployed_at'),
      rollbackVersion: sqliteText('rollback_version'),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
      updatedAt: sqliteText('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Sessions table for Better Auth
export const sessions = isPostgres
  ? pgTable('sessions', {
      id: pgUUID('id').defaultRandom().primaryKey(),
      userId: pgUUID('user_id').notNull().references(() => users.id),
      expiresAt: timestamp('expires_at').notNull(),
      createdAt: timestamp('created_at').defaultNow().notNull(),
    })
  : sqliteTable('sessions', {
      id: sqliteText('id').primaryKey().$defaultFn(generateId),
      userId: sqliteText('user_id').notNull().references(() => users.id),
      expiresAt: sqliteText('expires_at').notNull(),
      createdAt: sqliteText('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    });

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ideas: many(ideas),
  tasks: many(tasks),
  sessions: many(sessions),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [ideas.createdById],
    references: [users.id],
  }),
  plans: many(plans),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  idea: one(ideas, {
    fields: [plans.ideaId],
    references: [ideas.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  plan: one(plans, {
    fields: [tasks.planId],
    references: [plans.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  deployments: many(deployments),
}));

export const clustersRelations = relations(clusters, ({ many }) => ({
  deployments: many(deployments),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  task: one(tasks, {
    fields: [deployments.taskId],
    references: [tasks.id],
  }),
  cluster: one(clusters, {
    fields: [deployments.clusterId],
    references: [clusters.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Cluster = typeof clusters.$inferSelect;
export type NewCluster = typeof clusters.$inferInsert;
export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;