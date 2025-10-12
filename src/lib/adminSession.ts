// JWT-based session store that doesn't depend on server memory
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface JWTPayload {
  username: string;
  iat: number;
  exp: number;
  [key: string]: unknown; // permite campos extras
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = (str + '===').slice(0, str.length + (str.length % 4));
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64').toString();
}

// Edge Runtime compatível
async function createHmacSHA256(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const b64 = Buffer.from(sig).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function createJWT(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = await createHmacSHA256(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const expectedSignature = await createHmacSHA256(`${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function createSession(username: string) {
  const payload: JWTPayload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h
  };
  return await createJWT(payload);
}

export async function validateSession(token?: string) {
  if (!token) return false;
  const payload = await verifyJWT(token);
  return payload !== null;
}

export function deleteSession(_token?: string) {
  // JWT tokens are stateless; client clears cookie
}
