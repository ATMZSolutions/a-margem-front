import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { listAdminHistory } from "@/lib/siteContent";
import { urlPublicaDaMidia } from "@/lib/publicContent";

const ESTADOS = new Set(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]);

function validarEstado(value: unknown): value is "RASCUNHO" | "PUBLICADO" | "ARQUIVADO" {
  return typeof value === "string" && ESTADOS.has(value);
}

async function validarMidia(id: unknown): Promise<boolean> {
  if (id === null || id === undefined || id === "") return true;
  return typeof id === "string" && id.length <= 128 && Boolean(await prisma.midia.findUnique({ where: { id }, select: { id: true } }));
}

async function revalidar() {
  revalidatePath("/sobre");
  revalidatePath("/sitemap.xml");
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const [itens, midias] = await Promise.all([
    listAdminHistory(),
    prisma.midia.findMany({ orderBy: [{ criadoEm: "desc" }, { id: "asc" }], select: { id: true, bucket: true, chave: true, mime: true, bytes: true, nomeOriginal: true, origem: true } }),
  ]);
  return NextResponse.json({
    itens,
    midias: midias.map((item) => ({ id: item.id, url: urlPublicaDaMidia(item) ?? item.origem ?? "/padrao2.webp", mime: item.mime, bytes: item.bytes, nomeOriginal: item.nomeOriginal })),
  });
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  const estado = body?.estado ?? "RASCUNHO";
  const ordem = body?.ordem ?? 0;
  if (!body || !Number.isSafeInteger(body.ano) || (body.ano as number) < 1800 || (body.ano as number) > 2200
    || !isText(body.descricao, 20000) || !Number.isSafeInteger(ordem) || (ordem as number) < 0 || (ordem as number) > 10000
    || !validarEstado(estado) || !await validarMidia(body.midiaId)) {
    return NextResponse.json({ error: "Dados do marco histórico inválidos" }, { status: 400 });
  }
  const item = await prisma.$transaction(async (tx) => {
    const criado = await tx.marcoHistorico.create({ data: { ano: body.ano as number, descricao: body.descricao as string, ordem: ordem as number, estado } });
    const midiaId = typeof body.midiaId === "string" && body.midiaId ? body.midiaId : null;
    if (midiaId) await tx.usoMidia.create({
      data: { chaveOrigem: `admin:MarcoHistorico:${criado.id}:imagem`, midiaId, dominio: "MarcoHistorico", registro: criado.id, campo: "imagem", textoAlternativo: "", ordem: criado.ordem },
    });
    return criado;
  });
  await revalidar();
  return NextResponse.json({ id: item.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || typeof body.id !== "string" || !body.id || body.id.length > 128) return NextResponse.json({ error: "Identificador de marco inválido" }, { status: 400 });
  if (body.ano !== undefined && (!Number.isSafeInteger(body.ano) || (body.ano as number) < 1800 || (body.ano as number) > 2200)) return NextResponse.json({ error: "Ano inválido" }, { status: 400 });
  if (body.descricao !== undefined && !isText(body.descricao, 20000)) return NextResponse.json({ error: "Descrição inválida" }, { status: 400 });
  if (body.ordem !== undefined && (!Number.isSafeInteger(body.ordem) || (body.ordem as number) < 0 || (body.ordem as number) > 10000)) return NextResponse.json({ error: "Ordem inválida" }, { status: 400 });
  if (body.estado !== undefined && !validarEstado(body.estado)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  if (body.midiaId !== undefined && !await validarMidia(body.midiaId)) return NextResponse.json({ error: "Mídia inválida" }, { status: 400 });

  const atual = await prisma.marcoHistorico.findUnique({ where: { id: body.id }, select: { id: true } });
  if (!atual) return NextResponse.json({ error: "Marco histórico não encontrado" }, { status: 404 });
  const data: { ano?: number; descricao?: string; ordem?: number; estado?: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO" } = {};
  if (body.ano !== undefined) data.ano = body.ano as number;
  if (body.descricao !== undefined) data.descricao = body.descricao as string;
  if (body.ordem !== undefined) data.ordem = body.ordem as number;
  if (body.estado !== undefined) data.estado = body.estado as typeof data.estado;
  if (!Object.keys(data).length && body.midiaId === undefined) return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) await tx.marcoHistorico.update({ where: { id: body.id as string }, data });
    if (body.midiaId === undefined) return;
    const midiaId = typeof body.midiaId === "string" && body.midiaId ? body.midiaId : null;
    const usoAtual = await tx.usoMidia.findFirst({ where: { dominio: "MarcoHistorico", registro: body.id as string, campo: "imagem" }, select: { id: true } });
    if (!midiaId) {
      await tx.usoMidia.deleteMany({ where: { dominio: "MarcoHistorico", registro: body.id as string, campo: "imagem" } });
    } else if (usoAtual) {
      await tx.usoMidia.update({ where: { id: usoAtual.id }, data: { midiaId } });
    } else {
      await tx.usoMidia.create({ data: { chaveOrigem: `admin:MarcoHistorico:${body.id}:imagem`, midiaId, dominio: "MarcoHistorico", registro: body.id as string, campo: "imagem", textoAlternativo: "" } });
    }
  });
  await revalidar();
  return NextResponse.json({ id: body.id });
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 128) return NextResponse.json({ error: "Identificador de marco inválido" }, { status: 400 });
  const item = await prisma.marcoHistorico.update({ where: { id }, data: { estado: "ARQUIVADO" } }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Marco histórico não encontrado" }, { status: 404 });
  await revalidar();
  return NextResponse.json({ ok: true });
}
