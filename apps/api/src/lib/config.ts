// Environment configuration - all config from env vars
// No secrets stored in code

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || './data/devworkflow.db',
  
  // Auth
  sessionSecret: process.env.SESSION_SECRET || (() => {
    throw new Error('SESSION_SECRET environment variable is required');
  })(),
  
  // Admin user (for initial seed)
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  
  // Ollama
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Validation
  validate() {
    if (!process.env.SESSION_SECRET && this.nodeEnv === 'production') {
      throw new Error('SESSION_SECRET is required in production');
    }
    return true;
  },
} as const;