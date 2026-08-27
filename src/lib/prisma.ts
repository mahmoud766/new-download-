import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  mariadbPool: any | undefined;
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
  adapter: string;
  socketPath?: string;
}

export interface DirectDriverTestResult {
  status: 'PASS' | 'FAIL';
  select1: 'PASS' | 'FAIL';
  serverVersion: string;
  serverType: string;
  errorCode?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface ConnectionTestResult {
  connected: boolean;
  error?: string;
  errorCode?: string;
  diagnostics: SafeDatabaseDiagnostics;
  queryLatencyMs?: number;
  directDriver?: DirectDriverTestResult;
  prismaAdapter?: {
    status: 'PASS' | 'FAIL';
    adapterName: string;
    select1: 'PASS' | 'FAIL';
  };
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
      if (rawUrl.startsWith('mysql://')) protocol = 'mysql';
      else if (rawUrl.startsWith('mysqls://')) protocol = 'mysqls';
      else if (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://')) protocol = 'postgresql';
      else if (rawUrl.startsWith('sqlite:')) protocol = 'sqlite';
      else {
        const match = rawUrl.match(/^([a-zA-Z0-9_-]+):\/\//);
        protocol = match ? match[1] : 'unknown';
      }

      const parsed = new URL(rawUrl.replace(/^mysqls?:\/\//i, 'http://'));
      host = parsed.hostname || 'NOT_SET';
      port = parsed.port || '3306';
      username = parsed.username ? decodeURIComponent(parsed.username) : 'NOT_SET';

      if (parsed.pathname && parsed.pathname.length > 1) {
        databaseName = decodeURIComponent(parsed.pathname.substring(1));
      }

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
    prismaVersion: '7.9.1',
    adapter: '@prisma/adapter-mariadb (v7.9.1)',
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
 * Parse credentials safely from process.env.DATABASE_URL or fallback environment variables
 */
function parseMariaDbCredentials() {
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  let host = process.env.DATABASE_HOST || '127.0.0.1';
  let port = Number(process.env.DATABASE_PORT || 3306);
  let user = process.env.DATABASE_USER || '';
  let password = process.env.DATABASE_PASSWORD || '';
  let database = process.env.DATABASE_NAME || '';
  let socketPath = process.env.DATABASE_SOCKET || undefined;

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl.replace(/^mysqls?:\/\//i, 'http://'));
      if (parsed.hostname) host = parsed.hostname;
      if (parsed.port) port = Number(parsed.port);
      if (parsed.username) user = decodeURIComponent(parsed.username);
      if (parsed.password) password = decodeURIComponent(parsed.password);
      if (parsed.pathname && parsed.pathname.length > 1) {
        database = decodeURIComponent(parsed.pathname.substring(1));
      }
      if (parsed.searchParams && parsed.searchParams.has('socket')) {
        socketPath = parsed.searchParams.get('socket') || undefined;
      }
    } catch {
      // Ignored
    }
  }

  return { host, port, user, password, database, socketPath };
}

/**
 * Direct MariaDB Node.js Driver Connectivity Test (Independent of Prisma)
 */
export async function testDirectMariaDBConnection(timeoutMs = 5000): Promise<DirectDriverTestResult> {
  const creds = parseMariaDbCredentials();

  if (!creds.user || !creds.host) {
    return {
      status: 'FAIL',
      select1: 'FAIL',
      serverVersion: 'UNKNOWN',
      serverType: 'UNKNOWN',
      errorCode: 'MISSING_CREDENTIALS',
      errorMessage: 'Database user or host missing in DATABASE_URL',
    };
  }

  const startTime = Date.now();
  let conn: any = null;
  try {
    conn = await mariadb.createConnection({
      host: creds.host === 'localhost' ? '127.0.0.1' : creds.host,
      port: creds.port,
      user: creds.user,
      password: creds.password,
      database: creds.database || undefined,
      socketPath: creds.socketPath,
      connectTimeout: timeoutMs,
    });

    const rows: any = await conn.query('SELECT 1 AS result, VERSION() AS serverVersion');
    const latencyMs = Date.now() - startTime;

    let versionStr = 'UNKNOWN';
    let serverType = 'MariaDB';

    if (Array.isArray(rows) && rows[0]) {
      versionStr = String(rows[0].serverVersion || rows[0].VERSION || 'UNKNOWN');
      if (versionStr.toLowerCase().includes('mariadb')) {
        serverType = 'MariaDB';
      } else if (versionStr.toLowerCase().includes('mysql')) {
        serverType = 'MySQL';
      }
    }

    return {
      status: 'PASS',
      select1: 'PASS',
      serverVersion: versionStr,
      serverType,
      latencyMs,
    };
  } catch (err: any) {
    const rawCode = err?.code || err?.name || 'MARIADB_ERROR';
    const rawMsg = sanitizeErrorMessage(err?.message || 'Direct MariaDB connection failed');
    return {
      status: 'FAIL',
      select1: 'FAIL',
      serverVersion: 'UNAVAILABLE',
      serverType: 'UNKNOWN',
      errorCode: String(rawCode),
      errorMessage: rawMsg,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}

/**
 * Returns or initializes singleton Prisma Client with official MariaDB Driver Adapter
 */
function createPrismaClient(): PrismaClient {
  const currentDbUrl = (process.env.DATABASE_URL || '').trim();
  const isValidMysql = currentDbUrl.startsWith('mysql://') || currentDbUrl.startsWith('mysqls://');

  if (isValidMysql) {
    const creds = parseMariaDbCredentials();
    const adapter = new PrismaMariaDb({
      host: creds.host === 'localhost' ? '127.0.0.1' : creds.host,
      port: creds.port,
      user: creds.user,
      password: creds.password,
      database: creds.database || undefined,
      socketPath: creds.socketPath,
      connectionLimit: 10,
      connectTimeout: 5000,
    });

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
    });
  }

  // Graceful fallback for build/static checks
  const fallbackAdapter = new PrismaMariaDb({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'omnifetch_pro',
    connectionLimit: 1,
    connectTimeout: 1000,
  });

  return new PrismaClient({
    adapter: fallbackAdapter,
    log: [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Real-time connection tester that runs both Prisma (with MariaDB Adapter) and Direct MariaDB driver
 */
export async function testDatabaseConnection(timeoutMs = 5000): Promise<ConnectionTestResult> {
  const diagnostics = getSafeDatabaseDiagnostics();

  if (!diagnostics.databaseUrlPresent) {
    return {
      connected: false,
      error: 'DATABASE_URL environment variable is not configured',
      errorCode: 'MISSING_DATABASE_URL',
      diagnostics,
      directDriver: {
        status: 'FAIL',
        select1: 'FAIL',
        serverVersion: 'NOT_SET',
        serverType: 'NOT_SET',
        errorCode: 'MISSING_DATABASE_URL',
        errorMessage: 'DATABASE_URL environment variable is not configured',
      },
      prismaAdapter: {
        status: 'FAIL',
        adapterName: '@prisma/adapter-mariadb',
        select1: 'FAIL',
      },
    };
  }

  // Run Direct MariaDB driver test
  const directDriver = await testDirectMariaDBConnection(timeoutMs);

  // Run Prisma SELECT 1 query via MariaDB Driver Adapter
  const startTime = Date.now();
  try {
    const connectAndQueryPromise = (async () => {
      await prisma.$connect();
      await prisma.$queryRawUnsafe('SELECT 1 as result');
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const timeoutErr: any = new Error(`Prisma adapter query timed out after ${timeoutMs}ms`);
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
      directDriver,
      prismaAdapter: {
        status: 'PASS',
        adapterName: '@prisma/adapter-mariadb',
        select1: 'PASS',
      },
    };
  } catch (err: any) {
    const rawCode = err?.code || err?.name || 'PRISMA_ADAPTER_ERROR';
    const rawMessage = err?.message || 'Prisma adapter query failed or database unreachable';
    const sanitizedError = sanitizeErrorMessage(rawMessage);

    return {
      connected: false,
      error: sanitizedError,
      errorCode: String(rawCode),
      diagnostics,
      directDriver,
      prismaAdapter: {
        status: 'FAIL',
        adapterName: '@prisma/adapter-mariadb',
        select1: 'FAIL',
      },
      queryLatencyMs: Date.now() - startTime,
    };
  }
}
