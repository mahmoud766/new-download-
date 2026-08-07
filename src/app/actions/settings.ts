'use server';

import { prisma } from '../../lib/prisma';
import { SiteSettings } from '../../types';

// Mock revalidatePath for Vite/Express runtime compatibility if next/cache is not present
let revalidatePath: (path: string) => void;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nextCache = require('next/cache');
  revalidatePath = nextCache.revalidatePath;
} catch {
  revalidatePath = (path: string) => {
    console.log(`[Cache Revalidation] Revalidated path: ${path}`);
  };
}

export interface SaveSettingsInput {
  siteName?: string;
  shortName?: string;
  tagline?: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  adsenseClientId?: string;
  googleAnalyticsId?: string;
  ga4Id?: string;
  gtmId?: string;
  fbPixelId?: string;
  clarityId?: string;
  trustpilotUrl?: string;
  maintenanceMode?: boolean;
  allowMp3Conversion?: boolean;
  watermarkFreeByDefault?: boolean;
  headerStyle?: string;
  customCss?: string;
  customJs?: string;
  socialLinks?: Record<string, string>;
}

export async function getGlobalSettingsAction(): Promise<SiteSettings> {
  try {
    const record = await prisma.globalSettings.findUnique({
      where: { id: 'default' },
    });

    if (!record) {
      return {
        siteName: 'OmniFetch Pro',
        shortName: 'PRO',
        tagline: 'أفضل وأسرع أداة مجانية لتحميل الفيديوهات بدون علامة مائية',
        siteDescription: 'أفضل وأسرع أداة مجانية لتحميل فيديوهات تيك توك، يوتيوب شورتس، فيسبوك ريلز وإنستغرام بدقة HD وبدون علامات مائية',
        logoUrl: '',
        faviconUrl: '',
        contactEmail: 'support@omnifetchpro.com',
        contactPhone: '',
        adsenseClientId: 'ca-pub-1234567890000000',
        ga4Id: 'G-OMNIFETCH2026',
        gtmId: 'GTM-OMNIFETCH',
        clarityId: '',
        fbPixelId: '',
        maintenanceMode: false,
        rateLimitPerMinute: 60,
        allowMp3Conversion: true,
        watermarkFreeByDefault: true,
        headerStyle: 'sticky',
        customCss: '',
        customJs: '',
        socialLinks: {},
      };
    }

    let parsedSocials = {};
    try {
      if (record.socialLinksJson) {
        parsedSocials = JSON.parse(record.socialLinksJson);
      }
    } catch {
      parsedSocials = {};
    }

    return {
      siteName: record.siteName || 'OmniFetch Pro',
      shortName: record.shortName || 'PRO',
      tagline: record.tagline || '',
      siteDescription: record.siteDescription || '',
      logoUrl: record.logoUrl || '',
      faviconUrl: record.faviconUrl || '',
      contactEmail: record.contactEmail || 'support@omnifetchpro.com',
      contactPhone: record.contactPhone || '',
      adsenseClientId: record.adsenseClientId || 'ca-pub-1234567890000000',
      ga4Id: record.ga4Id || 'G-OMNIFETCH2026',
      gtmId: record.gtmId || 'GTM-OMNIFETCH',
      clarityId: record.clarityId || '',
      fbPixelId: record.fbPixelId || '',
      maintenanceMode: Boolean(record.maintenanceMode),
      rateLimitPerMinute: 60,
      allowMp3Conversion: Boolean(record.allowMp3Conversion),
      watermarkFreeByDefault: Boolean(record.watermarkFreeByDefault),
      headerStyle: (record.headerStyle as any) || 'sticky',
      customCss: record.customCss || '',
      customJs: record.customJs || '',
      socialLinks: parsedSocials,
    };
  } catch (error) {
    console.error('Error in getGlobalSettingsAction:', error);
    throw new Error('Failed to fetch settings from Prisma database');
  }
}

export async function updateGlobalSettingsAction(input: SaveSettingsInput): Promise<{
  success: boolean;
  settings: SiteSettings;
  message?: string;
}> {
  try {
    const socialLinksJson = input.socialLinks ? JSON.stringify(input.socialLinks) : '{}';

    const updated = await prisma.globalSettings.upsert({
      where: { id: 'default' },
      update: {
        siteName: input.siteName ?? 'OmniFetch Pro',
        shortName: input.shortName ?? 'PRO',
        tagline: input.tagline ?? '',
        siteDescription: input.siteDescription ?? '',
        logoUrl: input.logoUrl ?? '',
        faviconUrl: input.faviconUrl ?? '',
        contactEmail: input.contactEmail ?? 'support@omnifetchpro.com',
        contactPhone: input.contactPhone ?? '',
        adsenseClientId: input.adsenseClientId ?? 'ca-pub-1234567890000000',
        ga4Id: input.ga4Id ?? 'G-OMNIFETCH2026',
        gtmId: input.gtmId ?? 'GTM-OMNIFETCH',
        clarityId: input.clarityId ?? '',
        fbPixelId: input.fbPixelId ?? '',
        maintenanceMode: input.maintenanceMode ?? false,
        allowMp3Conversion: input.allowMp3Conversion ?? true,
        watermarkFreeByDefault: input.watermarkFreeByDefault ?? true,
        headerStyle: input.headerStyle ?? 'sticky',
        customCss: input.customCss ?? '',
        customJs: input.customJs ?? '',
        socialLinksJson,
      },
      create: {
        id: 'default',
        siteName: input.siteName ?? 'OmniFetch Pro',
        shortName: input.shortName ?? 'PRO',
        tagline: input.tagline ?? '',
        siteDescription: input.siteDescription ?? '',
        logoUrl: input.logoUrl ?? '',
        faviconUrl: input.faviconUrl ?? '',
        contactEmail: input.contactEmail ?? 'support@omnifetchpro.com',
        contactPhone: input.contactPhone ?? '',
        adsenseClientId: input.adsenseClientId ?? 'ca-pub-1234567890000000',
        ga4Id: input.ga4Id ?? 'G-OMNIFETCH2026',
        gtmId: input.gtmId ?? 'GTM-OMNIFETCH',
        clarityId: input.clarityId ?? '',
        fbPixelId: input.fbPixelId ?? '',
        maintenanceMode: input.maintenanceMode ?? false,
        allowMp3Conversion: input.allowMp3Conversion ?? true,
        watermarkFreeByDefault: input.watermarkFreeByDefault ?? true,
        headerStyle: input.headerStyle ?? 'sticky',
        customCss: input.customCss ?? '',
        customJs: input.customJs ?? '',
        socialLinksJson,
      },
    });

    // Directive 4: CACHE REVALIDATION
    revalidatePath('/');

    let parsedSocials = {};
    try {
      if (updated.socialLinksJson) {
        parsedSocials = JSON.parse(updated.socialLinksJson);
      }
    } catch {
      parsedSocials = {};
    }

    const formattedSettings: SiteSettings = {
      siteName: updated.siteName || 'OmniFetch Pro',
      shortName: updated.shortName || 'PRO',
      tagline: updated.tagline || '',
      siteDescription: updated.siteDescription || '',
      logoUrl: updated.logoUrl || '',
      faviconUrl: updated.faviconUrl || '',
      contactEmail: updated.contactEmail || 'support@omnifetchpro.com',
      contactPhone: updated.contactPhone || '',
      adsenseClientId: updated.adsenseClientId || 'ca-pub-1234567890000000',
      ga4Id: updated.ga4Id || 'G-OMNIFETCH2026',
      gtmId: updated.gtmId || 'GTM-OMNIFETCH',
      clarityId: updated.clarityId || '',
      fbPixelId: updated.fbPixelId || '',
      maintenanceMode: Boolean(updated.maintenanceMode),
      rateLimitPerMinute: 60,
      allowMp3Conversion: Boolean(updated.allowMp3Conversion),
      watermarkFreeByDefault: Boolean(updated.watermarkFreeByDefault),
      headerStyle: (updated.headerStyle as any) || 'sticky',
      customCss: updated.customCss || '',
      customJs: updated.customJs || '',
      socialLinks: parsedSocials,
    };

    return {
      success: true,
      settings: formattedSettings,
      message: 'Settings successfully updated in Prisma PostgreSQL database!',
    };
  } catch (error) {
    console.error('Error upserting settings in Prisma database:', error);
    return {
      success: false,
      settings: {} as SiteSettings,
      message: 'Failed to update settings in database',
    };
  }
}
