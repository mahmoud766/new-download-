import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // If user visits /api/admin/login directly in browser, redirect to visual login page
  return NextResponse.redirect(new URL('/admin-download/login', req.url));
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_SECURE_PASSWORD || 'omnifetch2026admin';

    if (password && typeof password === 'string' && password.trim() === adminPassword.trim()) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    } else {
      return NextResponse.json({ success: false, error: 'كلمة المرور غير صحيحة (Invalid password)' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ في الخادم (Server error)' }, { status: 500 });
  }
}
