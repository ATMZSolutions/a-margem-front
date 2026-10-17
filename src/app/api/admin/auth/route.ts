import { NextResponse } from "next/server";
import { getAdminConfig } from "@/lib/adminConfig";
import { createSession, sessionMaxAge } from "@/lib/adminSession";

const WINDOW_MS = 15 * 60 * 1000;
const attemptsByAddress = new Map<string, { count: number; windowStartedAt: number; blockedUntil: number }>();

function getAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

async function readLoginBody(request: Request): Promise<Record<string, unknown> | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function getRateLimit(address: string) {
  const now = Date.now();
  let record = attemptsByAddress.get(address);
  if (!record || now - record.windowStartedAt > WINDOW_MS) {
    record = { count: 0, windowStartedAt: now, blockedUntil: 0 };
    attemptsByAddress.set(address, record);
  }
  if (attemptsByAddress.size > 2000) {
    for (const [key, value] of attemptsByAddress) {
      if (now - value.windowStartedAt > WINDOW_MS && value.blockedUntil < now) attemptsByAddress.delete(key);
    }
    while (attemptsByAddress.size > 5000) {
      const oldest = attemptsByAddress.keys().next().value;
      if (!oldest) break;
      attemptsByAddress.delete(oldest);
    }
  }
  return record;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2048) return NextResponse.json({ error: "Invalid request" }, { status: 413 });
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 415 });
  }

  let config;
  try {
    config = getAdminConfig();
  } catch {
    return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  }

  const address = getAddress(request);
  const rateLimit = getRateLimit(address);
  const now = Date.now();
  if (rateLimit.blockedUntil > now) {
    return NextResponse.json({ error: "Invalid credentials" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rateLimit.blockedUntil - now) / 1000)) },
    });
  }

  try {
    const body = await readLoginBody(request);
    if (body?.username === config.username && body?.password === config.password) {
      attemptsByAddress.delete(address);
      const token = await createSession(config.username);
      const response = NextResponse.json({ ok: true });
      response.cookies.set("a_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: sessionMaxAge,
      });
      return response;
    }
  } catch {
    // Malformed JSON and invalid credentials share the same response.
  }

  rateLimit.count += 1;
  if (rateLimit.count >= 15) rateLimit.blockedUntil = now + 60 * 60 * 1000;
  else if (rateLimit.count >= 10) rateLimit.blockedUntil = now + 15 * 60 * 1000;
  else if (rateLimit.count >= 5) rateLimit.blockedUntil = now + 60 * 1000;

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("a_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}
