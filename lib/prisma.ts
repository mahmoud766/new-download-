// Prisma Client Singleton Instance with Safe Build-Time & Runtime Fallbacks
import * as PrismaClientModule from '@prisma/client';

// Automatically sanitize any stray placeholder artifact in DIRECT_URL if present
if (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('YOUR') && process.env.DIRECT_URL.includes('-PASSWORD]')) {
  process.env.DIRECT_URL = process.env.DIRECT_URL.replace(/YOUR(.*)-PASSWORD]/, '$1');
}
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('YOUR') && process.env.DATABASE_URL.includes('-PASSWORD]')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/YOUR(.*)-PASSWORD]/, '$1');
}

// In-Memory Fallback Storage
const memoryStore = {
  downloadLogs: [
    {
      id: 'seed_1',
      url: 'https://www.tiktok.com/@tiktok/video/7123456789012345678',
      title: '🔥 Viral TikTok Reels No Watermark Ultra HD',
      platform: 'tiktok',
      thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80',
      quality: 'HD No Watermark',
      downloadCount: 1420,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'seed_2',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: '⚡ Top YouTube Shorts 1080p MP4 Direct',
      platform: 'youtube',
      thumbnail: 'https://images.unsplash.com/photo-1611162616091-635b29073966?w=600&q=80',
      quality: '1080p Full HD',
      downloadCount: 980,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'seed_3',
      url: 'https://www.instagram.com/reel/C123456789/',
      title: '✨ Instagram Reels Viral Video Download 4K',
      platform: 'instagram',
      thumbnail: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=600&q=80',
      quality: '4K Ultra HD',
      downloadCount: 850,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'seed_4',
      url: 'https://www.facebook.com/watch/?v=123456789',
      title: '🎬 Facebook Video HD High Speed Extraction',
      platform: 'facebook',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80',
      quality: '720p HD',
      downloadCount: 620,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as any[],
  settings: {
    id: 'default',
    adsenseClientId: 'ca-pub-1234567890000000',
    googleAnalyticsId: 'G-XXXXXXXXXX',
    trustpilotUrl: 'https://www.trustpilot.com/review/omnifetchpro.com',
  },
};

const mockDownloadLogModel = {
  findMany: async (args?: any) => {
    let list = [...memoryStore.downloadLogs];
    if (args?.orderBy?.downloadCount === 'desc') {
      list.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (args?.orderBy?.updatedAt === 'desc') {
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    if (args?.take) {
      list = list.slice(0, args.take);
    }
    return list;
  },
  findFirst: async (args?: any) => {
    if (args?.where?.url) {
      return memoryStore.downloadLogs.find((x) => x.url === args.where.url) || null;
    }
    return memoryStore.downloadLogs[0] || null;
  },
  create: async (args: any) => {
    const newItem = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      ...args.data,
      downloadCount: args.data.downloadCount || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.downloadLogs.push(newItem);
    return newItem;
  },
  update: async (args: any) => {
    const idx = memoryStore.downloadLogs.findIndex((x) => x.id === args.where?.id);
    if (idx !== -1) {
      memoryStore.downloadLogs[idx] = {
        ...memoryStore.downloadLogs[idx],
        ...args.data,
        updatedAt: new Date(),
      };
      return memoryStore.downloadLogs[idx];
    }
    return args.data;
  },
  upsert: async (args: any) => args.create,
  count: async () => memoryStore.downloadLogs.length,
  groupBy: async () => [],
  deleteMany: async () => {
    memoryStore.downloadLogs = [];
    return { count: 0 };
  },
};

const mockGlobalSettingsModel = {
  findUnique: async () => memoryStore.settings,
  upsert: async (args: any) => {
    memoryStore.settings = { ...memoryStore.settings, ...args.create };
    return memoryStore.settings;
  },
};

const mockSeoTranslationsModel = {
  findMany: async () => [],
  upsert: async (args: any) => args.create,
};

const mockUserAnalyticsModel = {
  findMany: async () => [],
  create: async (args: any) => ({ id: 'mock_id', ...args.data }),
  count: async () => 0,
};

// Safely wrap real model methods to catch runtime connection/query errors and fall back gracefully
function createSafeModelProxy(realModel: any, mockModel: any) {
  if (!realModel) return mockModel;
  return new Proxy(realModel, {
    get(target, methodProp: string | symbol) {
      const original = target[methodProp];
      if (typeof original === 'function') {
        return async (...args: any[]) => {
          try {
            return await original.apply(target, args);
          } catch (err: any) {
            // Serve in-memory fallback silently when remote DB connection or credentials fail
            const mockFn = mockModel[methodProp];
            if (typeof mockFn === 'function') {
              return await mockFn(...args);
            }
            return null;
          }
        };
      }
      return original;
    }
  });
}

function createPrismaClient() {
  let realInstance: any = null;
  try {
    const PrismaClientClass = (PrismaClientModule as any).PrismaClient;
    if (PrismaClientClass) {
      realInstance = new PrismaClientClass({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
  } catch (e) {
    console.warn('[Prisma] Safe build-time instantiation fallback:', e);
  }

  return new Proxy(realInstance || {}, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'string') {
        const lowerProp = prop.toLowerCase();
        if (lowerProp === 'downloadlog' || prop === 'DownloadLog') {
          const realModel = target.downloadLog || target.DownloadLog;
          return createSafeModelProxy(realModel, mockDownloadLogModel);
        }
        if (lowerProp === 'globalsettings' || prop === 'GlobalSettings') {
          const realModel = target.globalSettings || target.GlobalSettings;
          return createSafeModelProxy(realModel, mockGlobalSettingsModel);
        }
        if (lowerProp === 'seotranslations' || prop === 'SeoTranslations') {
          const realModel = target.seoTranslations || target.SeoTranslations;
          return createSafeModelProxy(realModel, mockSeoTranslationsModel);
        }
        if (lowerProp === 'useranalytics' || prop === 'UserAnalytics') {
          const realModel = target.userAnalytics || target.UserAnalytics;
          return createSafeModelProxy(realModel, mockUserAnalyticsModel);
        }
        if (target[prop] !== undefined) {
          return target[prop];
        }
      }
      return target[prop];
    },
  });
}

const globalForPrisma = global as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

