import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { db, deployments, clusters, tasks } from '../db';
import { eq } from 'drizzle-orm';

const app = new Hono();

// List all deployments
app.get('/', requireAuth, async (c) => {
  const query = c.req.query();
  
  let allDeployments;
  if (query.taskId) {
    allDeployments = await db.select().from(deployments)
      .where(eq(deployments.taskId, query.taskId))
      .orderBy(deployments.createdAt);
  } else if (query.clusterId) {
    allDeployments = await db.select().from(deployments)
      .where(eq(deployments.clusterId, query.clusterId))
      .orderBy(deployments.createdAt);
  } else {
    allDeployments = await db.select().from(deployments).orderBy(deployments.createdAt);
  }
  
  return c.json({ deployments: allDeployments });
});

// Get single deployment
app.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const [deployment] = await db.select().from(deployments).where(eq(deployments.id, id));
  
  if (!deployment) {
    return c.json({ error: 'Deployment not found' }, 404);
  }
  
  return c.json({ deployment });
});

// Create deployment
app.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  
  // Verify task exists
  const [task] = await db.select().from(tasks).where(eq(tasks.id, body.taskId));
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  // Verify cluster exists
  const [cluster] = await db.select().from(clusters).where(eq(clusters.id, body.clusterId));
  if (!cluster) {
    return c.json({ error: 'Cluster not found' }, 404);
  }
  
  const [deployment] = await db.insert(deployments).values({
    taskId: body.taskId,
    clusterId: body.clusterId,
    status: 'pending',
  }).returning();
  
  return c.json({ deployment }, 201);
});

// Trigger deployment
app.post('/:id/deploy', requireAuth, async (c) => {
  const id = c.req.param('id');
  
  const [deployment] = await db.select().from(deployments).where(eq(deployments.id, id));
  if (!deployment) {
    return c.json({ error: 'Deployment not found' }, 404);
  }
  
  // Update status to deploying
  const [updated] = await db.update(deployments)
    .set({ status: 'deploying', updatedAt: new Date() })
    .where(eq(deployments.id, id))
    .returning();
  
  // TODO: Trigger actual Kubernetes deployment via ArgoCD API
  // This would involve:
  // 1. Getting cluster config from DB
  // 2. Using kubectl or Kubernetes client to apply manifests
  // 3. Or triggering ArgoCD sync
  
  // For now, simulate deployment
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const [final] = await db.update(deployments)
    .set({
      status: 'deployed',
      version: process.env.npm_package_version || '0.1.0',
      deployedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, id))
    .returning();
  
  return c.json({ deployment: final });
});

// Rollback deployment
app.post('/:id/rollback', requireAuth, async (c) => {
  const id = c.req.param('id');
  
  const [deployment] = await db.select().from(deployments).where(eq(deployments.id, id));
  if (!deployment) {
    return c.json({ error: 'Deployment not found' }, 404);
  }
  
  if (!deployment.rollbackVersion) {
    return c.json({ error: 'No rollback version available' }, 400);
  }
  
  // TODO: Trigger actual rollback via ArgoCD or kubectl
  
  const [rolledBack] = await db.update(deployments)
    .set({
      status: 'rolled_back',
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, id))
    .returning();
  
  return c.json({ deployment: rolledBack });
});

export default app;