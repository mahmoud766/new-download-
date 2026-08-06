import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ar', 'es', 'pt', 'hi'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [locale, q] = lang.trim().split(';q=');
      return {
        locale: locale.split('-')[0].toLowerCase(),
        q: q ? parseFloat(q) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const item of languages) {
    if (locales.includes(item.locale)) {
      return item.locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalize path by stripping trailing slash (unless root)
  const normPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // 1. Handle localized admin paths: e.g., /ar/admin, /ar/admin/login, /ar/admin-download, /ar/admin-download/login
  for (const loc of locales) {
    if (
      normPath === `/${loc}/admin` ||
      normPath.startsWith(`/${loc}/admin/`) ||
      normPath === `/${loc}/admin-download` ||
      normPath.startsWith(`/${loc}/admin-download/`)
    ) {
      const targetPath = normPath.replace(`/${loc}`, '');
      const url = request.nextUrl.clone();
      url.pathname = targetPath;
      return NextResponse.redirect(url);
    }
  }

  // 2. Alias /admin to /admin-download, and /admin/login to /admin-download/login
  if (normPath === '/admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin-download';
    return NextResponse.redirect(url);
  }
  if (normPath === '/admin/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin-download/login';
    return NextResponse.redirect(url);
  }

  // 3. Protect /admin-download routes
  if (normPath === '/admin-download' || normPath.startsWith('/admin-download/')) {
    const isLoginPage = normPath === '/admin-download/login';
    
    // Read admin_session cookie
    const adminSessionCookie = request.cookies.get('admin_session')?.value || '';
    const isAuthenticated = adminSessionCookie === 'authenticated';

    if (isLoginPage) {
      if (isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin-download';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin-download/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 4. Skip static files, api routes, icons, and sw.js
  if (
    normPath.startsWith('/_next') ||
    normPath.startsWith('/api') ||
    normPath.includes('.') ||
    normPath === '/favicon.ico' ||
    normPath === '/sw.js' ||
    normPath === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // 5. Check if normPath already has a supported locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => normPath.startsWith(`/${locale}/`) || normPath === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // 6. Redirect root or un-localized route to localized path
  const locale = getLocale(request);
  const targetUrl = new URL(`/${locale}${normPath === '/' ? '' : normPath}`, request.url);
  return NextResponse.redirect(targetUrl, 307);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
