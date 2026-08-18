import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export interface DatabaseDiagnosticInfo {
  databaseUrlConfigured: boolean;
  hostSummary: string;
  port: string;
  sslDetected: boolean;
  pgbouncerDetected: boolean;
  prismaInitialized: boolean;
  nodeEnv: string;
}

function formatDatabaseUrl(rawUrl?: string): string {
  const url = (rawUrl || '').trim();
  if (!url) {
    console.warn('[Prisma Notice] DATABASE_URL environment variable is not configured. Database-dependent operations will use graceful fallback.');
    return '';
  }

  // Validate format and safely ensure SSL parameters for Supabase PostgreSQL
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    // If using Supabase port 6543 (transaction pooler), ensure pgbouncer=true
    if (parsed.port === '6543' && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    return parsed.toString();
  } catch {
    if (!url.includes('sslmode=')) {
      return url + (url.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    return url;
  }
}

export function getDatabaseDiagnosticInfo(): DatabaseDiagnosticInfo {
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  const configured = Boolean(rawUrl);
  let hostSummary = 'NONE';
  let port = 'NOT_SET';
  let sslDetected = false;
  let pgbouncerDetected = false;

  if (configured) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname || '';
      if (host.includes('.')) {
        const parts = host.split('.');
        hostSummary = `***.${parts.slice(-2).join('.')}`;
      } else {
        hostSummary = 'REDACTED';
      }
      port = parsed.port || '5432';
      sslDetected = parsed.searchParams.get('sslmode') === 'require' || rawUrl.includes('sslmode=require');
      pgbouncerDetected = parsed.searchParams.get('pgbouncer') === 'true' || rawUrl.includes('pgbouncer=true') || port === '6543';
    } catch {
      hostSummary = 'REDACTED_FORMAT';
      sslDetected = rawUrl.includes('sslmode=require');
      pgbouncerDetected = rawUrl.includes('pgbouncer=true') || rawUrl.includes(':6543');
    }
  }

  return {
    databaseUrlConfigured: configured,
    hostSummary,
    port,
    sslDetected,
    pgbouncerDetected,
    prismaInitialized: Boolean(globalForPrisma.prisma || Boolean(process.env.DATABASE_URL)),
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

const resolvedDbUrl = formatDatabaseUrl(process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  ...(resolvedDbUrl ? { datasources: { db: { url: resolvedDbUrl } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Safe, non-blocking lightweight connectivity verification (SELECT 1)
 */
export async function testDatabaseConnection(timeoutMs = 4000): Promise<{ connected: boolean; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { connected: false, error: 'DATABASE_URL environment variable is not configured' };
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



