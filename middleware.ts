import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from './src/lib/adminSession';

const AUTH_USER = process.env.ADMIN_USER || 'admin';
const AUTH_PASS = process.env.ADMIN_PASS || 'ChangeMe123!';

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { ['WWW-Authenticate']: 'Basic realm="Admin Area"' },
  });
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;

  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin')) {
    // Allow the public login page and auth endpoint through
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return NextResponse.next();
    if (pathname === '/api/admin/auth' || pathname.startsWith('/api/admin/auth/')) return NextResponse.next();

    // For UI access (/admin) require an internal session cookie `a_token`.
    const cookie = req.cookies.get('a_token')?.value;
    if (cookie && await validateSession(cookie)) return NextResponse.next();

    // If request is an API call, allow Basic Auth as a secondary route
    if (pathname.startsWith('/api/admin')) {
      const auth = req.headers.get('authorization');
      if (auth && auth.startsWith('Basic ')) {
        try {
          const payload = auth.split(' ')[1];
          const decoded = typeof atob === 'function' ? atob(payload) : Buffer.from(payload, 'base64').toString();
          const [user, pass] = decoded.split(':');
          if (user === AUTH_USER && pass === AUTH_PASS) return NextResponse.next();
        } catch (e) {
          // fall through
        }
      }
      return unauthorized();
    }

    // Redirect UI to login if not authorized
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
