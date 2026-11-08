import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { getPublicTransversalSettings, type TransversalSettings } from "@/lib/siteContent";

const PALETAS = new Set(["margem", "contraste", "terrosa"]);
const FUNDOS = new Set(["nenhum", "padrao1.webp", "padrao2.webp", "exu-bg.svg"]);
const TIPOGRAFIAS = new Set(["sistema", "sedgwick", "zen-dots"]);
const CAMPOS_TEXTO_LONGOS = new Set<keyof TransversalSettings["textos"]>([
  "naoEncontradoMensagem", "agendaVazia", "noticiasVazias", "livrosVazios", "projetosAnoVazio", "livrosComplementoVazio",
  "integrantesVazios", "espetaculosVazios", "premiosVazios",
]);
const CAMPOS_TEXTO_CURTOS = new Set<keyof TransversalSettings["textos"]>([
  "domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado",
]);
const CAMPOS_TEXTO: (keyof TransversalSettings["textos"])[] = [
  "voltar", "fecharPainel", "saibaMais", "mostrarMais", "lerMais", "lerMenos",
  "abrirMenu", "fecharMenu", "voltarTopo", "slideAnterior", "proximoSlide", "detalhes", "carregando",
  "anoAnterior", "doisAnosAntes", "proximoAno", "doisAnosDepois",
  "tituloAgenda", "tituloNoticias", "tituloIndicacoes", "tituloSobre", "tituloProjetos", "tituloColetivo", "tituloIntegrante", "tituloEspetaculos", "tituloPremios",
  "naoEncontradoTitulo", "naoEncontradoMensagem", "agendaVazia", "noticiasVazias", "livrosVazios", "projetosAnoVazio",
  "livrosSubtitulo", "livrosComplementoVazio", "integrantesVazios", "espetaculosVazios", "premiosVazios",
  "mesAnterior", "proximoMes", "domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado",
  "eventoSemCidade", "tituloFichaTecnica", "tituloBiografia",
];

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  return NextResponse.json(await getPublicTransversalSettings());
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  const textos = body?.textos;
  if (!body || typeof body.paleta !== "string" || !PALETAS.has(body.paleta)
    || typeof body.fundo !== "string" || !FUNDOS.has(body.fundo)
    || typeof body.tipografia !== "string" || !TIPOGRAFIAS.has(body.tipografia)
    || !textos || typeof textos !== "object" || Array.isArray(textos)
    || CAMPOS_TEXTO.some((campo) => !isText(
      (textos as Record<string, unknown>)[campo],
      CAMPOS_TEXTO_LONGOS.has(campo) ? 300 : CAMPOS_TEXTO_CURTOS.has(campo) ? 12 : 100,
    ))) {
    return NextResponse.json({ error: "Aparência ou textos fora dos limites permitidos" }, { status: 400 });
  }
  const dados: TransversalSettings = {
    paleta: body.paleta as TransversalSettings["paleta"],
    fundo: body.fundo as TransversalSettings["fundo"],
    tipografia: body.tipografia as TransversalSettings["tipografia"],
    textos: Object.fromEntries(CAMPOS_TEXTO.map((campo) => [campo, String((textos as Record<string, unknown>)[campo]).trim()])) as TransversalSettings["textos"],
  };
  await prisma.configuracaoSite.upsert({
    where: { chave: "site:transversal" },
    create: { chave: "site:transversal", versao: 1, dados },
    update: { dados, versao: { increment: 1 } },
  });
  for (const path of ["/", "/agenda", "/noticias", "/indicacoes", "/projetos", "/sobre", "/coletivo", "/espetaculos", "/premios", "/contato"]) revalidatePath(path);
  return NextResponse.json({ ok: true });
}
