import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SETTINGS = {
  id: 'default',
  adsenseClientId: 'ca-pub-1234567890000000',
  googleAnalyticsId: 'G-XXXXXXXXXX',
  trustpilotUrl: 'https://www.trustpilot.com/review/omnifetchpro.com',
};

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.warn('[Settings API] Database query fallback:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adsenseClientId, googleAnalyticsId, trustpilotUrl } = body;

    const { prisma } = await import('@/lib/prisma');
    const updatedSettings = await prisma.globalSettings.upsert({
      where: { id: 'default' },
      update: {
        adsenseClientId: adsenseClientId || DEFAULT_SETTINGS.adsenseClientId,
        googleAnalyticsId: googleAnalyticsId || DEFAULT_SETTINGS.googleAnalyticsId,
        trustpilotUrl: trustpilotUrl || DEFAULT_SETTINGS.trustpilotUrl,
      },
      create: {
        id: 'default',
        adsenseClientId: adsenseClientId || DEFAULT_SETTINGS.adsenseClientId,
        googleAnalyticsId: googleAnalyticsId || DEFAULT_SETTINGS.googleAnalyticsId,
        trustpilotUrl: trustpilotUrl || DEFAULT_SETTINGS.trustpilotUrl,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Global settings saved successfully to Prisma database.',
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
