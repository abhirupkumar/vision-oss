import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load the .env file from the root directory
dotenv.config({ path: resolve(__dirname, '../../.env') });

const rawUrl = process.env.DATABASE_URL || '';
const url = rawUrl.includes('sslmode=')
  ? rawUrl
  : rawUrl.includes('?')
    ? `${rawUrl}&sslmode=require`
    : `${rawUrl}?sslmode=require`;

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
