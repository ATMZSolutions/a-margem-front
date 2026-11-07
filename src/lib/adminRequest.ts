import { NextResponse } from "next/server";
import { validateSession } from "./adminSession";

interface AdminRequestOptions {
  write?: boolean;
  json?: boolean;
}

function getSessionToken(request: Request): string | undefined {
  const cookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("a_token="));
  return cookie?.slice("a_token=".length);
}

export function hasExactJsonContentType(request: Request): boolean {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  return mediaType === "application/json";
}

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function authorizeAdminRequest(
  request: Request,
  options: AdminRequestOptions = {},
): Promise<NextResponse | null> {
  if (options.write && !hasSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  if (options.json && !hasExactJsonContentType(request)) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  if (!await validateSession(getSessionToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
