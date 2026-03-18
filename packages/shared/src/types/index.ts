// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'viewer';

// Idea types
export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IdeaStatus = 'draft' | 'refining' | 'planned' | 'archived';

// Plan Types
export interface Plan {
  id: string;
  ideaId: string;
  content: string;
  version: number;
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PlanStatus = 'draft' | 'approved' | 'archived';

// Task Types
export interface Task {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// Cluster Types
export interface Cluster {
  id: string;
  name: string;
  apiServer: string;
  context: string | null;
  environment: ClusterEnvironment;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ClusterEnvironment = 'development' | 'staging' | 'production';

// Deployment Types
export interface Deployment {
  id: string;
  taskId: string;
  clusterId: string;
  status: DeploymentStatus;
  version: string | null;
  deployedAt: Date | null;
  rollbackVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DeploymentStatus = 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled_back';

// LLM Types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  stream?: boolean;
  temperature?: number;
}

export interface LLMResponse {
  model: string;
  created_at: string;
  message: LLMMessage;
  done: boolean;
}