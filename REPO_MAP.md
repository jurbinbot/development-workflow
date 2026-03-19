# REPO_MAP.md

Quick reference for navigating the development-workflow repository.

## Project Overview

Development Workflow is a full-stack application for managing ideas from conception to Kubernetes deployment, with AI-assisted planning and multi-cluster support via Skupper.

---

## Repository Structure

```
development-workflow/
├── apps/                          # Application packages
│   ├── api/                       # Backend API (Bun + Hono)
│   │   ├── src/
│   │   │   ├── db/               # Database layer
│   │   │   │   ├── index.ts     # DB connection & exports
│   │   │   │   ├── schema.ts    # Drizzle schema (users, ideas, plans, tasks, clusters, deployments)
│   │   │   │   ├── migrate.ts   # Migration runner
│   │   │   │   └── seed.ts      # Admin user seeding
│   │   │   ├── lib/             # Shared utilities
│   │   │   │   ├── config.ts    # Environment config (all from env vars)
│   │   │   │   ├── auth.ts      # Better Auth setup
│   │   │   │   └── ollama.ts    # Ollama LLM client
│   │   │   ├── middleware/       # Hono middleware
│   │   │   │   └── auth.ts      # requireAuth, requireAdmin
│   │   │   ├── routes/          # API endpoints
│   │   │   │   ├── auth.ts      # /api/auth/* - user management
│   │   │   │   ├── ideas.ts     # /api/ideas/* - CRUD + plan generation
│   │   │   │   ├── plans.ts     # /api/plans/* - CRUD + refinement
│   │   │   │   ├── tasks.ts     # /api/tasks/* - CRUD + status
│   │   │   │   ├── clusters.ts  # /api/clusters/* - K8s cluster config
│   │   │   │   └── deployments.ts # /api/deployments/* - deploy/rollback
│   │   │   └── index.ts         # App entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── drizzle.config.ts
│   │
│   └── web/                      # Frontend (Next.js 14)
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   │   ├── layout.tsx   # Root layout
│       │   │   ├── page.tsx     # Home page
│       │   │   ├── providers.tsx # React Query provider
│       │   │   └── globals.css  # Tailwind styles
│       │   ├── components/      # React components
│       │   └── lib/             # Client utilities
│       │       ├── api.ts       # API client
│       │       └── utils.ts     # cn() helper
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── postcss.config.js
│
├── packages/                     # Shared packages
│   └── shared/                   # Shared types & schemas
│       ├── src/
│       │   ├── types/           # TypeScript interfaces
│       │   │   └── index.ts    # User, Idea, Plan, Task, Cluster, Deployment, LLM
│       │   ├── schemas/        # Zod validation schemas
│       │   │   └── index.ts    # CRUD schemas for all entities
│       │   ├── constants/      # App constants
│       │   │   └── index.ts    # API routes, status orders, defaults
│       │   └── index.ts        # Barrel export
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
│
├── infra/                        # Infrastructure
│   ├── docker/                  # Container definitions
│   │   ├── Dockerfile.api       # API container
│   │   └── Dockerfile.web       # Web container
│   │
│   ├── k8s/                     # Kubernetes manifests
│   │   ├── base/                # Base manifests
│   │   │   ├── deployment-api.yaml
│   │   │   ├── deployment-web.yaml
│   │   │   ├── ingress.yaml
│   │   │   └── kustomization.yaml
│   │   ├── overlays/            # Environment-specific
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── helm/                # Helm chart
│   │   │   └── devworkflow/
│   │   │       ├── Chart.yaml
│   │   │       ├── values.yaml  # Config values (secrets from env)
│   │   │       └── templates/
│   │   │           ├── _helpers.tpl
│   │   │           ├── namespace.yaml
│   │   │           ├── api-deployment.yaml
│   │   │           ├── web-deployment.yaml
│   │   │           └── ingress.yaml
│   │   └── postgres/            # PostgreSQL multi-cluster setup
│   │       ├── README.md       # Setup documentation
│   │       ├── 00-cnpg-operator.yaml      # CloudNativePG operator
│   │       ├── 01-postgres-primary.yaml   # Primary cluster config
│   │       ├── 02-postgres-replica.yaml   # Replica cluster config
│   │       ├── 03-skupper-expose.yaml     # Skupper exposure (primary)
│   │       ├── 04-skupper-listener.yaml  # Skupper listener (replica)
│   │       ├── 05-devworkflow-values.yaml # App values for Postgres
│   │       ├── deploy.sh        # Interactive setup script
│   │       └── kustomization.yaml
│   │
│   └── argocd/                  # ArgoCD Application
│       └── application.yaml     # GitOps deployment config
│
├── .github/                      # GitHub workflows
│   └── workflows/
│       ├── ci.yml               # PR checks (lint, test, build)
│       ├── release.yml          # Tag-triggered image build
│       └── deploy.yml           # Helm deploy to clusters
│
├── docs/                         # Documentation
│   └── TECH_STACK.md            # Architecture decisions
│
├── package.json                  # Monorepo root
├── pnpm-workspace.yaml          # Workspace config
├── turbo.json                   # Turborepo tasks
├── .env.example                 # Environment template
├── docker-compose.yml           # Local dev stack
├── PLAN.md                      # Project plan
└── README.md                    # Project overview
```

---

## Key Files by Function

### Configuration
| File | Purpose |
|------|---------|
| `.env.example` | Environment template (copy to `.env`, never commit) |
| `package.json` | Monorepo scripts and dependencies |
| `turbo.json` | Turborepo task pipeline |
| `apps/api/drizzle.config.ts` | Database migration config |
| `apps/api/src/lib/config.ts` | Runtime config from env vars |

### API Endpoints
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/*` | ALL | Better Auth handlers + user CRUD |
| `/api/ideas` | GET, POST | List/create ideas |
| `/api/ideas/:id` | GET, PATCH, DELETE | CRUD single idea |
| `/api/ideas/:id/plans` | GET | Get plans for an idea |
| `/api/ideas/:id/generate-plan` | POST | LLM plan generation |
| `/api/plans` | GET, POST | List/create plans |
| `/api/plans/:id` | GET, PATCH, DELETE | CRUD single plan |
| `/api/plans/:id/tasks` | GET | Get tasks for a plan |
| `/api/plans/:id/refine` | POST | LLM plan refinement |
| `/api/tasks` | GET, POST | List/create tasks |
| `/api/tasks/:id` | GET, PATCH, DELETE | CRUD single task |
| `/api/clusters` | GET, POST | List/create clusters (admin) |
| `/api/clusters/:id` | GET, PATCH, DELETE | CRUD single cluster |
| `/api/deployments` | GET, POST | List/create deployments |
| `/api/deployments/:id/deploy` | POST | Trigger deployment |
| `/api/deployments/:id/rollback` | POST | Rollback deployment |

### Database Schema
| Table | Columns |
|-------|---------|
| `users` | id, email, passwordHash, name, role, createdAt, updatedAt |
| `sessions` | id, userId, expiresAt, createdAt |
| `ideas` | id, title, description, status, createdById, createdAt, updatedAt |
| `plans` | id, ideaId, content, version, status, createdAt, updatedAt |
| `tasks` | id, planId, title, description, status, priority, assigneeId, estimatedHours, actualHours, dueDate, createdAt, updatedAt |
| `clusters` | id, name, apiServer, context, environment, isActive, config, createdAt, updatedAt |
| `deployments` | id, taskId, clusterId, status, version, deployedAt, rollbackVersion, createdAt, updatedAt |

---

## Environment Variables

All configuration is externalized. Copy `.env.example` to `.env` and set values:

```bash
# Required
DATABASE_URL=postgresql://... or ./data/devworkflow.db
SESSION_SECRET=<256-bit-random-string>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>
OLLAMA_BASE_URL=http://localhost:11434

# Optional
OLLAMA_MODEL=llama3.1:8b
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Kubernetes secrets** are set via Helm values (from CI/CD secrets or external secret management).

---

## Common Commands

```bash
# Install dependencies
bun install

# Development
bun run dev              # Start all services
bun run --filter api dev # Start API only
bun run --filter web dev # Start Web only

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema directly
bun run db:seed          # Create admin user

# Build
bun run build            # Build all packages

# Test
bun run test             # Run tests

# Lint
bun run lint             # Lint all packages
bun run format           # Format code
```

---

## Infrastructure Deployment

### Local Development
```bash
docker-compose up       # Start API + Web + Ollama
```

### Kubernetes (Helm)
```bash
# Install
helm install devworkflow ./infra/k8s/helm/devworkflow \
  --namespace devworkflow --create-namespace \
  --set secrets.api.databaseUrl=$DATABASE_URL \
  --set secrets.api.sessionSecret=$SESSION_SECRET \
  --set secrets.api.adminEmail=$ADMIN_EMAIL \
  --set secrets.api.adminPassword=$ADMIN_PASSWORD \
  --set secrets.api.ollamaBaseUrl=$OLLAMA_BASE_URL

# Upgrade
helm upgrade devworkflow ./infra/k8s/helm/devworkflow \
  --namespace devworkflow
```

### ArgoCD (GitOps)
Push to main branch → GitHub Actions builds images → ArgoCD syncs from repo.

---

## Architecture Notes

- **Database:** SQLite for dev, PostgreSQL for production
- **Auth:** Better Auth with email/password, session-based
- **LLM:** Ollama API for plan generation/refinement
- **API:** Hono framework on Bun runtime
- **Frontend:** Next.js 14 App Router with Tailwind
- **State:** Zustand (client) + TanStack Query (server)
- **Validation:** Zod schemas shared between frontend/backend
- **GitOps:** ArgoCD watches repo, deploys via Helm
- **Service Mesh:** Skupper for cross-cluster communication