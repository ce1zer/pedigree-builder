import { NextRequest, NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected"',
    },
  });
}

export function middleware(request: NextRequest) {
  // Only protect production (Vercel). Local dev and previews remain open.
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.next();
  }

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // Fail closed in production if not configured (so you don't accidentally deploy a public site).
  if (!user || !pass) {
    return new NextResponse('Server auth not configured', { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return unauthorized();
  }

  const base64 = authHeader.slice('Basic '.length).trim();

  let decoded = '';
  try {
    decoded = atob(base64);
  } catch {
    return unauthorized();
  }

  const sepIndex = decoded.indexOf(':');
  if (sepIndex < 0) return unauthorized();

  const providedUser = decoded.slice(0, sepIndex);
  const providedPass = decoded.slice(sepIndex + 1);

  if (providedUser !== user || providedPass !== pass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};


