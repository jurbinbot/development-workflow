# PostgreSQL Multi-Cluster Replication with Skupper

This directory contains PostgreSQL configurations for cross-cluster replication using Skupper.

## Architecture

```
┌─────────────────────────────┐     Skupper      ┌─────────────────────────────┐
│      Cluster 1 (Primary)    │◄────────────────►│    Cluster 2 (Replica)      │
│                             │                  │                             │
│  ┌─────────────────────┐   │                  │  ┌─────────────────────┐   │
│  │   PostgreSQL        │   │                  │  │   PostgreSQL        │   │
│  │   (rw-primary)      │   │                  │  │   (rw-replica)      │   │
│  │                     │   │                  │  │                     │   │
│  │  - Primary instance │   │                  │  │  - Replica instance │   │
│  │  - Streaming repl  │   │                  │  │  - Read queries     │   │
│  └─────────────────────┘   │                  │  └─────────────────────┘   │
│           │                │                  │           │                 │
│           ▼                │                  │           ▼                 │
│  ┌─────────────────────┐   │                  │  ┌─────────────────────┐   │
│  │   devworkflow-api   │   │                  │  │   devworkflow-api   │   │
│  └─────────────────────┘   │                  │  └─────────────────────┘   │
│           │                │                  │           │                 │
│           ▼                │                  │           ▼                 │
│  ┌─────────────────────┐   │                  │  ┌─────────────────────┐   │
│  │   devworkflow-web   │   │                  │  │   devworkflow-web   │   │
│  └─────────────────────┘   │                  │  └─────────────────────┘   │
└─────────────────────────────┘                  └─────────────────────────────┘
```

## Prerequisites

1. Skupper installed on both clusters and linked
2. CloudNativePG operator installed on both clusters

## Deployment Options

### Option 1: ArgoCD GitOps (Recommended)

This project uses ArgoCD for GitOps deployment. The CI/CD workflow handles:

1. **Automatic deployment on push to main** - Triggers ArgoCD sync
2. **Manual PostgreSQL deployment** - One-time setup per cluster
3. **Multi-cluster deployment** - Deploys to both clusters via ArgoCD

**Initial Setup:**

1. Install CloudNativePG operator on both clusters (one-time):
```bash
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml
```

2. Create ArgoCD secrets in GitHub Actions:
   - `KUBECONFIG_CLUSTER1_BASE64` - Base64-encoded kubeconfig for primary
   - `KUBECONFIG_CLUSTER2_BASE64` - Base64-encoded kubeconfig for replica
   - `ARGOCD_SERVER_CLUSTER1` - ArgoCD server URL
   - `ARGOCD_TOKEN_CLUSTER1` - ArgoCD API token
   - `ARGOCD_SERVER_CLUSTER2` - ArgoCD server URL
   - `ARGOCD_TOKEN_CLUSTER2` - ArgoCD API token
   - `POSTGRES_PASSWORD` - Application database password
   - `POSTGRES_SUPERUSER_PASSWORD` - PostgreSQL superuser password

3. Deploy PostgreSQL (manual trigger):
   - Go to Actions → Deploy → Run workflow
   - Select `deploy-postgres: true`
   - Select `cluster: cluster1-primary` (first)
   - Run, then repeat with `cluster: cluster2-replica`

**Automatic Deployments:**
- Push to `main` triggers ArgoCD sync on both clusters
- Application uses PostgreSQL connection from secrets

### Option 2: Manual Deployment

#### Step 1: Install CloudNativePG Operator (Both Clusters)

```bash
# Install CloudNativePG operator
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml

# Verify installation
kubectl get pods -n cnpg-system
```

#### Step 2: Deploy Primary PostgreSQL (Cluster 1)

```bash
# Create secrets first
kubectl create namespace devworkflow
kubectl create secret generic postgres-credentials \
  --namespace=devworkflow \
  --from-literal=username=devworkflow \
  --from-literal=password=your-secure-password \
  --from-literal=host=postgres-rw.devworkflow.svc \
  --from-literal=port=5432 \
  --from-literal=database=devworkflow

kubectl create secret generic postgres-superuser \
  --namespace=devworkflow \
  --from-literal=username=postgres \
  --from-literal=password=your-superuser-password

kubectl create secret generic postgres-app-credentials \
  --namespace=devworkflow \
  --from-literal=DATABASE_URL="postgresql://devworkflow:your-secure-password@postgres-rw.devworkflow:5432/devworkflow" \
  --from-literal=DATABASE_URL_RO="postgresql://devworkflow:your-secure-password@postgres-ro.devworkflow:5432/devworkflow"

# Deploy PostgreSQL
kubectl apply -k infra/k8s/postgres/primary
```

#### Step 3: Deploy Replica PostgreSQL (Cluster 2)

Ensure Skupper is linked between clusters first.

```bash
# Create secrets (same passwords as primary)
kubectl create namespace devworkflow
kubectl create secret generic postgres-credentials \
  --namespace=devworkflow \
  --from-literal=username=devworkflow \
  --from-literal=password=your-secure-password \
  --from-literal=host=postgres-rw.devworkflow.svc \
  --from-literal=port=5432 \
  --from-literal=database=devworkflow

kubectl create secret generic postgres-superuser \
  --namespace=devworkflow \
  --from-literal=username=postgres \
  --from-literal=password=your-superuser-password

kubectl create secret generic postgres-app-credentials \
  --namespace=devworkflow \
  --from-literal=DATABASE_URL="postgresql://devworkflow:your-secure-password@postgres-primary.devworkflow:5432/devworkflow" \
  --from-literal=DATABASE_URL_RO="postgresql://devworkflow:your-secure-password@postgres-ro.devworkflow:5432/devworkflow"

# Deploy PostgreSQL
kubectl apply -k infra/k8s/postgres/replica
```

## High Availability

Both clusters have:
- Primary/replica failover within the cluster
- Cross-cluster replication for disaster recovery
- Application can failover to the other cluster's replica

## Failover Scenarios

### Primary Failure (Cluster 1)

1. CloudNativePG automatically promotes a replica within Cluster 1
2. If Cluster 1 is completely down, manually promote Cluster 2:

```bash
# On Cluster 2
kubectl patch cluster postgres -n devworkflow --type merge -p '
{
  "spec": {
    "instances": 3,
    "bootstrap": {
      "initdb": null,
      "pg_basebackup": null
    }
  }
}'
```

### Switch to Cluster 2 as Primary

```bash
# Promote Cluster 2 to primary
kubectl patch cluster postgres -n devworkflow --type merge -p '
{
  "spec": {
    "primaryUpdateMethod": "switchover",
    "primaryUpdateStrategy": "unsupervised"
  }
}'
```

## Monitoring

Check replication status:

```bash
# On primary cluster
kubectl exec -it postgres-1 -n devworkflow -- psql -c "SELECT * FROM pg_stat_replication;"

# On replica cluster
kubectl exec -it postgres-1 -n devworkflow -- psql -c "SELECT * FROM pg_stat_wal_receiver;"
```

## Backup

CloudNativePG supports backups to S3, Azure Blob, or GCS. Configure in the cluster spec:

```yaml
backup:
  barmanObjectStore:
    destinationPath: s3://your-bucket/postgres-backups/
    endpointURL: https://s3.amazonaws.com
    s3Credentials:
      accessKeyId:
        name: aws-creds
        key: ACCESS_KEY_ID
      secretAccessKey:
        name: aws-creds
        key: ACCESS_SECRET_KEY
```

## Notes

- This setup uses CloudNativePG which manages PostgreSQL clustering automatically
- Replication is streaming (async by default, can be sync)
- Skupper provides secure cross-cluster networking
- Both clusters can serve read queries locally
- Writes go to the primary (Cluster 1) either directly or via Skupper