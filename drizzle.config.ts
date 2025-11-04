import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9hC3YdNGXZeW@ep-old-lab-a9btb58p-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});