import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import youtubedl from 'youtube-dl-exec';
import ytdl from '@distube/ytdl-core';

export function ensureYtDlpBinary() {
  try {
    const binPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');
    if (!fs.existsSync(binPath)) {
      console.log('[OmniFetch] yt-dlp binary missing, running postinstall...');
      const scriptPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'scripts', 'postinstall.js');
      if (fs.existsSync(scriptPath)) {
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
      }
    }
  } catch (err) {
    console.error('Failed to ensure yt-dlp binary:', err);
  }
}

// Ensure binary exists at module initialization
ensureYtDlpBinary();

export interface ExtractedMediaResult {
  status: 'SUCCESS' | 'FAILED';
  title?: string;
  thumbnail?: string;
  video_url?: string;
  reason?: string;
  forceProxy?: boolean;
  formats?: Array<{
    id: string;
    quality: string;
    format: string;
    resolution?: string;
    sizeBytes?: number;
    sizeFormatted?: string;
    url: string;
    directVideoUrl?: string;
    hasAudio?: boolean;
    watermarkFree?: boolean;
    forceProxy?: boolean;
  }>;
}

// Helper to resolve Facebook share/redirect links (like /share/r/, /share/v/, /share/p/, fb.watch) to canonical URL
async function resolveFacebookUrl(inputUrl: string): Promise<string> {
  let fbUrl = inputUrl;
  if (fbUrl.includes('?mibextid=')) fbUrl = fbUrl.split('?mibextid=')[0];
  if (fbUrl.includes('?share_id=')) fbUrl = fbUrl.split('?share_id=')[0];
  if (fbUrl.includes('&mibextid=')) fbUrl = fbUrl.split('&mibextid=')[0];
  if (fbUrl.includes('?rdid=')) fbUrl = fbUrl.split('?rdid=')[0];

  if (fbUrl.includes('/share/') || fbUrl.includes('fb.watch') || fbUrl.includes('fb.gg') || fbUrl.includes('m.facebook.com')) {
    try {
      const userAgents = [
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      ];

      for (const ua of userAgents) {
        const res = await fetch(fbUrl, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
        });

        if (res.ok) {
          const resolvedRedirectUrl = res.url;
          const html = await res.text();
          const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);

          if (ogUrlMatch && ogUrlMatch[1] && ogUrlMatch[1].startsWith('http') && !ogUrlMatch[1].includes('/login')) {
            const canonicalUrl = ogUrlMatch[1].replace(/&amp;/g, '&');
            return canonicalUrl;
          }

          if (resolvedRedirectUrl && resolvedRedirectUrl.startsWith('http') && !resolvedRedirectUrl.includes('/login') && !resolvedRedirectUrl.includes('/share/')) {
            return resolvedRedirectUrl;
          }
        }
      }
    } catch {}
  }
  return fbUrl;
}

export async function extractMedia(rawUrl: string): Promise<ExtractedMediaResult> {
  try {
    // Clean leading slashes, whitespace, and tracking parameters before ANY platform logic
    let cleanUrl = rawUrl.trim().replace(/^\/+/, '');
    cleanUrl = cleanUrl.split('?mibextid=')[0].split('?share_id=')[0];
    const lowerUrl = cleanUrl.toLowerCase();

    // ==========================================
    // 1. INSTAGRAM (KEEP WORKING MIRROR EXTRACTION LOGIC)
    // ==========================================
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
      try {
        const igMatch = cleanUrl.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|stories)\/([a-zA-Z0-9_-]+)/i);
        const shortcode = igMatch ? igMatch[1] : null;

        let igTitle = 'Instagram Reel';
        let igThumb = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80';

        // Instagram oEmbed metadata
        if (shortcode) {
          try {
            const oembedRes = await fetch(`https://www.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`);
            if (oembedRes.ok) {
              const json: any = await oembedRes.json();
              if (json.title) igTitle = json.title;
              if (json.thumbnail_url) igThumb = json.thumbnail_url;
              if (json.author_name) igTitle = `${json.author_name} - ${igTitle}`;
            }
          } catch {}
        }

        // Extract direct raw MP4 video URL via direct HTML & proxy mirrors using multi-User-Agent strategy
        if (shortcode) {
          const mirrorEndpoints = [
            `https://www.instagram.com/reel/${shortcode}/`,
            `https://www.instagram.com/p/${shortcode}/`,
            `https://ddinstagram.com/reel/${shortcode}/`,
            `https://ddinstagram.com/p/${shortcode}/`,
            `https://vxinstagram.com/reel/${shortcode}/`,
            `https://vxinstagram.com/p/${shortcode}/`,
            `https://kkinstagram.com/reel/${shortcode}/`,
            `https://instafix.app/p/${shortcode}/`,
            `https://instafix.app/reel/${shortcode}/`,
          ];

          const userAgents = [
            'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Twitterbot/1.0',
            'TelegramBot (like TwitterBot)',
          ];

          for (const mirrorUrl of mirrorEndpoints) {
            for (const ua of userAgents) {
              try {
                const mirrorRes = await fetch(mirrorUrl, {
                  headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                  },
                });

                if (mirrorRes.ok) {
                  const html = await mirrorRes.text();
                  const ogVideoMatch = html.match(/<meta\s+property=["']og:video(?::secure_url|:url|)?["']\s+content=["']([^"']+)["']/i)
                    || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:video(?::secure_url|:url|)?["']/i)
                    || html.match(/<meta\s+name=["']twitter:player:stream["']\s+content=["']([^"']+)["']/i)
                    || html.match(/<video[^>]*src=["']([^"']+)["']/i);

                  let ogVideo = ogVideoMatch ? ogVideoMatch[1] : null;

                  if (ogVideo) {
                    ogVideo = ogVideo.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\\/g, '');
                  }

                  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
                    || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
                  const ogImage = ogImageMatch ? ogImageMatch[1] : null;

                  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
                  const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

                  if (ogVideo && (ogVideo.startsWith('http://') || ogVideo.startsWith('https://')) && !ogVideo.includes('instagram.com/reel/') && !ogVideo.includes('instagram.com/p/')) {
                    return {
                      status: 'SUCCESS',
                      title: ogTitle ? ogTitle.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : igTitle,
                      thumbnail: ogImage || igThumb,
                      video_url: ogVideo,
                    };
                  }
                }
              } catch (err) {}
            }
          }

          return {
            status: 'FAILED',
            reason: 'Could not extract direct MP4 link from Instagram post.',
          };
        }
      } catch (igErr: any) {
        console.error('Instagram Extraction Error:', igErr);
        return { status: 'FAILED', reason: 'Failed to extract Instagram MP4.' };
      }
    }

    // ==========================================
    // 2. TIKTOK (KEEP WORKING LOGIC)
    // ==========================================
    else if (lowerUrl.includes('tiktok.com')) {
      try {
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
        if (tikRes.ok) {
          const json: any = await tikRes.json();
          if (json.code === 0 && json.data) {
            const videoUrl = json.data.hdplay || json.data.play;
            if (videoUrl) {
              return {
                status: 'SUCCESS',
                title: json.data.title || 'TikTok Video',
                thumbnail: json.data.cover || json.data.origin_cover,
                video_url: videoUrl,
              };
            }
          }
        }
      } catch (tkErr) {
        console.warn('TikWM fallback notice:', tkErr);
      }

      // Fallback to youtube-dl-exec for TikTok
      try {
        ensureYtDlpBinary();
        const output: any = await youtubedl(cleanUrl, {
          dumpSingleJson: true,
          noWarnings: true,
          format: 'best',
        });
        if (output && (output.url || output.formats?.[0]?.url)) {
          return {
            status: 'SUCCESS',
            title: output.title || 'TikTok Video',
            thumbnail: output.thumbnail || output.thumbnails?.[0]?.url,
            video_url: output.url || output.formats?.[0]?.url,
          };
        }
      } catch {}
    }

    // ==========================================
    // 2. YOUTUBE EXTRACTION (COBALT TIER 1 + YT-DLP TIER 2)
    // ==========================================
    else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytUrl = cleanUrl;
      if (rawUrl.includes('youtube.com/shorts/')) {
        ytUrl = `https://www.youtube.com/watch?v=${rawUrl.split('/shorts/')[1].split('?')[0]}`;
      } else if (cleanUrl.includes('youtu.be/')) {
        ytUrl = `https://www.youtube.com/watch?v=${cleanUrl.split('youtu.be/')[1]}`;
      }

      const videoIdMatch = ytUrl.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      let fallbackTitle = 'YouTube Video';
      let fallbackThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`);
        if (oembedRes.ok) {
          const oembedData: any = await oembedRes.json();
          if (oembedData.title) fallbackTitle = oembedData.title;
          if (oembedData.thumbnail_url) fallbackThumb = oembedData.thumbnail_url;
        }
      } catch (e) {}

      // Tier 1a: @distube/ytdl-core (Fast Node-native InnerTube extractor)
      let lastYtError = '';
      try {
        const info = await ytdl.getInfo(ytUrl);
        const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
        const directUrl = videoFormats[0]?.url || info.formats.find((f: any) => f.url)?.url;
        if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
          return {
            status: 'SUCCESS',
            title: info.videoDetails.title || fallbackTitle,
            thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url || fallbackThumb,
            video_url: directUrl,
            forceProxy: true,
          };
        }
      } catch (ytdlErr: any) {
        lastYtError = ytdlErr?.message || String(ytdlErr);
      }

      // Tier 1b: Local yt-dlp with mweb,android client
      try {
        ensureYtDlpBinary();
        const output: any = await youtubedl(ytUrl, {
          dumpSingleJson: true,
          noWarnings: true,
          noCheckCertificates: true,
          jsRuntimes: 'node',
          extractorArgs: 'youtube:player_client=mweb,android',
          format: 'best',
        } as any);

        const directUrl = output.url || output.formats?.find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)?.url || output.formats?.[0]?.url;
        if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
          return {
            status: 'SUCCESS',
            title: output.title || fallbackTitle,
            thumbnail: output.thumbnail || output.thumbnails?.[0]?.url || fallbackThumb,
            video_url: directUrl,
            forceProxy: true,
          };
        }
      } catch (ytError: any) {
        lastYtError = ytError?.message || String(ytError);
      }

      // Tier 1c: yt-dlp with player_client fallback (tv, ios, mweb)
      try {
        ensureYtDlpBinary();
        const output: any = await youtubedl(ytUrl, {
          dumpSingleJson: true,
          noWarnings: true,
          noCheckCertificates: true,
          jsRuntimes: 'node',
          extractorArgs: 'youtube:player_client=tv,ios,mweb',
          format: 'best',
        } as any);

        const directUrl = output.url || output.formats?.find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && f.url)?.url || output.formats?.[0]?.url;
        if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
          return {
            status: 'SUCCESS',
            title: output.title || fallbackTitle,
            thumbnail: output.thumbnail || output.thumbnails?.[0]?.url || fallbackThumb,
            video_url: directUrl,
            forceProxy: true,
          };
        }
      } catch (ytError2: any) {
        lastYtError = ytError2?.message || lastYtError;
      }

      // Tier 2a: Loader.to / Savenow Conversion Engine (Bulletproof YouTube MP4 CDN Generator)
      try {
        const ltoInit = await fetch(`https://loader.to/ajax/download.php?format=720&url=${encodeURIComponent(ytUrl)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        });
        if (ltoInit.ok) {
          const ltoJson: any = await ltoInit.json();
          let directLto = ltoJson?.download_url || ltoJson?.url;
          if (!directLto && ltoJson?.progress_url) {
            for (let attempt = 0; attempt < 20; attempt++) {
              await new Promise((r) => setTimeout(r, 1000));
              const pRes = await fetch(ltoJson.progress_url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                },
              });
              if (pRes.ok) {
                const pData: any = await pRes.json();
                const foundUrl = pData?.download_url || pData?.url;
                if (foundUrl && typeof foundUrl === 'string' && foundUrl.startsWith('http')) {
                  directLto = foundUrl;
                  break;
                }
              }
            }
          }

          if (directLto && typeof directLto === 'string' && directLto.startsWith('http')) {
            return {
              status: 'SUCCESS',
              title: ltoJson?.info?.title || ltoJson?.title || fallbackTitle,
              thumbnail: ltoJson?.info?.image || ltoJson?.thumbnail_url || fallbackThumb,
              video_url: directLto,
              forceProxy: true,
            };
          }
        }
      } catch (ltoErr) {
        console.warn('Loader.to extractor tier notice:', ltoErr);
      }

      // Tier 2b: Cobalt API (Bypasses IP-Binding if available)
      const cobaltEndpoints = [
        'https://api.cobalt.tools/api/json',
        'https://co.wuk.sh/api/json',
        'https://cobalt.m3u8.cx/api/json',
        'https://cobalt-api.kwippy.com/api/json',
      ];

      for (const cobaltUrl of cobaltEndpoints) {
        try {
          const cobaltRes = await fetch(cobaltUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: ytUrl,
              videoQuality: '1080',
              filenamePattern: 'classic',
            }),
          });

          if (cobaltRes.ok) {
            const cobaltData: any = await cobaltRes.json();
            const finalUrl = cobaltData.url || cobaltData.stream || (cobaltData.picker && cobaltData.picker[0]?.url);
            if (finalUrl && typeof finalUrl === 'string' && finalUrl.startsWith('http')) {
              return {
                status: 'SUCCESS',
                title: fallbackTitle,
                thumbnail: fallbackThumb,
                video_url: finalUrl,
                forceProxy: true,
              };
            }
          }
        } catch (e) {}
      }

      let failureReason = 'تعذر استخراج فيديو يوتيوب. يرجى التأكد من أن الفيديو عام وتجربة رابط آخر.';
      if (lastYtError && (lastYtError.includes('Sign in') || lastYtError.includes('bot'))) {
        failureReason = 'يتطلب هذا الفيديو تسجيل الدخول أو إثبات الهوية في يوتيوب (Sign in to confirm you\'re not a bot). يرجى التأكد من أن الفيديو عام وتجربة رابط آخر.';
      }

      return {
        status: 'FAILED',
        reason: failureReason,
      };
    }

    // ==========================================
    // 3. FACEBOOK EXTRACTION (MULTI-TIER HYBRID BULLETPROOF)
    // ==========================================
    else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.gg')) {
      try {
        let fbUrl = cleanUrl;

        // Resolve share/redirect links to canonical URL
        if (fbUrl.includes('/share/') || fbUrl.includes('fb.watch') || fbUrl.includes('fb.gg')) {
          try {
            fbUrl = await resolveFacebookUrl(fbUrl);
            fbUrl = fbUrl.split('?')[0]; // Clean resolved URL
          } catch (e) {}
        }

        const pluginVideoUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbUrl)}&show_text=false`;
        const pluginPostUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(fbUrl)}`;
        const mobileFbUrl = fbUrl.replace('www.facebook.com', 'm.facebook.com');
        const mbasicFbUrl = fbUrl.replace('www.facebook.com', 'mbasic.facebook.com').replace('m.facebook.com', 'mbasic.facebook.com');

        // TIER 1: Native HTML Regex Scraping with FB Plugin Embeds and Mobile Endpoints
        const scrapeCandidates = [
          pluginVideoUrl,
          pluginPostUrl,
          mobileFbUrl,
          mbasicFbUrl,
          fbUrl,
          rawUrl,
        ].filter((u, i, arr) => u && arr.indexOf(u) === i);

        const userAgents = [
          'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        ];

        for (const candidateUrl of scrapeCandidates) {
          for (const ua of userAgents) {
            try {
              const fbRes = await fetch(candidateUrl, {
                headers: {
                  'User-Agent': ua,
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
                },
                redirect: 'follow',
              });

              if (fbRes.ok) {
                const html = await fbRes.text();

                // Extract title & thumbnail if present
                const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
                  || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
                const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];

                const hdMatch = html.match(/"playable_url_quality_hd":"([^"]+)"/)
                  || html.match(/"browser_native_hd_url":"([^"]+)"/)
                  || html.match(/"hd_src":"([^"]+)"/)
                  || html.match(/"hd_src_no_ratelimit":"([^"]+)"/);
                const sdMatch = html.match(/"playable_url":"([^"]+)"/)
                  || html.match(/"browser_native_sd_url":"([^"]+)"/)
                  || html.match(/"sd_src":"([^"]+)"/)
                  || html.match(/"sd_src_no_ratelimit":"([^"]+)"/);
                const ogVidMatch = html.match(/<meta[^>]*property=["']og:video(?::secure_url|:url|)?["'][^>]*content=["']([^"']+)["']/i)?.[1]
                  || html.match(/"video_src":"([^"]+)"/)?.[1]
                  || html.match(/"video_url":"([^"]+)"/)?.[1];

                let directUrl: string | null = null;
                if (hdMatch && hdMatch[1]) directUrl = hdMatch[1];
                else if (sdMatch && sdMatch[1]) directUrl = sdMatch[1];
                else if (ogVidMatch && typeof ogVidMatch === 'string' && ogVidMatch.startsWith('http')) directUrl = ogVidMatch;

                if (directUrl) {
                  directUrl = directUrl.replace(/\\/g, '').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
                  if (!directUrl.includes('lookaside') && !directUrl.includes('.m3u8') && !directUrl.includes('.mpd')) {
                    return {
                      status: 'SUCCESS',
                      title: ogTitle ? ogTitle.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : 'Facebook Video',
                      thumbnail: ogImage || '',
                      video_url: directUrl,
                      forceProxy: true,
                    };
                  }
                }
              }
            } catch (e) {}
          }
        }

        // TIER 2: yt-dlp Mobile & Desktop Spoofing
        const ytdlCandidateUrls = [mobileFbUrl, fbUrl, rawUrl].filter((u, i, arr) => u && arr.indexOf(u) === i);
        for (const targetUrl of ytdlCandidateUrls) {
          try {
            const output: any = await youtubedl(targetUrl, {
              dumpSingleJson: true,
              noWarnings: true,
              format: 'best[protocol^=http][ext=mp4]/best[ext=mp4]/best',
              addHeader: [
                'User-Agent:Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Accept-Language:en-US,en;q=0.9',
              ],
            });

            if (output) {
              const validFormat = output.formats?.slice().reverse().find(
                (f: any) => f.url && f.url.startsWith('http') && !f.url.includes('.m3u8') && !f.url.includes('.mpd') && !f.url.includes('lookaside.fbsbx.com') && f.vcodec !== 'none' && f.acodec !== 'none'
              ) || output.formats?.slice().reverse().find(
                (f: any) => f.url && f.url.startsWith('http') && !f.url.includes('.m3u8') && !f.url.includes('.mpd') && !f.url.includes('lookaside.fbsbx.com')
              );

              const finalUrl = validFormat ? validFormat.url : (
                output.url && !output.url.includes('lookaside') && !output.url.includes('.m3u8') && !output.url.includes('.mpd') ? output.url : null
              );

              if (finalUrl) {
                return {
                  status: 'SUCCESS',
                  title: output.title || 'Facebook Video',
                  thumbnail: output.thumbnail || output.thumbnails?.[0]?.url,
                  video_url: finalUrl,
                  forceProxy: true,
                };
              }
            }
          } catch (e) {}
        }

        // TIER 3: Public Engine Fallback (Cobalt tool endpoints & VKR API)
        const cobaltInstances = [
          'https://api.cobalt.tools/api/json',
          'https://cobalt.m3u8.cx/api/json',
          'https://co.wuk.sh/api/json',
        ];

        for (const targetUrl of [fbUrl, rawUrl]) {
          for (const cobaltUrl of cobaltInstances) {
            try {
              const cobaltRes = await fetch(cobaltUrl, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                },
                body: JSON.stringify({ url: targetUrl }),
              });

              if (cobaltRes.ok) {
                const cobaltData: any = await cobaltRes.json();
                const mediaUrl = cobaltData.url || cobaltData.picker?.[0]?.url;

                if (mediaUrl && !mediaUrl.includes('lookaside.fbsbx.com')) {
                  return {
                    status: 'SUCCESS',
                    title: 'Facebook Media',
                    thumbnail: '',
                    video_url: mediaUrl,
                    forceProxy: true,
                  };
                }
              }
            } catch (e) {}
          }

          try {
            const vkrRes = await fetch(`https://api.vkrdown.com/fb/?url=${encodeURIComponent(targetUrl)}`);
            if (vkrRes.ok) {
              const vkrData: any = await vkrRes.json();
              const mediaUrl = vkrData.data?.downloads?.[0]?.url || vkrData.data?.videoUrl || vkrData.url;
              if (mediaUrl && !mediaUrl.includes('lookaside.fbsbx.com')) {
                return {
                  status: 'SUCCESS',
                  title: vkrData.data?.title || 'Facebook Video',
                  thumbnail: vkrData.data?.thumbnail || '',
                  video_url: mediaUrl,
                  forceProxy: true,
                };
              }
            }
          } catch (e) {}
        }

        throw new Error('All Facebook extraction tiers failed.');
      } catch (error) {
        console.error('Total FB Extraction Failure:', error);
        return { status: 'FAILED', reason: 'Facebook aggressively blocked this link. Make sure the video is 100% public and the URL is correct.' };
      }
    }

    // ==========================================
    // 5. FALLBACK FOR OTHER PLATFORMS
    // ==========================================
    else {
      try {
        const output: any = await youtubedl(cleanUrl, {
          dumpSingleJson: true,
          noWarnings: true,
          format: 'best',
        });
        if (output && (output.url || output.formats?.[0]?.url)) {
          return {
            status: 'SUCCESS',
            title: output.title || 'Media File',
            thumbnail: output.thumbnail || output.thumbnails?.[0]?.url,
            video_url: output.url || output.formats?.[0]?.url,
          };
        }
      } catch {}

      // OpenGraph fallback
      try {
        const pageRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
            || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
          const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
          const ogVideo = html.match(/<meta[^>]*property=["']og:video(?::secure_url|:url|)?["'][^>]*content=["']([^"']+)["']/i)?.[1]
            || html.match(/<video[^>]*src=["']([^"']+)["']/i)?.[1];

          if (ogTitle || ogVideo) {
            return {
              status: 'SUCCESS',
              title: ogTitle ? ogTitle.trim() : 'OmniFetch Media',
              thumbnail: ogImage || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80',
              video_url: ogVideo || cleanUrl,
            };
          }
        }
      } catch {}
    }

    return { status: 'FAILED', reason: 'Direct extraction failed.' };
  } catch (error: any) {
    console.error('Local Extraction Failed:', error);
    return { status: 'FAILED', reason: error?.message || 'Direct extraction failed.' };
  }
}

