import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { isText, readJsonObject } from "@/lib/adminInput";

type TipoRegistro = "agenda" | "noticias" | "livros" | "projetos" | "sobre" | "integrantes" | "espetaculos" | "premios" | "historia" | "pagina";
type Seo = { titulo?: string; descricao?: string; imagemUrl?: string };
type Estado = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

const ESTADOS = new Set<Estado>(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]);
const TIPOS = new Set<TipoRegistro>(["agenda", "noticias", "livros", "projetos", "sobre", "integrantes", "espetaculos", "premios", "historia", "pagina"]);

function textoSeo(value: unknown, max: number): value is string {
  return value === undefined || value === "" || isText(value, max);
}

function urlImagemValida(value: unknown): value is string {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 1000) return false;
  if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return true;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

function validarSeo(value: unknown): value is Seo | null {
  if (value === null || value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const seo = value as Record<string, unknown>;
  return textoSeo(seo.titulo, 300) && textoSeo(seo.descricao, 1000) && urlImagemValida(seo.imagemUrl);
}

function limparSeo(value: Seo | null | undefined): Seo | null {
  if (!value) return null;
  const seo = {
    ...(value.titulo ? { titulo: value.titulo.trim() } : {}),
    ...(value.descricao ? { descricao: value.descricao.trim() } : {}),
    ...(value.imagemUrl ? { imagemUrl: value.imagemUrl.trim() } : {}),
  };
  return Object.keys(seo).length ? seo : null;
}

function linha(tipo: TipoRegistro, id: string | number, titulo: string, rota: string, estado: Estado, ordem: number, seo: unknown) {
  return { tipo, id: String(id), titulo, rota, estado, ordem, seo: validarSeo(seo) ? limparSeo(seo) : null };
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });

  const [agenda, noticias, livros, projetos, sobre, integrantes, espetaculos, premios, historia, paginas] = await Promise.all([
    prisma.agenda.findMany({ orderBy: [{ ordem: "asc" }, { data: "asc" }], select: { id: true, titulo: true, ordem: true, estado: true, seo: true } }),
    prisma.noticia.findMany({ orderBy: [{ ordem: "asc" }, { createdAt: "desc" }], select: { id: true, titulo: true, ordem: true, estado: true, seo: true } }),
    prisma.book.findMany({ orderBy: [{ ordem: "asc" }, { createdAt: "desc" }], select: { id: true, titulo: true, ordem: true, estado: true, seo: true } }),
    prisma.projeto.findMany({ orderBy: [{ ordem: "asc" }, { data: "desc" }], select: { id: true, descricao: true, ordem: true, estado: true, seo: true } }),
    prisma.sobre.findMany({ orderBy: [{ ordem: "asc" }, { ano: "asc" }], select: { ano: true, descricao: true, ordem: true, estado: true, seo: true } }),
    prisma.integrante.findMany({ orderBy: [{ ordem: "asc" }, { nome: "asc" }], select: { id: true, slug: true, nome: true, ordem: true, estado: true, seo: true } }),
    prisma.espetaculo.findMany({ orderBy: [{ ordem: "asc" }, { lancamento: "desc" }], select: { id: true, slug: true, titulo: true, ordem: true, estado: true, seo: true } }),
    prisma.premio.findMany({ orderBy: [{ ordem: "asc" }, { ano: "desc" }], select: { id: true, slug: true, ano: true, titulo: true, ordem: true, estado: true, seo: true } }),
    prisma.marcoHistorico.findMany({ orderBy: [{ ordem: "asc" }, { ano: "asc" }], select: { id: true, ano: true, descricao: true, ordem: true, estado: true } }),
    prisma.paginaSite.findMany({ orderBy: { caminho: "asc" }, select: { caminho: true, estado: true, seo: true } }),
  ]);

  const registros = [
    ...agenda.map((item) => linha("agenda", item.id, item.titulo, "/agenda", item.estado, item.ordem, item.seo)),
    ...noticias.map((item) => linha("noticias", item.id, item.titulo, "/noticias", item.estado, item.ordem, item.seo)),
    ...livros.map((item) => linha("livros", item.id, item.titulo, "/indicacoes", item.estado, item.ordem, item.seo)),
    ...projetos.map((item) => linha("projetos", item.id, item.descricao.slice(0, 100), "/projetos", item.estado, item.ordem, item.seo)),
    ...(historia.length ? [] : sobre.map((item) => linha("sobre", item.ano, String(item.ano), "/sobre", item.estado, item.ordem, item.seo))),
    ...integrantes.map((item) => linha("integrantes", item.id, item.nome, `/coletivo/integrante/${item.slug}`, item.estado, item.ordem, item.seo)),
    ...espetaculos.map((item) => linha("espetaculos", item.id, item.titulo, `/espetaculos/${item.slug}`, item.estado, item.ordem, item.seo)),
    ...premios.map((item) => linha("premios", item.id, `${item.titulo} (${item.ano})`, `/premios/${item.slug}/${item.ano}`, item.estado, item.ordem, item.seo)),
    ...historia.map((item) => linha("historia", item.id, `${item.ano} — ${item.descricao.slice(0, 90)}`, "/sobre", item.estado, item.ordem, null)),
    ...paginas.map((item) => linha("pagina", item.caminho, item.caminho, item.caminho, item.estado, 0, item.seo)),
  ];
  return NextResponse.json(registros);
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || typeof body.tipo !== "string" || !TIPOS.has(body.tipo as TipoRegistro)
    || typeof body.id !== "string" || !body.id || body.id.length > 300
    || !ESTADOS.has(body.estado as Estado)
    || !Number.isSafeInteger(body.ordem) || (body.ordem as number) < 0 || (body.ordem as number) > 10000
    || !validarSeo(body.seo)) {
    return NextResponse.json({ error: "Dados editoriais inválidos" }, { status: 400 });
  }

  const tipo = body.tipo as TipoRegistro;
  const estado = body.estado as Estado;
  const ordem = body.ordem as number;
  const seoValor = limparSeo(body.seo as Seo | null | undefined);
  const seo = seoValor ? seoValor as Prisma.InputJsonValue : Prisma.DbNull;
  const numericId = /^\d+$/.test(body.id) ? Number(body.id) : NaN;
  if (["agenda", "noticias", "livros", "projetos", "sobre"].includes(tipo) && (!Number.isSafeInteger(numericId) || numericId <= 0)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  try {
    let rota = "/";
    if (tipo === "pagina") {
      if (!body.id.startsWith("/") || body.id.startsWith("//")) return NextResponse.json({ error: "Caminho de página inválido" }, { status: 400 });
      await prisma.paginaSite.update({ where: { caminho: body.id }, data: { estado, seo } });
      rota = body.id;
    } else if (tipo === "agenda") {
      await prisma.agenda.update({ where: { id: numericId }, data: { estado, ordem, seo } }); rota = "/agenda";
    } else if (tipo === "noticias") {
      await prisma.noticia.update({ where: { id: numericId }, data: { estado, ordem, seo } }); rota = "/noticias";
    } else if (tipo === "livros") {
      await prisma.book.update({ where: { id: numericId }, data: { estado, ordem, seo } }); rota = "/indicacoes";
    } else if (tipo === "projetos") {
      await prisma.projeto.update({ where: { id: numericId }, data: { estado, ordem, seo } }); rota = "/projetos";
    } else if (tipo === "sobre") {
      await prisma.sobre.update({ where: { ano: numericId }, data: { estado, ordem, seo } }); rota = "/sobre";
      await prisma.marcoHistorico.updateMany({ where: { anoLegado: numericId }, data: { estado, ordem } });
    } else if (tipo === "integrantes") {
      const item = await prisma.integrante.update({ where: { id: body.id }, data: { estado, ordem, seo }, select: { slug: true } }); rota = `/coletivo/integrante/${item.slug}`;
    } else if (tipo === "espetaculos") {
      const item = await prisma.espetaculo.update({ where: { id: body.id }, data: { estado, ordem, seo }, select: { slug: true } }); rota = `/espetaculos/${item.slug}`;
    } else if (tipo === "premios") {
      const item = await prisma.premio.update({ where: { id: body.id }, data: { estado, ordem, seo }, select: { slug: true, ano: true } }); rota = `/premios/${item.slug}/${item.ano}`;
    } else {
      await prisma.marcoHistorico.update({ where: { id: body.id }, data: { estado, ordem } }); rota = "/sobre";
    }
    revalidatePath(rota);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Registro editorial não encontrado" }, { status: 404 });
  }
}
