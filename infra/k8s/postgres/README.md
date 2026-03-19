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

## Deployment Steps

### Step 1: Install CloudNativePG Operator (Both Clusters)

```bash
# Install CloudNativePG operator
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml

# Verify installation
kubectl get pods -n cnpg-system
```

### Step 2: Create Namespace (Both Clusters)

```bash
kubectl create namespace devworkflow
```

### Step 3: Deploy Primary PostgreSQL (Cluster 1)

```bash
# On Cluster 1 - Deploy as primary
kubectl apply -f postgres-primary.yaml -n devworkflow
```

### Step 4: Configure Skupper Service Exposure (Cluster 1)

```bash
# On Cluster 1 - Expose PostgreSQL replication port
kubectl annotate service postgres-rw -n devworkflow skupper.io/proxy=http
kubectl annotate service postgres-rw -n devworkflow skcluster.io/expose=true

# Or use skupper CLI
skupper expose service postgres-rw --port 5432 --target-service postgres-rw -n devworkflow
```

### Step 5: Deploy Replica PostgreSQL (Cluster 2)

```bash
# On Cluster 2 - Deploy as replica pointing to primary via Skupper
kubectl apply -f postgres-replica.yaml -n devworkflow
```

### Step 6: Update Application Database URLs

Update your application to use the appropriate connection strings:

**Cluster 1 (Primary - Read/Write):**
```
DATABASE_URL=postgresql://devworkflow:password@postgres-rw.devworkflow:5432/devworkflow
```

**Cluster 2 (Replica - Read Only or Read/Write via Primary):**
```
# Read from local replica
DATABASE_URL_RO=postgresql://devworkflow:password@postgres-ro.devworkflow:5432/devworkflow

# Write via Skupper to primary (requires network route)
DATABASE_URL=postgresql://devworkflow:password@postgres-rw.skupper:5432/devworkflow
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