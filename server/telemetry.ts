import { prisma } from '../src/lib/prisma';

export interface TelemetryEvent {
  requestId?: string;
  provider: string;   // e.g. 'TikWM API', 'ytdl-core', 'yt-dlp Native', 'Cobalt API', 'Loader.to CDN', 'OpenGraph Scraper', 'FB Plugin Scraper', 'VKR API', 'Reddit JSON API'
  platform: string;   // e.g. 'TikTok', 'YouTube', 'Facebook', 'Instagram', 'Reddit', 'Snapchat', 'General'
  latencyMs: number;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  targetUrl?: string;
}

// In-memory buffer for real-time dashboard responsiveness (last 100 events)
const MAX_IN_MEMORY_EVENTS = 100;
const inMemoryEvents: (TelemetryEvent & { id: string; createdAt: string })[] = [];

export function recordTelemetry(event: TelemetryEvent): void {
  const nowIso = new Date().toISOString();
  const record = {
    id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...event,
    createdAt: nowIso,
  };

  inMemoryEvents.unshift(record);
  if (inMemoryEvents.length > MAX_IN_MEMORY_EVENTS) {
    inMemoryEvents.pop();
  }

  // Non-blocking asynchronous write to Supabase PostgreSQL ApiTelemetry table
  prisma.apiTelemetry.create({
    data: {
      requestId: event.requestId || null,
      provider: event.provider,
      platform: event.platform,
      latencyMs: Math.max(1, Math.round(event.latencyMs)),
      success: event.success,
      statusCode: event.statusCode || (event.success ? 200 : 500),
      errorMessage: event.errorMessage ? event.errorMessage.substring(0, 255) : null,
      targetUrl: event.targetUrl ? event.targetUrl.substring(0, 150) : null,
    },
  }).catch((err) => {
    console.warn('[Telemetry DB Write Notice]:', err?.message || err);
  });
}

export function getInMemoryEvents() {
  return inMemoryEvents;
}
