# Tech Stack Recommendation

## Recommended Stack

### Frontend

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG flexibility, React Server Components reduce client bundle, excellent DX, built-in API routes |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system, accessible components out of box |
| **State Management** | Zustand | Lightweight, TypeScript-friendly, works great with React Query |
| **Data Fetching** | TanStack Query (React Query) | Powerful caching, optimistic updates, perfect for async state |
| **Forms** | React Hook Form + Zod | Type-safe validation, minimal re-renders, excellent DX |
| **Markdown** | react-markdown + remark-gfm | Idea/plan content rendering with GitHub-flavored markdown |

**Why this combination:** Next.js App Router provides the best balance of performance and developer experience. Tailwind + shadcn gives you a polished UI without the overhead of a full component library. Zustand is simple enough for local state while TanStack Query handles server state elegantly.

### Backend

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Bun | 3-4x faster than Node.js, native TypeScript, built-in package manager |
| **Framework** | Hono | Ultra-fast, TypeScript-first, works everywhere (Edge, Node, Bun), minimal footprint |
| **ORM** | Drizzle ORM | SQL-like syntax, type-safe, zero runtime overhead, excellent migrations |
| **Validation** | Zod | Shared with frontend, runtime type validation, infer types from schemas |
| **Authentication** | Better Auth (or Lucia) | Modern auth library, supports multiple providers, session-based, built-in user management |

**Why this combination:** Bun + Hono gives you maximum performance with minimal code. Drizzle is the most TypeScript-native ORM available. Better Auth handles user management without vendor lock-in.

### Database

| Environment | Database | Rationale |
|-------------|----------|-----------|
| **Development** | SQLite (via libsql) | Zero setup, file-based, perfect for local dev, Drizzle supports it natively |
| **Production** | PostgreSQL | Production-grade, ACID compliance, excellent Kubernetes support (CloudNativePG, CrunchyData) |
| **Migrations** | Drizzle Kit | Version-controlled schema changes, generate SQL migrations |

### AI Integration

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **LLM Provider** | Ollama (self-hosted) | No API costs, data privacy, model flexibility |
| **Model** | llama3.1:8b (default) | Good balance of speed and quality for planning tasks |
| **Alternative Models** | mistral:7b, codellama, deepseek-coder | Switch models based on task type |
| **API Client** | Ollama REST API | Direct HTTP calls, streaming support |
| **Streaming** | Server-Sent Events (SSE) | Real-time plan generation feedback |

**Why this combination:** Ollama provides a simple REST API that works with any model. SSE streaming gives users real-time feedback during plan generation.

### Infrastructure

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Container Runtime** | Docker | Standard tooling, Buildx for multi-platform |
| **Base Image** | node:22-alpine or oven/bun:alpine | Minimal footprint, fast startup |
| **Registry** | GitHub Container Registry (ghcr.io) | Integrated with repo, free for public, easy permissions |
| **CI/CD** | GitHub Actions | Native integration, matrix builds, self-hosted runners optional |
| **GitOps** | ArgoCD | Already configured in your k3s clusters |

### Kubernetes

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Manifests** | Helm Chart | Templating, values per environment, version management |
| **Secrets** | Sealed Secrets (or External Secrets) | GitOps-compatible secret management |
| **Ingress** | Traefik (k3s default) or NGINX | k3s includes Traefik by default |
| **Service Mesh** | Skupper (already installed) | Cross-cluster communication, service exposure |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client (Browser)                               │
│                         Next.js + React + Tailwind                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API Layer (Hono)                                 │
│                    Bun Runtime + Drizzle ORM + Zod                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Ideas     │  │   Plans     │  │   Tasks     │  │  Cluster Config    │ │
│  │   CRUD     │  │   Generate  │  │   Board     │  │  & Deploy          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │    Ollama API   │  │   Job Queue     │  │  Kube API        │
│   (Drizzle)     │  │   (LLM Calls)   │  │   (BullMQ)      │  │  (kubectl)       │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Project Structure

```
development-workflow/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities, API client
│   │   │   └── stores/        # Zustand stores
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── api/                    # Hono backend
│       ├── src/
│       │   ├── routes/        # API endpoints
│       │   ├── db/            # Drizzle schema & migrations
│       │   ├── services/      # Business logic
│       │   ├── lib/           # Utilities
│       │   └── index.ts       # Entry point
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                 # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── schemas/       # Zod schemas
│   │   │   └── constants/     # Shared constants
│   │   └── package.json
│   │
│   └── ui/                     # Shared UI components (shadcn)
│       ├── src/
│       └── package.json
│
├── infra/
│   ├── docker/                # Dockerfiles
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.api
│   │
│   ├── k8s/                   # Kubernetes manifests
│   │   ├── base/              # Base manifests
│   │   ├── overlays/          # Environment-specific
│   │   └── helm/              # Helm chart
│   │
│   └── argocd/                # ArgoCD Application manifests
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # PR checks, tests
│       └── release.yml        # Build & push images, deploy
│
├── docker-compose.yml          # Local development stack
├── package.json                # Monorepo root
├── pnpm-workspace.yaml
├── turbo.json                  # Turborepo config
└── README.md
```

---

## Database Schema (Draft)

```sql
-- Users (built-in auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ideas
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id),
  content TEXT NOT NULL,
  version INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  assignee_id UUID REFERENCES users(id),
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clusters
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  api_server VARCHAR(255) NOT NULL,
  context VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'development',
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deployments
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  cluster_id UUID REFERENCES clusters(id),
  status VARCHAR(50) DEFAULT 'pending',
  version VARCHAR(255),
  deployed_at TIMESTAMP,
  rollback_version VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository_owner }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run tests
        run: bun test
      
      - name: Build
        run: bun run build
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/Dockerfile.web
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/development-workflow-web:${{ github.sha }}
      
      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/Dockerfile.api
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/development-workflow-api:${{ github.sha }}
      
      - name: Update ArgoCD Application
        run: |
          # Update image tag in Helm values
          sed -i "s/imageTag:.*/imageTag: ${{ github.sha }}/g" infra/k8s/values.yaml
          
          # Commit and push if on main
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add infra/k8s/values.yaml
            git commit -m "chore: update image tag to ${{ github.sha }}"
            git push
          fi
```

---

## Configuration Management

**All configuration is externalized. No secrets or sensitive data in the repository.**

### Environment Variables (Docker/Local)

```bash
# API Configuration
DATABASE_URL=postgresql://user:pass@host:5432/devworkflow
SESSION_SECRET=<random-256-bit-secret>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b

# Web Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Kubernetes Configuration

| Config Type | Resource | Contents |
|------------|----------|----------|
| App Config | ConfigMap | Non-sensitive settings (API URLs, feature flags, model names) |
| Secrets | Secret | DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, OLLAMA credentials |
| Cluster Config | ConfigMap | Cluster endpoints, contexts, environment labels |

### Secret Management

- **Development:** `.env` files (gitignored, use `.env.example` as template)
- **Production:** Kubernetes Secrets (sealed with Sealed Secrets or managed by External Secrets Operator)
- **CI/CD:** GitHub Actions secrets for build-time injection
- **Never commit:** passwords, API keys, tokens, certificates

```yaml
# Example Kubernetes Secret (sealed)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: devworkflow-secrets
spec:
  encryptedData:
    DATABASE_URL: <sealed-value>
    SESSION_SECRET: <sealed-value>
    ADMIN_PASSWORD: <sealed-value>
```

---

## Key Features

### Built-in Admin User

Admin user is created on first startup using environment variables:

```bash
# Required for initial admin setup
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<secure-password>
```

- Admin can create/edit/delete users
- Admin can assign roles (admin, user, viewer)
- Password reset flow for all users
- Credentials only exist in runtime environment, never in code

### Cluster Management in Planning

During the planning phase, users can:
1. **Define target clusters** - Select from configured clusters
2. **Set deployment strategy** - Rolling update, blue-green, canary
3. **Configure resources** - CPU, memory limits/requests
4. **Set replicas** - Per-cluster replica counts
5. **Configure Skupper** - Service exposure, gateway settings

### Integration with Existing k3s

- Leverages existing ArgoCD for GitOps deployment
- Uses existing Skupper for cross-cluster communication
- No additional infrastructure required
- Application deployed as Helm chart

---

## Next Steps

1. Initialize monorepo with pnpm + Turborepo
2. Set up shared package with types and schemas
3. Create API project with Hono + Drizzle
4. Create Web project with Next.js
5. Set up Docker build for both
6. Create Helm chart for Kubernetes deployment
7. Set up GitHub Actions CI/CD
8. Configure ArgoCD Application manifest