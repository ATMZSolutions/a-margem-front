import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { getPublicProjectPageSettings, listPublicProjectPhotos } from "@/lib/siteContent";
import { urlPublicaDaMidia } from "@/lib/publicContent";

function objeto(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validarSelecao(value: unknown): value is Record<string, unknown> {
  if (!objeto(value)) return false;
  return (value.midiaId === null || value.midiaId === undefined || typeof value.midiaId === "string" && value.midiaId.length <= 128)
    && (value.origem === null || value.origem === undefined || typeof value.origem === "string" && value.origem.startsWith("/") && !value.origem.startsWith("//") && value.origem.length <= 500 && !/[\\'"\r\n]/.test(value.origem))
    && (value.alt === undefined || typeof value.alt === "string" && value.alt.length <= 300);
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const [pagina, fotos, midias] = await Promise.all([
    getPublicProjectPageSettings(),
    listPublicProjectPhotos(),
    prisma.midia.findMany({ orderBy: [{ criadoEm: "desc" }, { id: "asc" }], select: { id: true, bucket: true, chave: true, mime: true, bytes: true, nomeOriginal: true, origem: true } }),
  ]);
  return NextResponse.json({
    pagina,
    fotos,
    midias: midias.map((item) => ({ id: item.id, url: urlPublicaDaMidia(item) ?? item.origem ?? "/padrao2.webp", mime: item.mime, bytes: item.bytes, nomeOriginal: item.nomeOriginal })),
  });
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  const pagina = body && objeto(body.pagina) ? body.pagina : null;
  const fotos = body?.fotos;
  if (!body || !pagina || !isText(pagina.introducao, 10000) || !isText(pagina.tituloTrajetoria, 200)
    || !validarSelecao(pagina.fundo) || !Array.isArray(fotos) || fotos.length > 100) {
    return NextResponse.json({ error: "Configuração da página de projetos inválida" }, { status: 400 });
  }

  const ids = fotos.flatMap((foto) => objeto(foto) && typeof foto.midiaId === "string" ? [foto.midiaId] : []);
  if (fotos.some((foto) => !objeto(foto) || typeof foto.id === "string" && (!foto.id || foto.id.length > 128) || typeof foto.id !== "string" && foto.id !== undefined
    || typeof foto.midiaId !== "string" || foto.midiaId.length > 128
    || typeof foto.textoAlternativo !== "string" || foto.textoAlternativo.length > 300
    || typeof foto.legenda !== "string" || foto.legenda.length > 2000
    || foto.credito !== null && foto.credito !== undefined && (typeof foto.credito !== "string" || foto.credito.length > 300)
    || foto.dataEditorial !== null && foto.dataEditorial !== undefined && (typeof foto.dataEditorial !== "string" || foto.dataEditorial.length > 50 || Boolean(foto.dataEditorial) && Number.isNaN(Date.parse(foto.dataEditorial))))) {
    return NextResponse.json({ error: "Foto da galeria inválida" }, { status: 400 });
  }
  if (new Set(ids).size !== ids.length) return NextResponse.json({ error: "A mesma mídia não pode ser repetida na galeria" }, { status: 400 });
  const idsFotos = fotos.flatMap((foto) => objeto(foto) && typeof foto.id === "string" ? [foto.id] : []);
  if (new Set(idsFotos).size !== idsFotos.length) return NextResponse.json({ error: "A mesma foto aparece mais de uma vez na galeria" }, { status: 400 });
  if (idsFotos.length) {
    const galeriaExistente = await prisma.galeria.findUnique({ where: { chaveOrigem: "galeria:projetos" }, select: { id: true } });
    const fotosExistentes = galeriaExistente ? await prisma.fotoGaleria.findMany({ where: { galeriaId: galeriaExistente.id }, select: { id: true } }) : [];
    const idsExistentes = new Set(fotosExistentes.map((foto) => foto.id));
    if (idsFotos.some((id) => !idsExistentes.has(id))) return NextResponse.json({ error: "Uma foto enviada não pertence à galeria de projetos" }, { status: 400 });
  }
  const selecoes = [pagina.fundo, ...fotos.map((foto) => ({ midiaId: objeto(foto) ? foto.midiaId : null }))];
  if (selecoes.some((item) => !validarSelecao(item))) return NextResponse.json({ error: "Referência de mídia inválida" }, { status: 400 });
  const mediaIds = [...new Set(selecoes.flatMap((item) => objeto(item) && typeof item.midiaId === "string" ? [item.midiaId] : []))];
  if (mediaIds.length && await prisma.midia.count({ where: { id: { in: mediaIds } } }) !== mediaIds.length) {
    return NextResponse.json({ error: "Mídia não encontrada" }, { status: 400 });
  }

  const dadosPagina = {
    introducao: pagina.introducao,
    tituloTrajetoria: pagina.tituloTrajetoria,
    fundo: { midiaId: typeof pagina.fundo.midiaId === "string" ? pagina.fundo.midiaId : null, origem: typeof pagina.fundo.origem === "string" ? pagina.fundo.origem : null, alt: typeof pagina.fundo.alt === "string" ? pagina.fundo.alt : "" },
  };
  try {
    await prisma.$transaction(async (tx) => {
      await tx.configuracaoSite.upsert({
        where: { chave: "projetos:pagina" },
        create: { chave: "projetos:pagina", versao: 1, dados: dadosPagina },
        update: { dados: dadosPagina, versao: { increment: 1 } },
      });
      const galeria = await tx.galeria.upsert({
        where: { chaveOrigem: "galeria:projetos" },
        create: { chaveOrigem: "galeria:projetos", titulo: "Galeria de projetos" },
        update: {},
        select: { id: true },
      });
      const existentes = await tx.fotoGaleria.findMany({ where: { galeriaId: galeria.id }, select: { id: true, chaveOrigem: true } });
      const existentesPorId = new Map(existentes.map((foto) => [foto.id, foto]));
      for (const foto of fotos as Record<string, unknown>[]) {
        if (typeof foto.id === "string" && !existentesPorId.has(foto.id)) throw new Error("Foto fora da galeria de projetos");
      }
      await tx.fotoGaleria.deleteMany({ where: { galeriaId: galeria.id } });
      if (fotos.length) {
        await tx.fotoGaleria.createMany({ data: (fotos as Record<string, unknown>[]).map((foto, ordem) => {
          const existente = typeof foto.id === "string" ? existentesPorId.get(foto.id) : null;
          return {
            ...(existente ? { id: existente.id, chaveOrigem: existente.chaveOrigem } : { chaveOrigem: `admin:galeria:projetos:${randomUUID()}` }),
            galeriaId: galeria.id,
            midiaId: foto.midiaId as string,
            ordem,
            textoAlternativo: foto.textoAlternativo as string,
            legenda: foto.legenda as string,
            credito: typeof foto.credito === "string" && foto.credito ? foto.credito : null,
            dataEditorial: typeof foto.dataEditorial === "string" && foto.dataEditorial ? foto.dataEditorial : null,
          };
        }) });
      }
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a página e a galeria de projetos" }, { status: 500 });
  }
  revalidatePath("/projetos");
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true });
}
