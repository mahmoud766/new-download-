import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export interface SafeDatabaseDiagnostics {
  databaseUrlPresent: boolean;
  protocol: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: 'HIDDEN';
  prismaProvider: 'mysql';
  nodeVersion: string;
  prismaVersion: string;
  socketPath?: string;
}

export interface ConnectionTestResult {
  connected: boolean;
  error?: string;
  errorCode?: string;
  diagnostics: SafeDatabaseDiagnostics;
  queryLatencyMs?: number;
}

/**
 * Safely inspect DATABASE_URL without ever logging or returning the password.
 */
export function getSafeDatabaseDiagnostics(): SafeDatabaseDiagnostics {
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  const configured = Boolean(rawUrl);

  let protocol = 'none';
  let host = 'NOT_SET';
  let port = '3306';
  let databaseName = 'NOT_SET';
  let username = 'NOT_SET';
  let socketPath: string | undefined = undefined;

  if (configured) {
    try {
      // Check prefix
      if (rawUrl.startsWith('mysql://')) protocol = 'mysql';
      else if (rawUrl.startsWith('mysqls://')) protocol = 'mysqls';
      else if (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://')) protocol = 'postgresql';
      else if (rawUrl.startsWith('sqlite:')) protocol = 'sqlite';
      else {
        const match = rawUrl.match(/^([a-zA-Z0-9_-]+):\/\//);
        protocol = match ? match[1] : 'unknown';
      }

      // Parse connection details safely
      const parsed = new URL(rawUrl.replace(/^mysqls?:\/\//i, 'http://'));
      host = parsed.hostname || 'NOT_SET';
      port = parsed.port || '3306';
      username = parsed.username ? decodeURIComponent(parsed.username) : 'NOT_SET';

      if (parsed.pathname && parsed.pathname.length > 1) {
        databaseName = decodeURIComponent(parsed.pathname.substring(1));
      }

      // Check socket param if Hostinger unix socket is used
      if (parsed.searchParams && parsed.searchParams.has('socket')) {
        socketPath = parsed.searchParams.get('socket') || undefined;
      }
    } catch {
      host = 'MALFORMED_URL';
    }
  }

  return {
    databaseUrlPresent: configured,
    protocol,
    host,
    port,
    databaseName,
    username,
    password: 'HIDDEN',
    prismaProvider: 'mysql',
    nodeVersion: process.version,
    prismaVersion: '5.22.0',
    ...(socketPath ? { socketPath } : {}),
  };
}

/**
 * Sanitizes any error message by stripping passwords, tokens, and raw connection strings.
 */
function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'Database operation failed';
  return msg
    .replace(/:\/\/([^:@]+):([^@]+)@/g, '://$1:***@')
    .replace(/password[:=]\s*["']?[^"'\s,]+["']?/gi, 'password=***')
    .replace(/password\s+is\s+["']?[^"'\s,]+["']?/gi, 'password is ***');
}

/**
 * Returns or initializes singleton Prisma Client
 */
function createPrismaClient(): PrismaClient {
  const currentDbUrl = (process.env.DATABASE_URL || '').trim();
  const isValidMysql = currentDbUrl.startsWith('mysql://') || currentDbUrl.startsWith('mysqls://');

  return new PrismaClient({
    datasources: isValidMysql
      ? {
          db: {
            url: currentDbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' && isValidMysql ? ['warn', 'error'] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Real-time, lightweight connection tester using actual Prisma $connect and SELECT 1 query.
 * Extracts the real Prisma Error Code (P1000, P1001, P1002, P1003, P1010, P1011, etc.)
 */
export async function testDatabaseConnection(timeoutMs = 5000): Promise<ConnectionTestResult> {
  const diagnostics = getSafeDatabaseDiagnostics();

  if (!diagnostics.databaseUrlPresent) {
    return {
      connected: false,
      error: 'DATABASE_URL environment variable is not configured',
      errorCode: 'MISSING_DATABASE_URL',
      diagnostics,
    };
  }

  if (diagnostics.protocol !== 'mysql' && diagnostics.protocol !== 'mysqls') {
    return {
      connected: false,
      error: `DATABASE_URL protocol mismatch: expected mysql://, received ${diagnostics.protocol}://`,
      errorCode: 'INVALID_DATABASE_PROTOCOL',
      diagnostics,
    };
  }

  const startTime = Date.now();
  try {
    const connectAndQueryPromise = (async () => {
      await prisma.$connect();
      await prisma.$queryRawUnsafe('SELECT 1 as result');
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const timeoutErr: any = new Error(`Database connection timed out after ${timeoutMs}ms`);
        timeoutErr.code = 'DATABASE_CONNECTION_TIMEOUT';
        reject(timeoutErr);
      }, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    await Promise.race([connectAndQueryPromise, timeoutPromise]);
    const queryLatencyMs = Date.now() - startTime;

    return {
      connected: true,
      queryLatencyMs,
      diagnostics,
    };
  } catch (err: any) {
    const rawCode = err?.code || err?.name || 'PRISMA_QUERY_ERROR';
    const rawMessage = err?.message || 'Database query failed or database unreachable';
    const sanitizedError = sanitizeErrorMessage(rawMessage);

    return {
      connected: false,
      error: sanitizedError,
      errorCode: String(rawCode),
      diagnostics,
      queryLatencyMs: Date.now() - startTime,
    };
  }
}
