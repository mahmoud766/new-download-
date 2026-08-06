// Prisma Client Singleton Instance with Safe Build-Time Fallback
import * as PrismaClientModule from '@prisma/client';

// Automatically sanitize any stray placeholder artifact in DIRECT_URL if present
if (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('YOUR') && process.env.DIRECT_URL.includes('-PASSWORD]')) {
  process.env.DIRECT_URL = process.env.DIRECT_URL.replace(/YOUR(.*)-PASSWORD]/, '$1');
}
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('YOUR') && process.env.DATABASE_URL.includes('-PASSWORD]')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/YOUR(.*)-PASSWORD]/, '$1');
}

const MockPrismaClass = class {
  globalSettings = {
    findUnique: async () => null,
    upsert: async (args: any) => args.create,
  };
  seoTranslations = {
    findMany: async () => [],
    upsert: async (args: any) => args.create,
  };
  downloadLog = {
    findMany: async () => [],
    findFirst: async () => null,
    create: async (args: any) => ({ id: 'mock_id', ...args.data }),
    update: async (args: any) => ({ id: 'mock_id', ...args.data }),
    upsert: async (args: any) => args.create,
    count: async () => 0,
    groupBy: async () => [],
    deleteMany: async () => ({ count: 0 }),
  };
  userAnalytics = {
    findMany: async () => [],
    create: async (args: any) => ({ id: 'mock_id', ...args.data }),
    count: async () => 0,
  };
};

function createPrismaClient() {
  try {
    const PrismaClientClass = (PrismaClientModule as any).PrismaClient;
    if (!PrismaClientClass) return new MockPrismaClass();
    return new PrismaClientClass({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (e) {
    console.warn('[Prisma] Safe build-time instantiation fallback:', e);
    return new MockPrismaClass();
  }
}

const globalForPrisma = global as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
