import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './lib/config';
import authRoutes from './routes/auth';
import ideasRoutes from './routes/ideas';
import plansRoutes from './routes/plans';
import tasksRoutes from './routes/tasks';
import clustersRoutes from './routes/clusters';
import deploymentsRoutes from './routes/deployments';

// Validate configuration
config.validate();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/ideas', ideasRoutes);
app.route('/api/plans', plansRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/clusters', clustersRoutes);
app.route('/api/deployments', deploymentsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  }, 500);
});

// Start server
const port = config.port;
const host = config.host;

console.log(`🚀 Development Workflow API`);
console.log(`📍 http://${host}:${port}`);
console.log(`🌍 Environment: ${config.nodeEnv}`);
console.log(`🤖 Ollama: ${config.ollamaBaseUrl} (${config.ollamaModel})`);

export default {
  port,
  hostname: host,
  fetch: app.fetch,
};