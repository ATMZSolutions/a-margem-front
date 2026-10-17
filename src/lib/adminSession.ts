import { getAdminConfig } from "./adminConfig";

const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

interface JWTPayload {
  username: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(message: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, toArrayBuffer(base64UrlDecode(signature)), encoder.encode(message));
}

export async function createSession(username: string): Promise<string> {
  const { username: configuredUsername, jwtSecret } = getAdminConfig();
  if (username !== configuredUsername) throw new Error("Invalid admin user");

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({
    username,
    iat: now,
    exp: now + SESSION_SECONDS,
  })));
  const message = `${header}.${payload}`;
  return `${message}.${await sign(message, jwtSecret)}`;
}

export async function validateSession(token?: string): Promise<boolean> {
  if (!token || token.length > 2048) return false;

  try {
    const { username, jwtSecret } = getAdminConfig();
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedPayload, signature] = parts;
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedHeader)));
    if (header.alg !== "HS256" || header.typ !== "JWT") return false;

    if (!await verify(`${encodedHeader}.${encodedPayload}`, signature, jwtSecret)) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    return payload.username === username
      && Number.isInteger(payload.iat)
      && Number.isInteger(payload.exp)
      && payload.iat <= now
      && payload.exp > now
      && payload.exp - payload.iat <= SESSION_SECONDS;
  } catch {
    return false;
  }
}

export const sessionMaxAge = SESSION_SECONDS;
