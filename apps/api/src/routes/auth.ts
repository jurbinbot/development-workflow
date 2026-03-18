import { Hono } from 'hono';
import { auth } from '../lib/auth';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { db, users } from '../db';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';
import { createUserSchema, updateUserSchema } from '@devworkflow/shared';

const app = new Hono();

// Auth routes handled by better-auth
app.all('/*', (c) => auth.handler(c.req.raw));

// Get current user
app.get('/session', requireAuth, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// Get all users (admin only)
app.get('/users', requireAdmin, async (c) => {
  const allUsers = await db.select().from(users);
  return c.json({ users: allUsers.map(u => ({ ...u, passwordHash: undefined })) });
});

// Create user (admin only)
app.post('/users', requireAdmin, async (c) => {
  const body = await c.req.json();
  const parsed = createUserSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const { email, password, name, role } = parsed.data;
  const passwordHash = await hash(password, 10);
  
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    name,
    role: role || 'user',
  }).returning();
  
  return c.json({ user: { ...user, passwordHash: undefined } }, 201);
});

// Update user (admin only)
app.patch('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }
  
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  
  if (body.password) {
    updateData.passwordHash = await hash(body.password, 10);
  }
  
  const [user] = await db.update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user: { ...user, passwordHash: undefined } });
});

// Delete user (admin only)
app.delete('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  
  const [user] = await db.delete(users).where(eq(users.id, id)).returning();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ success: true });
});

export default app;