import { Router, type Request, type Response } from 'express';

export const healthRouter = Router();

// Liveness probe: returns server alive state
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'mabol-backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Helper to safely verify PostgreSQL connection without leaking credentials
async function checkPostgresStatus(): Promise<{
  provider: string;
  configured: boolean;
  packageInstalled: boolean;
  status: 'connected' | 'not_configured' | 'package_missing' | 'connection_failed';
  version?: string;
}> {
  const hasConfig = Boolean(
    (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_DB_NAME) ||
    process.env.DATABASE_URL
  );

  if (!hasConfig) {
    return {
      provider: 'postgresql',
      configured: false,
      packageInstalled: false,
      status: 'not_configured',
    };
  }

  try {
    // Dynamic import to avoid static compilation errors when pg package is not yet installed
    const dynamicPkg = 'pg';
    const pg = (await import(dynamicPkg)) as any;
    const { Pool } = pg;
    const pool = new Pool(
      process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 }
        : {
            host: process.env.SQL_HOST,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DB_NAME,
            port: parseInt(process.env.SQL_PORT || '5432', 10),
            ssl: false,
            connectionTimeoutMillis: 5000,
          }
    );

    const client = await pool.connect();
    try {
      const result = await client.query('SELECT version();');
      const rawVersion: string = result.rows[0]?.version || '';
      const shortVersion = rawVersion.split(',')[0] || 'PostgreSQL';
      return {
        provider: 'postgresql',
        configured: true,
        packageInstalled: true,
        status: 'connected',
        version: shortVersion,
      };
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err: any) {
    if (err?.code === 'ERR_MODULE_NOT_FOUND') {
      return {
        provider: 'postgresql',
        configured: true,
        packageInstalled: false,
        status: 'package_missing',
      };
    }
    return {
      provider: 'postgresql',
      configured: true,
      packageInstalled: true,
      status: 'connection_failed',
    };
  }
}

// Readiness probe: reflects actual database readiness and runtime status
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const dbStatus = await checkPostgresStatus();

  res.status(200).json({
    status: dbStatus.status === 'connected' ? 'ready' : 'ready_storage_fallback',
    service: 'mabol-backend',
    timestamp: new Date().toISOString(),
    database: {
      provider: dbStatus.provider,
      configured: dbStatus.configured,
      packageInstalled: dbStatus.packageInstalled,
      status: dbStatus.status,
      ...(dbStatus.version && { version: dbStatus.version }),
    },
    storageFallback: {
      clientStorage: 'mabol_app_database_v8',
      status: 'active',
    },
    checks: {
      server: 'online',
      runtime: 'node22',
      framework: 'express-vite',
    },
  });
});
