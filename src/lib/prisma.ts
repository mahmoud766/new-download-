import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function formatDatabaseUrl(rawUrl?: string): string {
  const url = (rawUrl || '').trim();
  if (!url) {
    console.error('[Prisma Configuration Error] DATABASE_URL environment variable is missing.');
    return '';
  }

  // Validate format and ensure SSL parameters for Supabase PostgreSQL
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

const resolvedDbUrl = formatDatabaseUrl(process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  ...(resolvedDbUrl ? { datasources: { db: { url: resolvedDbUrl } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}


