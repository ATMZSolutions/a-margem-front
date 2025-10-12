// src/lib/edgeCrypto.ts

export async function createHmacKey(message: string, secret: string): Promise<ArrayBuffer> {
  // Edge Runtime
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  }

  // Node.js Runtime
  const { webcrypto } = await import('crypto');
  const key = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'] as any // Node WebCrypto é incompatível com TS padrão, então cast único
  );
  return await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
}
