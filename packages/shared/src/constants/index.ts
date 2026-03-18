// Task priorities and their numeric weights for sorting
export const TASK_PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

// Task status order for Kanban board columns
export const TASK_STATUS_ORDER = [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
] as const;

// Idea status order for workflow tracking
export const IDEA_STATUS_ORDER = [
  'draft',
  'refining',
  'planned',
  'archived',
] as const;

// Plan status order
export const PLAN_STATUS_ORDER = [
  'draft',
  'approved',
  'archived',
] as const;

// Cluster environments
export const CLUSTER_ENVIRONMENTS = [
  'development',
  'staging',
  'production',
] as const;

// Deployment status order
export const DEPLOYMENT_STATUS_ORDER = [
  'pending',
  'deploying',
  'deployed',
  'failed',
  'rolled_back',
] as const;

// User roles
export const USER_ROLES = ['admin', 'user', 'viewer'] as const;

// Default LLM configuration
export const DEFAULT_LLM_CONFIG = {
  model: 'llama3.1:8b',
  temperature: 0.7,
  maxTokens: 4096,
} as const;

// API routes
export const API_ROUTES = {
  // Auth
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  register: '/api/auth/register',
  session: '/api/auth/session',
  
  // Users
  users: '/api/users',
  user: (id: string) => `/api/users/${id}`,
  
  // Ideas
  ideas: '/api/ideas',
  idea: (id: string) => `/api/ideas/${id}`,
  ideaPlans: (id: string) => `/api/ideas/${id}/plans`,
  
  // Plans
  plans: '/api/plans',
  plan: (id: string) => `/api/plans/${id}`,
  planTasks: (id: string) => `/api/plans/${id}/tasks`,
  planGenerate: (id: string) => `/api/plans/${id}/generate`,
  
  // Tasks
  tasks: '/api/tasks',
  task: (id: string) => `/api/tasks/${id}`,
  
  // Clusters
  clusters: '/api/clusters',
  cluster: (id: string) => `/api/clusters/${id}`,
  
  // Deployments
  deployments: '/api/deployments',
  deployment: (id: string) => `/api/deployments/${id}`,
  deploy: (id: string) => `/api/deployments/${id}/deploy`,
  rollback: (id: string) => `/api/deployments/${id}/rollback`,
} as const;