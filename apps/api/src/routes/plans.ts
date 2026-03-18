import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { db, plans, tasks } from '../db';
import { eq } from 'drizzle-orm';
import { createPlanSchema, updatePlanSchema } from '@devworkflow/shared';
import { ollama } from '../lib/ollama';

const app = new Hono();

// List all plans
app.get('/', requireAuth, async (c) => {
  const allPlans = await db.select().from(plans).orderBy(plans.createdAt);
  return c.json({ plans: allPlans });
});

// Get single plan
app.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const [plan] = await db.select().from(plans).where(eq(plans.id, id));
  
  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }
  
  return c.json({ plan });
});

// Create plan manually
app.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createPlanSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [plan] = await db.insert(plans).values({
    ...parsed.data,
    version: 1,
    status: 'draft',
  }).returning();
  
  return c.json({ plan }, 201);
});

// Update plan
app.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updatePlanSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [plan] = await db.select().from(plans).where(eq(plans.id, id));
  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }
  
  const [updated] = await db.update(plans)
    .set({
      ...parsed.data,
      version: body.content ? plan.version + 1 : plan.version,
      updatedAt: new Date(),
    })
    .where(eq(plans.id, id))
    .returning();
  
  return c.json({ plan: updated });
});

// Delete plan
app.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  
  const [plan] = await db.delete(plans).where(eq(plans.id, id)).returning();
  
  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }
  
  return c.json({ success: true });
});

// Get tasks for a plan
app.get('/:id/tasks', requireAuth, async (c) => {
  const planId = c.req.param('id');
  const planTasks = await db.select().from(tasks).where(eq(tasks.planId, planId));
  return c.json({ tasks: planTasks });
});

// Refine plan with LLM
app.post('/:id/refine', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const [plan] = await db.select().from(plans).where(eq(plans.id, id));
  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }
  
  const feedback = body.feedback;
  if (!feedback) {
    return c.json({ error: 'Feedback is required' }, 400);
  }
  
  try {
    const refinedPlan = await ollama.refinePlan(plan.content, feedback);
    
    const [updated] = await db.update(plans)
      .set({
        content: refinedPlan,
        version: plan.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
      .returning();
    
    return c.json({ plan: updated });
  } catch (error) {
    console.error('Plan refinement failed:', error);
    return c.json({ error: 'Failed to refine plan' }, 500);
  }
});

// Approve plan
app.post('/:id/approve', requireAuth, async (c) => {
  const id = c.req.param('id');
  
  const [plan] = await db.update(plans)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(plans.id, id))
    .returning();
  
  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404);
  }
  
  return c.json({ plan });
});

export default app;