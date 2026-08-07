import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndVerify() {
  const defaultSettings = {
    siteName: 'OmniFetch Pro',
    primaryColor: '#9333ea',
    secondaryColor: '#3b82f6',
    seoConfigJson: '{}',
    adsConfigJson: '[]',
    platformsConfigJson: '{}',
    pagesConfigJson: '[]',
    smtpConfigJson: '{}',
  };

  await prisma.globalSettings.upsert({
    where: { id: 'default' },
    update: defaultSettings,
    create: { id: 'default', ...defaultSettings },
  });

  const record = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  console.log('Restored DB Record:', JSON.stringify(record, null, 2));
  await prisma.$disconnect();
}

cleanupAndVerify().catch((e) => {
  console.error(e);
  process.exit(1);
});
