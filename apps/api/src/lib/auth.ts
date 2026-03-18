import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { config } from './config';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: config.databaseUrl?.startsWith('postgresql') ? 'pg' : 'sqlite',
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every day
  },
  secret: config.sessionSecret,
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});

export type Auth = typeof auth;