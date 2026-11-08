import { NextResponse } from "next/server";
import { GET as listarMidias } from "../route";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { getRuntimeStorage } from "@/lib/storageRuntime";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";

const DIAS_RETENCAO = 30;

type ItemInventario = {
  id: string;
  semVinculosDetectados: boolean;
};

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });

  try {
    const urlInventario = new URL(request.url);
    urlInventario.pathname = urlInventario.pathname.replace(/\/reconciliar\/?$/, "");
    const respostaInventario = await listarMidias(new Request(urlInventario, { headers: request.headers }));
    if (!respostaInventario.ok) return NextResponse.json({ error: "Não foi possível conferir as referências atuais." }, { status: 502 });

    const inventario = await respostaInventario.json() as ItemInventario[];
    const idsCandidatos = inventario.filter((item) => item.semVinculosDetectados).map((item) => item.id);
    const idsReferenciados = inventario.filter((item) => !item.semVinculosDetectados).map((item) => item.id);
    const linhas = await prisma.midia.findMany({
      where: { id: { in: inventario.map((item) => item.id) } },
      select: { id: true, bucket: true, chave: true, sha256: true, bytes: true, semVinculoDesde: true },
    });
    const linhaPorId = new Map(linhas.map((item) => [item.id, item]));
    const runtime = idsCandidatos.length ? getRuntimeStorage() : null;
    if (idsCandidatos.length && !runtime) {
      return NextResponse.json({ error: "Storage não está configurado para conferir os candidatos." }, { status: 503 });
    }

    const verificacoes = new Map<string, "valido" | "ausente" | "divergente">();
    if (runtime) {
      await runtime.storage.conferirOuCriarBucket(runtime.bucketConfig, { allowCreate: false });
      for (const id of idsCandidatos) {
        const item = linhaPorId.get(id);
        if (!item) continue;
        if (item.bucket !== runtime.bucketConfig.bucket) {
          verificacoes.set(id, "divergente");
          continue;
        }
        const resultado = await runtime.storage.conferirObjeto(item.bucket, item.chave, { bytes: item.bytes, sha256: item.sha256 });
        verificacoes.set(id, resultado.valido ? "valido" : resultado.existe ? "divergente" : "ausente");
      }
    }

    const agora = new Date();
    let marcadas = 0;
    let mantidas = 0;
    let corrigidas = 0;
    let armazenamento = 0;
    let ausentes = 0;
    let divergentes = 0;

    await prisma.$transaction(async (tx) => {
      if (idsReferenciados.length) {
        const limpas = await tx.midia.updateMany({
          where: { id: { in: idsReferenciados }, semVinculoDesde: { not: null } },
          data: { semVinculoDesde: null },
        });
        corrigidas += limpas.count;
      }

      for (const id of idsCandidatos) {
        const item = linhaPorId.get(id);
        if (!item) continue;
        const verificacao = verificacoes.get(id);
        if (verificacao !== "valido") {
          if (verificacao === "ausente") ausentes++;
          else divergentes++;
          if (item.semVinculoDesde) {
            const limpa = await tx.midia.updateMany({ where: { id, semVinculoDesde: { not: null } }, data: { semVinculoDesde: null } });
            corrigidas += limpa.count;
          }
          continue;
        }

        armazenamento++;
        if (item.semVinculoDesde) {
          mantidas++;
          continue;
        }

        const atualizada = await tx.midia.updateMany({
          where: {
            id,
            semVinculoDesde: null,
            usos: { none: {} },
            integrantes: { none: {} },
            espetaculos: { none: {} },
            premios: { none: {} },
            fotos: { none: {} },
          },
          data: { semVinculoDesde: agora },
        });
        if (atualizada.count) marcadas++;
      }
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ ok: true, diasRetencao: DIAS_RETENCAO, marcadas, mantidas, corrigidas, armazenamento, ausentes, divergentes });
  } catch {
    return NextResponse.json({ error: "Não foi possível reconciliar referências e Storage." }, { status: 502 });
  }
}
