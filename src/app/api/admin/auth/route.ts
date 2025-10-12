// src/app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';
import { createSession, deleteSession } from '../../../../lib/adminSession';

export async function POST(req: Request) {
  // login
  const body = await req.json();
  const { username, password } = body || {};
  const AUTH_USER = process.env.ADMIN_USER || 'admin';
  const AUTH_PASS = process.env.ADMIN_PASS || 'ChangeMe123!';

  if (username === AUTH_USER && password === AUTH_PASS) {
    // await porque createSession retorna Promise<string>
    const token = await createSession(username);

    const res = NextResponse.json({ ok: true });

    // definir cookie HttpOnly
    try {
      res.cookies.set('a_token', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
      console.log('Cookie set via NextResponse.cookies.set');
    } catch (e) {
      // fallback para header, se necessário
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

  await deleteSession(token); // garantir que é async se necessário

  const res = NextResponse.json({ ok: true });

  try {
    res.cookies.set('a_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });
  } catch (e) {
    res.headers.set('Set-Cookie', 'a_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  }

  return res;
}
