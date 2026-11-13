import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { getAdminConfig } from "@/lib/adminConfig";
import { readJsonObject } from "@/lib/adminInput";

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;

  let config;
  try {
    config = getAdminConfig();
  } catch {
    return NextResponse.json({ error: "Configuração administrativa indisponível" }, { status: 503 });
  }

  const body = await readJsonObject(request);
  const password = body && typeof body.password === "string" ? body.password : "";

  if (!password) {
    return NextResponse.json({ error: "Senha não informada." }, { status: 400 });
  }

  const bufA = Buffer.from(password, "utf-8");
  const bufB = Buffer.from(config.password, "utf-8");
  const senhaValida = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

  if (!senhaValida) {
    return NextResponse.json({ error: "Senha administrativa incorreta." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

