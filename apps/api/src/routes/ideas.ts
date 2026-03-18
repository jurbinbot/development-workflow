import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { db, ideas, plans } from '../db';
import { eq } from 'drizzle-orm';
import { createIdeaSchema, updateIdeaSchema } from '@devworkflow/shared';
import { ollama } from '../lib/ollama';

const app = new Hono();

// List all ideas
app.get('/', requireAuth, async (c) => {
  const allIdeas = await db.select().from(ideas).orderBy(ideas.createdAt);
  return c.json({ ideas: allIdeas });
});

// Get single idea
app.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
  
  if (!idea) {
    return c.json({ error: 'Idea not found' }, 404);
  }
  
  return c.json({ idea });
});

// Create idea
app.post('/', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = createIdeaSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [idea] = await db.insert(ideas).values({
    ...parsed.data,
    createdById: user.id,
  }).returning();
  
  return c.json({ idea }, 201);
});

// Update idea
app.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateIdeaSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const [idea] = await db.update(ideas)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(ideas.id, id))
    .returning();
  
  if (!idea) {
    return c.json({ error: 'Idea not found' }, 404);
  }
  
  return c.json({ idea });
});

// Delete idea
app.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  
  const [idea] = await db.delete(ideas).where(eq(ideas.id, id)).returning();
  
  if (!idea) {
    return c.json({ error: 'Idea not found' }, 404);
  }
  
  return c.json({ success: true });
});

// Get plans for an idea
app.get('/:id/plans', requireAuth, async (c) => {
  const ideaId = c.req.param('id');
  const ideaPlans = await db.select().from(plans).where(eq(plans.ideaId, ideaId));
  return c.json({ plans: ideaPlans });
});

// Generate plan for idea using LLM
app.post('/:id/generate-plan', requireAuth, async (c) => {
  const ideaId = c.req.param('id');
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
  
  if (!idea) {
    return c.json({ error: 'Idea not found' }, 404);
  }
  
  try {
    const generatedPlan = await ollama.generatePlan(
      `${idea.title}${idea.description ? `\n\n${idea.description}` : ''}`
    );
    
    const [plan] = await db.insert(plans).values({
      ideaId,
      content: generatedPlan,
      status: 'draft',
      version: 1,
    }).returning();
    
    // Update idea status
    await db.update(ideas)
      .set({ status: 'refining', updatedAt: new Date() })
      .where(eq(ideas.id, ideaId));
    
    return c.json({ plan }, 201);
  } catch (error) {
    console.error('Plan generation failed:', error);
    return c.json({ error: 'Failed to generate plan' }, 500);
  }
});

export default app;