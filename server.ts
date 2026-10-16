import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import { config } from './server/config.ts';
import { healthRouter } from './server/routes/health.ts';
import { authRouter } from './server/routes/auth.ts';
import { membershipRequestsRouter } from './server/routes/membershipRequests.ts';
import { membersRouter } from './server/routes/members.ts';
import { matchesRouter } from './server/routes/matches.ts';
import { financeRouter } from './server/routes/finance.ts';
import { migrationRouter } from './server/routes/migration.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';
import { seedInitialDatabaseIfEmpty } from './server/dbInit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const app = express();

  // Run initial database seeding check
  await seedInitialDatabaseIfEmpty();

  // Standard JSON and URL-encoded body parsers & Cookie parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/membership-requests', membershipRequestsRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/migration', migrationRouter);

  // Serve Frontend: Vite dev server middleware in development, static files in production
  if (!config.isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[MABOL Server] Running on http://0.0.0.0:${config.port} (env: ${config.nodeEnv})`);
  });

  return server;
}

// Start server on execution
startServer().catch((err) => {
  console.error('[MABOL Server] Fatal error during startup:', err);
  process.exit(1);
});
