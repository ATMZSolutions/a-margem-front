import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { urlPublicaDaMidia } from "@/lib/publicContent";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";

const ESTADOS = new Set(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]);
const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validarSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && SLUG_VALIDO.test(value);
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

async function revalidar(slug?: string) {
  revalidatePath("/coletivo");
  if (slug) revalidatePath(`/coletivo/integrante/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const items = await prisma.integrante.findMany({
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    include: { foto: { select: { bucket: true, chave: true, origem: true, mime: true, bytes: true } } },
  });
  return NextResponse.json(items.map((item) => ({
    id: item.id,
    slug: item.slug,
    nome: item.nome,
    fichaTecnica: item.fichaTecnica,
    biografia: item.biografia,
    fotoId: item.fotoId,
    fotoUrl: urlPublicaDaMidia(item.foto),
    ordem: item.ordem,
    estado: item.estado,
  })));
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  const slug = body?.slug;
  const estado = body?.estado ?? "RASCUNHO";
  const ordem = body?.ordem ?? 0;
  if (!body || !validarSlug(slug) || !isText(body.nome, 200) || !isText(body.fichaTecnica, 5000)
    || !isText(body.biografia, 20000) || !validarEstado(estado) || !validarOrdem(ordem)
    || !await validarFotoId(body.fotoId)) {
    return NextResponse.json({ error: "Dados de integrante inválidos" }, { status: 400 });
  }
  try {
    const item = await prisma.integrante.create({
      data: {
        slug, nome: body.nome, fichaTecnica: body.fichaTecnica, biografia: body.biografia,
        fotoId: typeof body.fotoId === "string" ? body.fotoId : null, ordem, estado,
      },
    });
    await revalidar(item.slug);
    return NextResponse.json({ id: item.id, slug: item.slug }, { status: 201 });
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Já existe um integrante com esse identificador" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível salvar o integrante" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || typeof body.id !== "string" || !body.id || body.id.length > 64) {
    return NextResponse.json({ error: "Identificador de integrante inválido" }, { status: 400 });
  }
  const atual = await prisma.integrante.findUnique({ where: { id: body.id }, select: { slug: true } });
  if (!atual) return NextResponse.json({ error: "Integrante não encontrado" }, { status: 404 });
  const data: {
    slug?: string; nome?: string; fichaTecnica?: string; biografia?: string;
    fotoId?: string | null; ordem?: number; estado?: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  } = {};
  if (body.slug !== undefined) {
    if (!validarSlug(body.slug)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
    data.slug = body.slug;
  }
  for (const campo of ["nome", "fichaTecnica", "biografia"] as const) {
    if (body[campo] !== undefined) {
      const limites = { nome: 200, fichaTecnica: 5000, biografia: 20000 };
      if (!isText(body[campo], limites[campo])) return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
      data[campo] = body[campo];
    }
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
    const item = await prisma.integrante.update({ where: { id: body.id }, data, select: { id: true, slug: true } });
    await revalidar(atual.slug);
    await revalidar(item.slug);
    return NextResponse.json(item);
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Já existe um integrante com esse identificador" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível atualizar o integrante" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 64) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  const item = await prisma.integrante.update({ where: { id }, data: { estado: "ARQUIVADO" }, select: { slug: true } }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Integrante não encontrado" }, { status: 404 });
  await revalidar(item.slug);
  return NextResponse.json({ ok: true });
}
