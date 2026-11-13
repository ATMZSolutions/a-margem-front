import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { getPublicContactPageSettings } from "@/lib/siteContent";

function urlValida(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 1000) return false;
  if (/^(mailto|tel):[^\s]+$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) {
    return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  }

  const [canais, pagina, midias] = await Promise.all([
    prisma.canalContato.findMany({ orderBy: [{ ordem: "asc" }, { rotulo: "asc" }] }),
    getPublicContactPageSettings(),
    prisma.midia.findMany({
      orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
      select: { id: true, bucket: true, chave: true, mime: true, bytes: true, nomeOriginal: true, origem: true },
    }),
  ]);

  return NextResponse.json({ canais, pagina, midias });
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) {
    return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  }

  const body = await readJsonObject(request);
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

  const tipo = isText(body.tipo, 80) ? body.tipo.trim() : "outro";
  const rotulo = isText(body.rotulo, 300) ? body.rotulo.trim() : "";
  const url = urlValida(body.url) ? body.url.trim() : "";
  const ordem = typeof body.ordem === "number" && Number.isSafeInteger(body.ordem) && body.ordem >= 0 ? body.ordem : 0;
  const ativo = typeof body.ativo === "boolean" ? body.ativo : true;

  if (!rotulo || !url) {
    return NextResponse.json({ error: "Rótulo e URL são obrigatórios para o canal" }, { status: 400 });
  }

  try {
    const canal = await prisma.canalContato.create({
      data: {
        chaveOrigem: `admin:contato:${randomUUID()}`,
        tipo,
        rotulo,
        url,
        ordem,
        ativo,
      },
    });

    revalidatePath("/contato");
    revalidatePath("/");
    return NextResponse.json(canal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar o canal de contato" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) {
    return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  }

  const body = await readJsonObject(request);
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

  // Caso 1: Atualização de configurações da página de contato
  if (body.pagina && typeof body.pagina === "object") {
    const paginaRaw = body.pagina as Record<string, unknown>;
    const titulo = isText(paginaRaw.titulo, 200) ? paginaRaw.titulo.trim() : "Entre em contato";
    const fundoRaw = (paginaRaw.fundo && typeof paginaRaw.fundo === "object") ? paginaRaw.fundo as Record<string, unknown> : {};
    const logoRaw = (paginaRaw.logo && typeof paginaRaw.logo === "object") ? paginaRaw.logo as Record<string, unknown> : {};

    const fundo = {
      midiaId: typeof fundoRaw.midiaId === "string" && fundoRaw.midiaId ? fundoRaw.midiaId : null,
      origem: typeof fundoRaw.origem === "string" ? fundoRaw.origem : null,
      alt: typeof fundoRaw.alt === "string" ? fundoRaw.alt : "",
    };

    const logo = {
      midiaId: typeof logoRaw.midiaId === "string" && logoRaw.midiaId ? logoRaw.midiaId : null,
      origem: typeof logoRaw.origem === "string" ? logoRaw.origem : null,
      alt: typeof logoRaw.alt === "string" ? logoRaw.alt : "",
    };

    try {
      await prisma.configuracaoSite.upsert({
        where: { chave: "contato:pagina" },
        create: {
          chave: "contato:pagina",
          versao: 1,
          dados: { titulo, fundo, logo },
        },
        update: {
          dados: { titulo, fundo, logo },
          versao: { increment: 1 },
        },
      });

      revalidatePath("/contato");
      revalidatePath("/");
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Não foi possível salvar as configurações da página" }, { status: 500 });
    }
  }

  // Caso 2: Atualização de um canal de contato individual
  if (body.id && typeof body.id === "string") {
    const id = body.id;
    const tipo = isText(body.tipo, 80) ? body.tipo.trim() : "outro";
    const rotulo = isText(body.rotulo, 300) ? body.rotulo.trim() : "";
    const url = urlValida(body.url) ? body.url.trim() : "";
    const ordem = typeof body.ordem === "number" && Number.isSafeInteger(body.ordem) && body.ordem >= 0 ? body.ordem : 0;
    const ativo = typeof body.ativo === "boolean" ? body.ativo : true;

    if (!rotulo || !url) {
      return NextResponse.json({ error: "Rótulo e URL são obrigatórios para o canal" }, { status: 400 });
    }

    try {
      const atualizado = await prisma.canalContato.update({
        where: { id },
        data: { tipo, rotulo, url, ordem, ativo },
      });

      revalidatePath("/contato");
      revalidatePath("/");
      return NextResponse.json(atualizado);
    } catch {
      return NextResponse.json({ error: "Não foi possível atualizar o canal de contato" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Dados insuficientes para atualização" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) {
    return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    await prisma.canalContato.delete({ where: { id } });
    revalidatePath("/contato");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir o canal" }, { status: 500 });
  }
}

