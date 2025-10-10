import { NextResponse } from 'next/server';
import { createSession, deleteSession } from '../../../../lib/adminSession';

export async function POST(req: Request) {
  // login
  const body = await req.json();
  const { username, password } = body || {};
  const AUTH_USER = process.env.ADMIN_USER || 'admin';
  const AUTH_PASS = process.env.ADMIN_PASS || 'ChangeMe123!';

  if (username === AUTH_USER && password === AUTH_PASS) {
    const token = createSession(username);
    const res = NextResponse.json({ ok: true });
    // use NextResponse.cookies API to set an HttpOnly cookie
    try {
      res.cookies.set('a_token', token, { httpOnly: true, path: '/', sameSite: 'lax' });
      console.log('Cookie set via NextResponse.cookies.set');
    } catch (e) {
      // fallback to header if cookies API not available
      res.headers.set('Set-Cookie', `a_token=${token}; HttpOnly; Path=/; SameSite=Lax`);
      console.log('Cookie set via header fallback');
    }
    return res;
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || undefined;
  deleteSession(token);
  const res = NextResponse.json({ ok: true });
  try {
    res.cookies.set('a_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  } catch (e) {
    res.headers.set('Set-Cookie', `a_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  }
  return res;
}
