import { z } from 'zod';

// User Schemas
export const userRoleSchema = z.enum(['admin', 'user', 'viewer']);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: userRoleSchema.default('user'),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: userRoleSchema.optional(),
});

// Idea Schemas
export const ideaStatusSchema = z.enum(['draft', 'refining', 'planned', 'archived']);

export const ideaSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
  status: ideaStatusSchema,
  createdById: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createIdeaSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: ideaStatusSchema.optional(),
});

// Plan Schemas
export const planStatusSchema = z.enum(['draft', 'approved', 'archived']);

export const planSchema = z.object({
  id: z.string().uuid(),
  ideaId: z.string().uuid(),
  content: z.string(),
  version: z.number().int().positive(),
  status: planStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createPlanSchema = z.object({
  ideaId: z.string().uuid(),
  content: z.string().min(1),
});

export const updatePlanSchema = z.object({
  content: z.string().min(1).optional(),
  status: planStatusSchema.optional(),
});

// Task Schemas
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']);
export const taskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const taskSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assigneeId: z.string().uuid().nullable(),
  estimatedHours: z.number().positive().nullable(),
  actualHours: z.number().positive().nullable(),
  dueDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createTaskSchema = z.object({
  planId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: taskPrioritySchema.default('medium'),
  assigneeId: z.string().uuid().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours: z.number().positive().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

// Cluster Schemas
export const clusterEnvironmentSchema = z.enum(['development', 'staging', 'production']);

export const clusterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  apiServer: z.string().url(),
  context: z.string().nullable(),
  environment: clusterEnvironmentSchema,
  isActive: z.boolean(),
  config: z.record(z.unknown()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createClusterSchema = z.object({
  name: z.string().min(1).max(255),
  apiServer: z.string().url(),
  context: z.string().optional(),
  environment: clusterEnvironmentSchema.default('development'),
  config: z.record(z.unknown()).optional(),
});

export const updateClusterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  apiServer: z.string().url().optional(),
  context: z.string().nullable().optional(),
  environment: clusterEnvironmentSchema.optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

// Deployment Schemas
export const deploymentStatusSchema = z.enum(['pending', 'deploying', 'deployed', 'failed', 'rolled_back']);

export const deploymentSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  clusterId: z.string().uuid(),
  status: deploymentStatusSchema,
  version: z.string().nullable(),
  deployedAt: z.coerce.date().nullable(),
  rollbackVersion: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// LLM Schemas
export const llmMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export const llmRequestSchema = z.object({
  model: z.string().default('llama3.1:8b'),
  messages: z.array(llmMessageSchema),
  stream: z.boolean().default(false),
  temperature: z.number().min(0).max(2).default(0.7),
});