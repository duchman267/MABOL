import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!sqlHost || !sqlDbName || !user || !password) {
  // If variables not yet ready, provide placeholder during build
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    host: sqlHost || 'localhost',
    user: user || 'postgres',
    password: password || '',
    database: sqlDbName || 'postgres',
    ssl: false,
  },
  verbose: true,
  strict: true,
});
