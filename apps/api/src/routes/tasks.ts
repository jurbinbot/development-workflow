import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { db, tasks } from '../db';
import { eq } from 'drizzle-orm';
import { createTaskSchema, updateTaskSchema } from '@devworkflow/shared';

const app = new Hono();

// List all tasks
app.get('/', requireAuth, async (c) => {
  const query = c.req.query();
  
  let allTasks;
  if (query.status) {
    allTasks = await db.select().from(tasks)
      .where(eq(tasks.status, query.status))
      .orderBy(tasks.createdAt);
  } else if (query.planId) {
    allTasks = await db.select().from(tasks)
      .where(eq(tasks.planId, query.planId))
      .orderBy(tasks.createdAt);
  } else {
    allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
  }
  
  return c.json({ tasks: allTasks });
});

// Get single task
app.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json({ task });
});

// Create task
app.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [task] = await db.insert(tasks).values({
    ...parsed.data,
    status: 'todo',
  }).returning();
  
  return c.json({ task }, 201);
});

// Update task
app.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateTaskSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [task] = await db.update(tasks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json({ task });
});

// Delete task
app.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  
  const [task] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json({ success: true });
});

export default app;