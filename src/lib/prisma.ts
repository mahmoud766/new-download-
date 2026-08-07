import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawDbUrl = process.env.DATABASE_URL || '';
const validDbUrl = (rawDbUrl && !rawDbUrl.includes('YOUR') && rawDbUrl.startsWith('postgres'))
  ? rawDbUrl
  : 'postgresql://postgres.rkapaztsilpcathetkbn:Mahmoud246810@aws-0-eu-west-2.pooler.supabase.com:5432/postgres';

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: validDbUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

