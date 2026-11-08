import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { urlPublicaDaMidia } from "@/lib/publicContent";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";

const ESTADOS = new Set(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]);
const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SecaoInput = { titulo: string; texto: string };
type FotoInput = { midiaId: string; textoAlternativo: string; legenda: string; credito: string | null; dataEditorial: string | null };
type EspetaculoInput = {
  slug: string; titulo: string; lancamento: string; estreia: string | null; localEstreia: string | null;
  corFundo: string | null; capaId: string | null; ordem: number;
  estado: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO"; secoes: SecaoInput[]; fotosGaleria: FotoInput[];
};

function nullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === "string" && value.length <= maxLength);
}

function validarOrdem(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 10000;
}

function parseSecoes(value: unknown): SecaoInput[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const resultado: SecaoInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const secao = item as Record<string, unknown>;
    if (!isText(secao.titulo, 200) || !isText(secao.texto, 20000)) return null;
    resultado.push({ titulo: secao.titulo, texto: secao.texto });
  }
  return resultado;
}

function parseFotos(value: unknown): FotoInput[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;
  const resultado: FotoInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const foto = item as Record<string, unknown>;
    if (typeof foto.midiaId !== "string" || !foto.midiaId || foto.midiaId.length > 64
      || !nullableText(foto.textoAlternativo ?? "", 300)
      || !nullableText(foto.legenda ?? "", 2000)
      || !nullableText(foto.credito ?? null, 300)
      || !nullableText(foto.dataEditorial ?? null, 50)) return null;
    resultado.push({
      midiaId: foto.midiaId,
      textoAlternativo: typeof foto.textoAlternativo === "string" ? foto.textoAlternativo : "",
      legenda: typeof foto.legenda === "string" ? foto.legenda : "",
      credito: typeof foto.credito === "string" && foto.credito ? foto.credito : null,
      dataEditorial: typeof foto.dataEditorial === "string" && foto.dataEditorial ? foto.dataEditorial : null,
    });
  }
  return resultado;
}

function parseEspetaculo(body: Record<string, unknown>): EspetaculoInput | null {
  const estado = body.estado ?? "RASCUNHO";
  const ordem = body.ordem ?? 0;
  const secoes = parseSecoes(body.secoes);
  const fotosGaleria = parseFotos(body.fotosGaleria);
  if (typeof body.slug !== "string" || body.slug.length > 120 || !SLUG_VALIDO.test(body.slug)
    || !isText(body.titulo, 300) || !isText(body.lancamento, 30)
    || !nullableText(body.estreia ?? null, 50) || !nullableText(body.localEstreia ?? null, 500)
    || !nullableText(body.corFundo ?? null, 20)
    || (typeof body.corFundo === "string" && !/^#[0-9a-fA-F]{6}$/.test(body.corFundo))
    || !(body.capaId === null || body.capaId === undefined || body.capaId === "" || (typeof body.capaId === "string" && body.capaId.length <= 64))
    || !validarOrdem(ordem) || typeof estado !== "string" || !ESTADOS.has(estado) || !secoes || !fotosGaleria) return null;

  return {
    slug: body.slug,
    titulo: body.titulo,
    lancamento: body.lancamento,
    estreia: typeof body.estreia === "string" && body.estreia ? body.estreia : null,
    localEstreia: typeof body.localEstreia === "string" && body.localEstreia ? body.localEstreia : null,
    corFundo: typeof body.corFundo === "string" && body.corFundo ? body.corFundo : null,
    capaId: typeof body.capaId === "string" && body.capaId ? body.capaId : null,
    ordem,
    estado: estado as EspetaculoInput["estado"],
    secoes,
    fotosGaleria,
  };
}

async function validarMidias(input: EspetaculoInput) {
  const ids = [...new Set([input.capaId, ...input.fotosGaleria.map((foto) => foto.midiaId)].filter((id): id is string => Boolean(id)))];
  if (!ids.length) return true;
  return (await prisma.midia.count({ where: { id: { in: ids } } })) === ids.length;
}

function conflitoUnico(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function revalidar(slug?: string) {
  revalidatePath("/espetaculos");
  if (slug) revalidatePath(`/espetaculos/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const items = await prisma.espetaculo.findMany({
    orderBy: [{ ordem: "asc" }, { lancamento: "desc" }],
    include: {
      capa: { select: { bucket: true, chave: true, origem: true } },
      secoes: { orderBy: { ordem: "asc" } },
      galerias: { include: { fotos: { orderBy: { ordem: "asc" }, include: { midia: { select: { bucket: true, chave: true, origem: true } } } } } },
    },
  });
  return NextResponse.json(items.map((item) => ({
    id: item.id,
    slug: item.slug,
    titulo: item.titulo,
    lancamento: item.lancamento,
    estreia: item.estreia,
    localEstreia: item.localEstreia,
    corFundo: item.corFundo,
    capaId: item.capaId,
    capaUrl: urlPublicaDaMidia(item.capa),
    ordem: item.ordem,
    estado: item.estado,
    secoes: item.secoes.map(({ titulo, texto }) => ({ titulo, texto })),
    fotosGaleria: item.galerias.flatMap((galeria) => galeria.fotos).sort((a, b) => a.ordem - b.ordem).map((foto) => ({
      midiaId: foto.midiaId,
      url: urlPublicaDaMidia(foto.midia),
      textoAlternativo: foto.textoAlternativo,
      legenda: foto.legenda,
      credito: foto.credito,
      dataEditorial: foto.dataEditorial,
    })),
  })));
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  const input = body && parseEspetaculo(body);
  if (!input) return NextResponse.json({ error: "Dados de espetáculo inválidos" }, { status: 400 });
  if (!await validarMidias(input)) return NextResponse.json({ error: "Uma ou mais mídias não existem" }, { status: 400 });

  try {
    const idGaleria = `admin:espetaculo:${randomUUID()}`;
    const item = await prisma.espetaculo.create({
      data: {
        slug: input.slug,
        titulo: input.titulo,
        lancamento: input.lancamento,
        estreia: input.estreia,
        localEstreia: input.localEstreia,
        corFundo: input.corFundo,
        capaId: input.capaId,
        ordem: input.ordem,
        estado: input.estado,
        secoes: { create: input.secoes.map((secao, ordem) => ({ ...secao, ordem })) },
        ...(input.fotosGaleria.length ? {
          galerias: { create: [{
            chaveOrigem: idGaleria,
            titulo: input.titulo,
            fotos: { create: input.fotosGaleria.map((foto, ordem) => ({
              chaveOrigem: `${idGaleria}:foto:${ordem}:${randomUUID()}`,
              midia: { connect: { id: foto.midiaId } },
              ordem,
              textoAlternativo: foto.textoAlternativo,
              legenda: foto.legenda,
              credito: foto.credito,
              dataEditorial: foto.dataEditorial,
            })) },
          }] },
        } : {}),
      },
    });
    await revalidar(item.slug);
    return NextResponse.json({ id: item.id, slug: item.slug }, { status: 201 });
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Já existe um espetáculo com esse identificador" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível salvar o espetáculo" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || typeof body.id !== "string" || !body.id || body.id.length > 64) {
    return NextResponse.json({ error: "Identificador de espetáculo inválido" }, { status: 400 });
  }
  const input = parseEspetaculo(body);
  if (!input) return NextResponse.json({ error: "Dados de espetáculo inválidos" }, { status: 400 });
  if (!await validarMidias(input)) return NextResponse.json({ error: "Uma ou mais mídias não existem" }, { status: 400 });
  const atual = await prisma.espetaculo.findUnique({ where: { id: body.id }, select: { slug: true } });
  if (!atual) return NextResponse.json({ error: "Espetáculo não encontrado" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.espetaculo.update({
        where: { id: body.id as string },
        data: {
          slug: input.slug, titulo: input.titulo, lancamento: input.lancamento, estreia: input.estreia,
          localEstreia: input.localEstreia, corFundo: input.corFundo, capaId: input.capaId,
          ordem: input.ordem, estado: input.estado,
        },
      });
      await tx.secaoEspetaculo.deleteMany({ where: { espetaculoId: body.id as string } });
      if (input.secoes.length) {
        await tx.secaoEspetaculo.createMany({ data: input.secoes.map((secao, ordem) => ({ ...secao, ordem, espetaculoId: body.id as string })) });
      }

      const galerias = await tx.galeria.findMany({ where: { espetaculoId: body.id as string }, include: { fotos: { orderBy: { ordem: "asc" } } } });
      const galeria = galerias[0];
      if (!input.fotosGaleria.length) {
        if (galerias.length) {
          await tx.fotoGaleria.deleteMany({ where: { galeriaId: { in: galerias.map((item) => item.id) } } });
          await tx.galeria.deleteMany({ where: { id: { in: galerias.map((item) => item.id) } } });
        }
        return;
      }

      let galeriaId = galeria?.id;
      if (!galeriaId) {
        const criada = await tx.galeria.create({ data: { chaveOrigem: `admin:espetaculo:${randomUUID()}`, titulo: input.titulo, espetaculoId: body.id as string } });
        galeriaId = criada.id;
      } else {
        await tx.galeria.update({ where: { id: galeriaId }, data: { titulo: input.titulo } });
      }
      const existentes = galeria?.fotos ?? [];
      for (const [ordem, foto] of input.fotosGaleria.entries()) {
        const data = {
          midiaId: foto.midiaId,
          ordem,
          textoAlternativo: foto.textoAlternativo,
          legenda: foto.legenda,
          credito: foto.credito,
          dataEditorial: foto.dataEditorial,
        };
        if (existentes[ordem]) await tx.fotoGaleria.update({ where: { id: existentes[ordem].id }, data });
        else await tx.fotoGaleria.create({
          data: { ...data, galeriaId, chaveOrigem: `admin:espetaculo:${body.id}:foto:${randomUUID()}` },
        });
      }
      const removidas = existentes.slice(input.fotosGaleria.length).map((foto) => foto.id);
      if (removidas.length) await tx.fotoGaleria.deleteMany({ where: { id: { in: removidas } } });
      const outrasGalerias = galerias.slice(1).map((item) => item.id);
      if (outrasGalerias.length) {
        await tx.fotoGaleria.deleteMany({ where: { galeriaId: { in: outrasGalerias } } });
        await tx.galeria.deleteMany({ where: { id: { in: outrasGalerias } } });
      }
    });
    await revalidar(atual.slug);
    await revalidar(input.slug);
    return NextResponse.json({ id: body.id, slug: input.slug });
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Já existe um espetáculo com esse identificador" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível atualizar o espetáculo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 64) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  const item = await prisma.espetaculo.update({ where: { id }, data: { estado: "ARQUIVADO" }, select: { slug: true } }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Espetáculo não encontrado" }, { status: 404 });
  await revalidar(item.slug);
  return NextResponse.json({ ok: true });
}
