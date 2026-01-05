import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const ALLOWED_HOSTS = new Set(['assets.bullydex.com']);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function isPrivateOrLocalhost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost');
}

export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get('u');
  if (!u) {
    return new Response('Missing u', { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return new Response('Invalid u', { status: 400 });
  }

  if (url.protocol !== 'https:') {
    return new Response('Only https is allowed', { status: 400 });
  }
  if (isPrivateOrLocalhost(url.hostname) || !ALLOWED_HOSTS.has(url.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Some CDNs behave better with an explicit UA.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.bullydex.com/',
      },
    });
  } catch (e: any) {
    const message = e?.name === 'AbortError' ? 'Timed out' : 'Failed to fetch image';
    return new Response(message, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    return new Response(`Upstream error (${res.status})`, { status: 502 });
  }

  const contentLength = res.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BYTES) {
    return new Response('Image too large', { status: 413 });
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return new Response('Not an image', { status: 415 });
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return new Response('Image too large', { status: 413 });
  }

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Cache aggressively; images are content-addressed-ish by filename hash on BullyDex CDN.
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}


