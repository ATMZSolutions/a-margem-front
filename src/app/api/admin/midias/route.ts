import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { decodeImageData, isText, readJsonObject } from "@/lib/adminInput";
import { getRuntimeStorage } from "@/lib/storageRuntime";
import { urlPublicaDaMidia } from "@/lib/publicContent";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import {
  getPublicContactPageSettings,
  getPublicHomeSettings,
  getPublicProjectPageSettings,
  getPublicSiteIdentity,
} from "@/lib/siteContent";

const EXTENSAO_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ReferenciaMidia = {
  chave: string;
  area: string;
  registro: string;
  campo: string;
  textoAlternativo: string | null;
  legenda: string | null;
  credito: string | null;
};

function areaDaReferencia(dominio: string, area?: string, registro?: string): string {
  if (area) return area;
  if (dominio === "Integrante") return "integrantes";
  if (dominio === "Espetaculo") return "espetaculos";
  if (dominio === "Premio") return "premios";
  if (dominio === "MarcoHistorico") return "sobre";
  if (dominio === "Agenda") return "agenda";
  if (dominio === "Noticia") return "noticias";
  if (dominio === "Livro") return "livros";
  if (dominio === "Projeto") return "projetos";
  if (dominio === "Sobre") return "sobre";
  if (dominio === "Galeria") return "paginaProjetos";
  if (dominio === "ConfiguracaoSite" || dominio === "SecaoHome") return "configuracoes";
  if (dominio === "PaginaSite") return registro === "/projetos" ? "paginaProjetos" : "editorialTransversal";
  return "editorialTransversal";
}

function coletarReferenciasJson(
  value: unknown,
  mediaIds: Set<string>,
  mediaIdsPorOrigem: Map<string, string[]>,
  adicionar: (midiaId: string, referencia: ReferenciaMidia) => void,
  dominio: string,
  registro: string,
  caminho = "",
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => coletarReferenciasJson(item, mediaIds, mediaIdsPorOrigem, adicionar, dominio, registro, `${caminho}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  const item = value as Record<string, unknown>;
  const porId = typeof item.midiaId === "string" && mediaIds.has(item.midiaId) ? [item.midiaId] : [];
  const porOrigem = !porId.length && typeof item.origem === "string" ? mediaIdsPorOrigem.get(item.origem) ?? [] : [];
  for (const midiaId of [...porId, ...porOrigem]) {
    adicionar(midiaId, {
      chave: `${dominio}:${registro}:${caminho}:${porId.length ? "midiaId" : "origem"}`,
      area: areaDaReferencia(dominio, undefined, registro),
      registro,
      campo: caminho || "mídia",
      textoAlternativo: typeof item.alt === "string" ? item.alt : null,
      legenda: null,
      credito: null,
    });
  }
  for (const [chave, filho] of Object.entries(item)) {
    if (chave === "midiaId" || chave === "origem") continue;
    const proximo = caminho ? `${caminho}.${chave}` : chave;
    coletarReferenciasJson(filho, mediaIds, mediaIdsPorOrigem, adicionar, dominio, registro, proximo);
  }
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const [items, configuracoes, paginas, secoesHome, identidade, home, contatoPagina, projetosPagina, marcosHistoricos] = await Promise.all([
    prisma.midia.findMany({
      orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
      select: {
        id: true, bucket: true, chave: true, mime: true, bytes: true, largura: true, altura: true,
        nomeOriginal: true, origem: true, criadoEm: true, semVinculoDesde: true,
        usos: { select: { id: true, dominio: true, registro: true, campo: true, textoAlternativo: true, legenda: true, credito: true } },
        integrantes: { select: { slug: true, nome: true } },
        espetaculos: { select: { slug: true, titulo: true } },
        premios: { select: { slug: true, titulo: true, ano: true } },
        fotos: { select: { id: true, ordem: true, textoAlternativo: true, legenda: true, credito: true, galeria: { select: { titulo: true, espetaculoId: true, espetaculo: { select: { titulo: true } } } } } },
      },
    }),
    prisma.configuracaoSite.findMany({ select: { chave: true, dados: true } }),
    prisma.paginaSite.findMany({ select: { caminho: true, configuracao: true } }),
    prisma.secaoHome.findMany({ select: { chave: true, configuracao: true } }),
    getPublicSiteIdentity(),
    getPublicHomeSettings(),
    getPublicContactPageSettings(),
    getPublicProjectPageSettings(),
    prisma.marcoHistorico.findMany({ select: { id: true, ano: true } }),
  ]);

  const anoPorMarcoId = new Map(marcosHistoricos.map((marco) => [marco.id, marco.ano]));
  const mediaIds = new Set(items.map((item) => item.id));
  const mediaIdsPorOrigem = new Map<string, string[]>();
  for (const item of items) {
    if (!item.origem) continue;
    const ids = mediaIdsPorOrigem.get(item.origem) ?? [];
    ids.push(item.id);
    mediaIdsPorOrigem.set(item.origem, ids);
  }
  const referenciasPorMidia = new Map<string, Map<string, ReferenciaMidia>>(
    items.map((item) => [item.id, new Map<string, ReferenciaMidia>()]),
  );
  const adicionar = (midiaId: string, referencia: ReferenciaMidia) => {
    const referencias = referenciasPorMidia.get(midiaId);
    if (referencias && !referencias.has(referencia.chave)) referencias.set(referencia.chave, referencia);
  };

  for (const item of items) {
    for (const uso of item.usos) {
      const area = areaDaReferencia(uso.dominio);
      const registro = uso.dominio === "MarcoHistorico"
        ? String(anoPorMarcoId.get(uso.registro) ?? "Marco histórico")
        : uso.dominio === "Sobre" ? `${uso.registro} (legado)` : uso.registro;
      adicionar(item.id, {
        chave: `${uso.dominio}:${uso.registro}:${uso.campo}`,
        area,
        registro,
        campo: uso.campo,
        textoAlternativo: uso.textoAlternativo,
        legenda: uso.legenda,
        credito: uso.credito,
      });
    }
    for (const integrante of item.integrantes) adicionar(item.id, {
      chave: `Integrante:${integrante.slug}:foto`, area: "integrantes", registro: integrante.nome, campo: "foto", textoAlternativo: null, legenda: null, credito: null,
    });
    for (const espetaculo of item.espetaculos) adicionar(item.id, {
      chave: `Espetaculo:${espetaculo.slug}:capa`, area: "espetaculos", registro: espetaculo.titulo, campo: "capa", textoAlternativo: null, legenda: null, credito: null,
    });
    for (const premio of item.premios) adicionar(item.id, {
      chave: `Premio:${premio.slug}/${premio.ano}:foto`, area: "premios", registro: `${premio.titulo} (${premio.ano})`, campo: "foto", textoAlternativo: null, legenda: null, credito: null,
    });
    for (const foto of item.fotos) {
      const registro = foto.galeria.espetaculo?.titulo ?? foto.galeria.titulo ?? "Página de projetos";
      adicionar(item.id, {
        chave: `Galeria:${foto.id}`, area: foto.galeria.espetaculoId ? "espetaculos" : "paginaProjetos",
        registro, campo: `foto ${foto.ordem + 1}`, textoAlternativo: foto.textoAlternativo, legenda: foto.legenda, credito: foto.credito,
      });
    }
  }

  for (const configuracao of configuracoes) coletarReferenciasJson(configuracao.dados, mediaIds, mediaIdsPorOrigem, adicionar, "ConfiguracaoSite", configuracao.chave);
  for (const pagina of paginas) coletarReferenciasJson(pagina.configuracao, mediaIds, mediaIdsPorOrigem, adicionar, "PaginaSite", pagina.caminho);
  for (const secao of secoesHome) coletarReferenciasJson(secao.configuracao, mediaIds, mediaIdsPorOrigem, adicionar, "SecaoHome", secao.chave);
  coletarReferenciasJson(identidade, mediaIds, mediaIdsPorOrigem, adicionar, "ConfiguracaoSite", "Identidade do site");
  coletarReferenciasJson(home, mediaIds, mediaIdsPorOrigem, adicionar, "ConfiguracaoSite", "Página inicial");
  coletarReferenciasJson(contatoPagina, mediaIds, mediaIdsPorOrigem, adicionar, "ConfiguracaoSite", "Página de contato");
  coletarReferenciasJson(projetosPagina, mediaIds, mediaIdsPorOrigem, adicionar, "ConfiguracaoSite", "Página de projetos");

  return NextResponse.json(items.map((item) => {
    const usos = [...(referenciasPorMidia.get(item.id)?.values() ?? [])];
    return {
      id: item.id,
      url: urlPublicaDaMidia(item) ?? "/padrao2.webp",
      mime: item.mime,
      bytes: item.bytes,
      largura: item.largura,
      altura: item.altura,
      nomeOriginal: item.nomeOriginal,
      criadoEm: item.criadoEm,
      semVinculoDesde: item.semVinculoDesde,
      usos,
      quantidadeUsos: usos.length,
      semVinculosDetectados: usos.length === 0,
    };
  }));
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || !isText(body.imageData, 7_100_000) || !isText(body.imagemTipo, 50)) {
    return NextResponse.json({ error: "Dados de imagem inválidos" }, { status: 400 });
  }
  const payload = decodeImageData(body.imageData, body.imagemTipo);
  const extensao = EXTENSAO_POR_MIME[body.imagemTipo];
  const runtime = getRuntimeStorage();
  if (!payload || !extensao || !runtime) {
    return NextResponse.json({ error: "Storage ou formato de imagem indisponível" }, { status: 503 });
  }

  try {
    const metadata = await sharp(payload, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
      return NextResponse.json({ error: "Imagem inválida" }, { status: 415 });
    }

    await runtime.storage.conferirOuCriarBucket(runtime.bucketConfig, { allowCreate: false });
    const sha256 = createHash("sha256").update(payload).digest("hex");
    const chave = `originais/${sha256}.${extensao}`;
    const objeto = {
      bucket: runtime.bucketConfig.bucket,
      chave,
      sha256,
      mime: body.imagemTipo,
      bytes: payload.length,
      payload,
    };
    await runtime.storage.enviarEVerificar(objeto);

    const existente = await prisma.midia.findUnique({ where: { bucket_chave: { bucket: objeto.bucket, chave } } });
    if (existente) {
      if (existente.sha256 !== sha256) return NextResponse.json({ error: "Conflito de hash da mídia" }, { status: 409 });
      return NextResponse.json({ id: existente.id, url: urlPublicaDaMidia(existente), mime: existente.mime, bytes: existente.bytes });
    }

    const nomeOriginal = typeof body.nomeOriginal === "string" ? body.nomeOriginal.trim().slice(0, 255) : "";
    const criada = await prisma.midia.create({
      data: {
        bucket: objeto.bucket,
        chave,
        sha256,
        mime: objeto.mime,
        bytes: objeto.bytes,
        largura: metadata.width,
        altura: metadata.height,
        nomeOriginal: nomeOriginal || null,
        origem: "upload-admin",
      },
    });
    return NextResponse.json({ id: criada.id, url: urlPublicaDaMidia(criada), mime: criada.mime, bytes: criada.bytes }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível armazenar a imagem" }, { status: 502 });
  }
}
