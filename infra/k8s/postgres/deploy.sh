#!/bin/bash
# PostgreSQL Multi-Cluster Setup Script
# Run this script to set up PostgreSQL with cross-cluster replication via Skupper

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}PostgreSQL Multi-Cluster Setup${NC}"
echo "====================================="
echo ""

# Configuration
NAMESPACE="devworkflow"
POSTGRES_USER="devworkflow"
POSTGRES_DB="devworkflow"

# Prompt for passwords
echo -e "${YELLOW}Enter PostgreSQL passwords (will be stored in Kubernetes secrets):${NC}"
read -s -p "PostgreSQL application user password: " APP_PASSWORD
echo ""
read -s -p "PostgreSQL superuser password: " SUPERUSER_PASSWORD
echo ""
read -s -p "Confirm superuser password: " SUPERUSER_PASSWORD_CONFIRM
echo ""

if [ "$SUPERUSER_PASSWORD" != "$SUPERUSER_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Error: Passwords do not match${NC}"
    exit 1
fi

# Detect current cluster context
CURRENT_CONTEXT=$(kubectl config current-context)
echo -e "${YELLOW}Current Kubernetes context: ${CURRENT_CONTEXT}${NC}"
echo ""
echo "Which cluster is this?"
echo "  1) Primary (Cluster 1) - will host the read/write primary"
echo "  2) Replica (Cluster 2) - will connect to primary via Skupper"
read -p "Enter choice [1-2]: " CLUSTER_CHOICE

case $CLUSTER_CHOICE in
    1)
        CLUSTER_TYPE="primary"
        ;;
    2)
        CLUSTER_TYPE="replica"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Setting up ${CLUSTER_TYPE} cluster...${NC}"
echo ""

# Create namespace if it doesn't exist
echo "Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Check if CloudNativePG operator is installed
echo "Checking CloudNativePG operator..."
if ! kubectl get crd clusters.postgresql.cnpg.io &>/dev/null; then
    echo -e "${YELLOW}CloudNativePG operator not found. Installing...${NC}"
    kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml
    echo "Waiting for operator to be ready..."
    kubectl rollout status deployment/cnpg-controller-manager -n cnpg-system --timeout=120s
fi

# Create/update secrets
echo "Creating secrets..."
kubectl create secret generic postgres-credentials \
    --namespace=$NAMESPACE \
    --from-literal=username=$POSTGRES_USER \
    --from-literal=password=$APP_PASSWORD \
    --from-literal=host=postgres-rw.$NAMESPACE.svc \
    --from-literal=port=5432 \
    --from-literal=database=$POSTGRES_DB \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic postgres-superuser \
    --namespace=$NAMESPACE \
    --from-literal=username=postgres \
    --from-literal=password=$SUPERUSER_PASSWORD \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy PostgreSQL based on cluster type
if [ "$CLUSTER_TYPE" = "primary" ]; then
    echo -e "${GREEN}Deploying PostgreSQL primary cluster...${NC}"
    
    # Update the primary manifest with passwords
    cat 01-postgres-primary.yaml | \
        sed "s/password: \"\"/password: \"${APP_PASSWORD}\"/g" | \
        kubectl apply -f - -n $NAMESPACE
    
    echo "Waiting for PostgreSQL cluster to be ready..."
    kubectl wait cluster/postgres -n $NAMESPACE --for=condition=Ready --timeout=300s
    
    # Expose via Skupper
    echo -e "${GREEN}Exposing PostgreSQL through Skupper...${NC}"
    kubectl apply -f 03-skupper-expose.yaml -n $NAMESPACE
    
elif [ "$CLUSTER_TYPE" = "replica" ]; then
    echo -e "${GREEN}Deploying PostgreSQL replica cluster...${NC}"
    
    # Check Skupper connectivity first
    echo -e "${YELLOW}Checking Skupper connectivity to primary cluster...${NC}"
    echo "Make sure Skupper is already linked between clusters."
    read -p "Press Enter when Skupper is connected..."
    
    # Deploy listener for primary
    kubectl apply -f 04-skupper-listener.yaml -n $NAMESPACE
    
    # Update the replica manifest with passwords
    cat 02-postgres-replica.yaml | \
        sed "s/password: \"\"/password: \"${APP_PASSWORD}\"/g" | \
        kubectl apply -f - -n $NAMESPACE
    
    echo "Waiting for PostgreSQL replica to bootstrap from primary..."
    kubectl wait cluster/postgres -n $NAMESPACE --for=condition=Ready --timeout=600s
fi

# Create application connection secret
echo "Creating application connection secret..."
if [ "$CLUSTER_TYPE" = "primary" ]; then
    DATABASE_URL="postgresql://${POSTGRES_USER}:${APP_PASSWORD}@postgres-rw.${NAMESPACE}:5432/${POSTGRES_DB}"
    DATABASE_URL_RO="postgresql://${POSTGRES_USER}:${APP_PASSWORD}@postgres-ro.${NAMESPACE}:5432/${POSTGRES_DB}"
else
    DATABASE_URL="postgresql://${POSTGRES_USER}:${APP_PASSWORD}@postgres-rw.skupper:5432/${POSTGRES_DB}"
    DATABASE_URL_RO="postgresql://${POSTGRES_USER}:${APP_PASSWORD}@postgres-ro.${NAMESPACE}:5432/${POSTGRES_DB}"
fi

kubectl create secret generic postgres-app-credentials \
    --namespace=$NAMESPACE \
    --from-literal=DATABASE_URL="$DATABASE_URL" \
    --from-literal=DATABASE_URL_RO="$DATABASE_URL_RO" \
    --dry-run=client -o yaml | kubectl apply -f -

# Update devworkflow application to use PostgreSQL
echo ""
echo -e "${GREEN}PostgreSQL cluster deployed successfully!${NC}"
echo ""
echo "Connection information:"
echo "  Namespace: $NAMESPACE"
echo "  Primary Service: postgres-rw.$NAMESPACE.svc.cluster.local:5432"
echo "  Replica Service: postgres-ro.$NAMESPACE.svc.cluster.local:5432"
echo ""
echo "To connect from your application:"
echo "  DATABASE_URL=$DATABASE_URL"
echo ""
echo "Next steps:"
if [ "$CLUSTER_TYPE" = "primary" ]; then
    echo "  1. Link Skupper to the replica cluster"
    echo "  2. Run this script on the replica cluster"
else
    echo "  1. PostgreSQL is now replicating from the primary"
    echo "  2. Update your application deployment to use the connection strings"
fi
echo ""
echo -e "${GREEN}Done!${NC}"