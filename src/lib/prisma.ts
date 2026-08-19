import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export interface DatabaseDiagnosticInfo {
  databaseType: 'mysql' | 'postgresql' | 'none';
  databaseUrlConfigured: boolean;
  hostSummary: string;
  port: string;
  prismaInitialized: boolean;
  nodeEnv: string;
}

function formatDatabaseUrl(rawUrl?: string): string {
  const url = (rawUrl || '').trim();
  if (!url) {
    console.warn('[Prisma Notice] DATABASE_URL environment variable is not configured.');
    return '';
  }

  // If MySQL (Hostinger standard) -> pass directly
  if (url.startsWith('mysql://') || url.startsWith('mysql:')) {
    return url;
  }

  // If PostgreSQL URL is provided while Prisma client is generated for MySQL
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    console.warn('[Prisma Notice] Active Prisma schema is MySQL, but DATABASE_URL starts with postgresql://. Set DATABASE_URL=mysql://USER:PASS@HOST:3306/DB_NAME in Hostinger environment.');
    return '';
  }

  return url;
}

export function getDatabaseDiagnosticInfo(): DatabaseDiagnosticInfo {
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  const configured = Boolean(rawUrl);
  let databaseType: 'mysql' | 'postgresql' | 'none' = 'none';
  let hostSummary = 'NONE';
  let port = 'NOT_SET';

  if (configured) {
    if (rawUrl.startsWith('mysql://') || rawUrl.startsWith('mysql:')) {
      databaseType = 'mysql';
      port = '3306';
    } else if (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://')) {
      databaseType = 'postgresql';
      port = '5432';
    }

    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname || '';
      if (host.includes('.')) {
        const parts = host.split('.');
        hostSummary = `***.${parts.slice(-2).join('.')}`;
      } else {
        hostSummary = 'REDACTED_HOST';
      }
      if (parsed.port) {
        port = parsed.port;
      }
    } catch {
      hostSummary = 'REDACTED_HOST';
    }
  }

  return {
    databaseType,
    databaseUrlConfigured: configured,
    hostSummary,
    port,
    prismaInitialized: Boolean(globalForPrisma.prisma || Boolean(process.env.DATABASE_URL)),
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

const resolvedDbUrl = formatDatabaseUrl(process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: resolvedDbUrl || 'mysql://127.0.0.1:3306/omnifetch_pro',
    },
  },
  log: resolvedDbUrl ? ['error'] : [],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Safe, non-blocking lightweight connectivity verification (SELECT 1)
 */
export async function testDatabaseConnection(timeoutMs = 4000): Promise<{ connected: boolean; error?: string }> {
  if (!resolvedDbUrl) {
    return {
      connected: false,
      error: process.env.DATABASE_URL?.startsWith('postgresql://')
        ? 'DATABASE_URL protocol mismatch (PostgreSQL URL provided for MySQL schema)'
        : 'DATABASE_URL environment variable is not configured',
    };
  }
  try {
    const checkPromise = prisma.$queryRawUnsafe('SELECT 1 as result');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DATABASE_QUERY_TIMEOUT')), timeoutMs)
    );
    await Promise.race([checkPromise, timeoutPromise]);
    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message?.includes('DATABASE_QUERY_TIMEOUT')
        ? 'Database connection timed out'
        : 'Database query failed or database unreachable',
    };
  }
}




