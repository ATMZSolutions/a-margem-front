import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { urlPublicaDaMidia } from "@/lib/publicContent";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";

const ESTADOS = new Set(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]);
const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ANO_VALIDO = /^\d{4}$/;

function validarSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && SLUG_VALIDO.test(value);
}

function validarAno(value: unknown): value is string {
  return typeof value === "string" && ANO_VALIDO.test(value);
}

function validarOrdem(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 10000;
}

function validarEstado(value: unknown): value is "RASCUNHO" | "PUBLICADO" | "ARQUIVADO" {
  return typeof value === "string" && ESTADOS.has(value);
}

async function validarFotoId(value: unknown): Promise<boolean> {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 64) return false;
  return Boolean(await prisma.midia.findUnique({ where: { id: value }, select: { id: true } }));
}

function conflitoUnico(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function revalidar(slug?: string, year?: string) {
  revalidatePath("/premios");
  if (slug && year) revalidatePath(`/premios/${slug}/${year}`);
  revalidatePath("/sitemap.xml");
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const items = await prisma.premio.findMany({
    orderBy: [{ ordem: "asc" }, { ano: "desc" }],
    include: { foto: { select: { bucket: true, chave: true, origem: true } } },
  });
  return NextResponse.json(items.map((item) => ({
    id: item.id, slug: item.slug, titulo: item.titulo, ano: item.ano, evento: item.evento,
    descricao: item.descricao, fotoId: item.fotoId, fotoUrl: urlPublicaDaMidia(item.foto), ordem: item.ordem, estado: item.estado,
  })));
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  const estado = body?.estado ?? "RASCUNHO";
  const ordem = body?.ordem ?? 0;
  if (!body || !validarSlug(body.slug) || !isText(body.titulo, 300) || !validarAno(body.ano)
    || !isText(body.evento, 300) || !isText(body.descricao, 20000)
    || !validarEstado(estado) || !validarOrdem(ordem) || !await validarFotoId(body.fotoId)) {
    return NextResponse.json({ error: "Dados de prêmio inválidos" }, { status: 400 });
  }
  try {
    const item = await prisma.premio.create({
      data: {
        slug: body.slug, titulo: body.titulo, ano: body.ano, evento: body.evento, descricao: body.descricao,
        fotoId: typeof body.fotoId === "string" ? body.fotoId : null, ordem, estado,
      },
    });
    await revalidar(item.slug, item.ano);
    return NextResponse.json({ id: item.id, slug: item.slug, ano: item.ano }, { status: 201 });
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Já existe um prêmio com esse identificador e ano" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível salvar o prêmio" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || typeof body.id !== "string" || !body.id || body.id.length > 64) {
    return NextResponse.json({ error: "Identificador de prêmio inválido" }, { status: 400 });
  }
  const atual = await prisma.premio.findUnique({ where: { id: body.id }, select: { slug: true, ano: true } });
  if (!atual) return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 });
  const data: {
    slug?: string; titulo?: string; ano?: string; evento?: string; descricao?: string;
    fotoId?: string | null; ordem?: number; estado?: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  } = {};
  if (body.slug !== undefined) {
    if (!validarSlug(body.slug)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
    data.slug = body.slug;
  }
  for (const campo of ["titulo", "evento", "descricao"] as const) {
    if (body[campo] !== undefined) {
      const limites = { titulo: 300, evento: 300, descricao: 20000 };
      if (!isText(body[campo], limites[campo])) return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
      data[campo] = body[campo];
    }
  }
  if (body.ano !== undefined) {
    if (!validarAno(body.ano)) return NextResponse.json({ error: "Ano inválido" }, { status: 400 });
    data.ano = body.ano;
  }
  if (body.fotoId !== undefined) {
    if (!await validarFotoId(body.fotoId)) return NextResponse.json({ error: "Mídia inválida" }, { status: 400 });
    data.fotoId = typeof body.fotoId === "string" && body.fotoId ? body.fotoId : null;
  }
  if (body.ordem !== undefined) {
    if (!validarOrdem(body.ordem)) return NextResponse.json({ error: "Ordem inválida" }, { status: 400 });
    data.ordem = body.ordem;
  }
  if (body.estado !== undefined) {
    if (!validarEstado(body.estado)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    data.estado = body.estado;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  try {
    const item = await prisma.premio.update({ where: { id: body.id }, data, select: { id: true, slug: true, ano: true } });
    await revalidar(atual.slug, atual.ano);
    await revalidar(item.slug, item.ano);
    return NextResponse.json(item);
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Já existe um prêmio com esse identificador e ano" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível atualizar o prêmio" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 64) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  const item = await prisma.premio.update({ where: { id }, data: { estado: "ARQUIVADO" }, select: { slug: true, ano: true } }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 });
  await revalidar(item.slug, item.ano);
  return NextResponse.json({ ok: true });
}
