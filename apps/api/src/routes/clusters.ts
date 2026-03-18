import { Hono } from 'hono';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { db, clusters } from '../db';
import { eq } from 'drizzle-orm';
import { createClusterSchema, updateClusterSchema } from '@devworkflow/shared';

const app = new Hono();

// List all clusters
app.get('/', requireAuth, async (c) => {
  const allClusters = await db.select().from(clusters).orderBy(clusters.name);
  return c.json({ clusters: allClusters });
});

// Get single cluster
app.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const [cluster] = await db.select().from(clusters).where(eq(clusters.id, id));
  
  if (!cluster) {
    return c.json({ error: 'Cluster not found' }, 404);
  }
  
  return c.json({ cluster });
});

// Create cluster (admin only)
app.post('/', requireAdmin, async (c) => {
  const body = await c.req.json();
  const parsed = createClusterSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [cluster] = await db.insert(clusters).values({
    ...parsed.data,
    isActive: parsed.data.isActive ?? true,
  }).returning();
  
  return c.json({ cluster }, 201);
});

// Update cluster (admin only)
app.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateClusterSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [cluster] = await db.update(clusters)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(clusters.id, id))
    .returning();
  
  if (!cluster) {
    return c.json({ error: 'Cluster not found' }, 404);
  }
  
  return c.json({ cluster });
});

// Delete cluster (admin only)
app.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  
  const [cluster] = await db.delete(clusters).where(eq(clusters.id, id)).returning();
  
  if (!cluster) {
    return c.json({ error: 'Cluster not found' }, 404);
  }
  
  return c.json({ success: true });
});

export default app;