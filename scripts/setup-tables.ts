import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Ensuring ApiTelemetry, DownloadLog, and ProviderSetting tables & columns exist in Supabase PostgreSQL...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ApiTelemetry" (
      "id" TEXT NOT NULL,
      "requestId" TEXT,
      "provider" TEXT NOT NULL,
      "platform" TEXT NOT NULL,
      "latencyMs" INTEGER NOT NULL,
      "success" BOOLEAN NOT NULL DEFAULT true,
      "statusCode" INTEGER NOT NULL DEFAULT 200,
      "errorMessage" TEXT,
      "targetUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ApiTelemetry_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ApiTelemetry" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "DownloadLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProviderSetting" (
      "id" TEXT NOT NULL,
      "providerKey" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'Extractor Engine',
      "platform" TEXT NOT NULL DEFAULT 'Multi-Platform',
      "endpoint" TEXT DEFAULT '',
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "priority" INTEGER NOT NULL DEFAULT 1,
      "autoFailover" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProviderSetting_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ProviderSetting" ADD COLUMN IF NOT EXISTS "providerKey" TEXT;
    ALTER TABLE "ProviderSetting" ADD COLUMN IF NOT EXISTS "platform" TEXT DEFAULT 'Multi-Platform';
    ALTER TABLE "ProviderSetting" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN DEFAULT true;
    ALTER TABLE "ProviderSetting" ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 1;
  `);

  console.log('Successfully created or updated ApiTelemetry, DownloadLog, and ProviderSetting tables in Supabase!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Setup tables failed:', err?.message || err);
  process.exit(1);
});

