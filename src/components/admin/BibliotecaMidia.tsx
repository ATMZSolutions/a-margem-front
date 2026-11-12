"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, Modal } from "antd";
import { ExternalLink, Pencil, RefreshCw, Sparkles } from "lucide-react";
import ModalAdmin from "./ModalAdmin";
import CampoAdmin from "./CampoAdmin";

type Referencia = {
  chave: string;
  area: string;
  registro: string;
  campo: string;
  textoAlternativo: string | null;
  legenda: string | null;
  credito: string | null;
};

type Midia = {
  id: string;
  url: string;
  mime: string;
  bytes: number;
  largura: number | null;
  altura: number | null;
  nomeOriginal: string | null;
  criadoEm: string;
  semVinculoDesde: string | null;
  usos: Referencia[];
  quantidadeUsos: number;
  semVinculosDetectados: boolean;
};

type Filtro = "todas" | "vinculadas" | "sem-vinculo";

const CAMPO = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";
const NOMES_AREAS: Record<string, string> = {
  agenda: "Agenda",
  contatos: "Contatos",
  configuracoes: "Configurações",
  editorialTransversal: "Publicação",
  integrantes: "Integrantes",
  espetaculos: "Espetáculos",
  premios: "Prêmios",
  noticias: "Notícias",
  livros: "Livros",
  projetos: "Projetos",
  sobre: "História",
  paginaProjetos: "Galeria de projetos",
};

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function abrirArea(area: string) {
  window.dispatchEvent(new CustomEvent("amargem:admin-area", { detail: area }));
}

export default function BibliotecaMidia() {
  const [modal, contextHolder] = Modal.useModal();
  const [midias, setMidias] = useState<Midia[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [reconciliando, setReconciliando] = useState(false);

  // Estado de edição de nome
  const [midiaEmEdicao, setMidiaEmEdicao] = useState<Midia | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/admin/midias", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar a biblioteca de imagens.");
      setMidias(await resposta.json() as Midia[]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as imagens.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return midias.filter((midia) => {
      if (filtro === "vinculadas" && midia.semVinculosDetectados) return false;
      if (filtro === "sem-vinculo" && !midia.semVinculosDetectados) return false;
      if (!termo) return true;
      const texto = [midia.nomeOriginal, midia.id, ...midia.usos.flatMap((uso) => [uso.registro, uso.campo, uso.textoAlternativo, uso.legenda, uso.credito])]
        .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return texto.includes(termo);
    });
  }, [busca, filtro, midias]);

  function abrirEdicaoNome(midia: Midia) {
    setMidiaEmEdicao(midia);
    setNovoNome(midia.nomeOriginal ?? "");
    setErroEdicao("");
  }

  async function salvarNomeMidia() {
    if (!midiaEmEdicao) return;
    setSalvandoNome(true);
    setErroEdicao("");
    try {
      const res = await fetch("/api/admin/midias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: midiaEmEdicao.id, nomeOriginal: novoNome }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Não foi possível atualizar o nome da imagem.");
      }
      const data = await res.json() as { id: string; nomeOriginal: string | null };
      setMidias((anteriores) =>
        anteriores.map((item) =>
          item.id === data.id ? { ...item, nomeOriginal: data.nomeOriginal } : item
        )
      );
      setAviso("Nome da imagem atualizado com sucesso.");
      setMidiaEmEdicao(null);
    } catch (err) {
      setErroEdicao(err instanceof Error ? err.message : "Erro ao salvar nome da imagem.");
    } finally {
      setSalvandoNome(false);
    }
  }

  function confirmarReconciliar() {
    modal.confirm({
      title: "Reconciliar referências e Storage",
      content: "A reconciliação valida todas as mídias no banco de dados contra os arquivos no Storage e confere integridade. Deseja continuar?",
      okText: "Sim, reconciliar",
      cancelText: "Cancelar",
      onOk: async () => {
        setReconciliando(true);
        setErro("");
        setAviso("");
        try {
          const resposta = await fetch("/api/admin/midias/reconciliar", { method: "POST", credentials: "include" });
          const resultado = await resposta.json().catch(() => null) as { error?: string; marcadas?: number; mantidas?: number; corrigidas?: number; armazenamento?: number; ausentes?: number; divergentes?: number } | null;
          if (!resposta.ok) throw new Error(resultado?.error ?? "Não foi possível reconciliar referências e Storage.");
          setAviso(`Reconciliação concluída: ${resultado?.marcadas ?? 0} novas retenções, ${resultado?.mantidas ?? 0} mantidas, ${resultado?.corrigidas ?? 0} corrigidas, ${resultado?.armazenamento ?? 0} objetos conferidos, ${resultado?.ausentes ?? 0} ausentes e ${resultado?.divergentes ?? 0} divergentes.`);
          await carregar();
        } catch (error) {
          setErro(error instanceof Error ? error.message : "Não foi possível reconciliar referências e Storage.");
        } finally {
          setReconciliando(false);
        }
      },
    });
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            defaultBg: "#ffffff",
            defaultBorderColor: "#cbd5e1",
            defaultHoverBg: "#f8fafc",
            defaultHoverBorderColor: "#94a3b8",
            defaultHoverColor: "#0f172a",
            defaultColor: "#334155",
            colorPrimary: "#F38901",
            colorPrimaryHover: "#FECA55",
            colorTextLightSolid: "#241c26",
          },
          Input: {
            colorText: "#0f172a",
            colorTextPlaceholder: "#64748b",
          },
        },
      }}
    >
      {contextHolder}
      <section className="mx-auto w-full min-w-0 max-w-6xl space-y-4" aria-labelledby="biblioteca-midia-titulo">
        <header className="flex w-full min-w-0 max-w-full flex-col gap-4 rounded-xl border border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 2xl:p-4">
          <div className="min-w-0 flex-1 border-l-4 border-[#F38901] pl-4">
            <h1 id="biblioteca-midia-titulo" className="break-words text-lg font-bold text-[#19121d] sm:text-xl">
              Biblioteca de imagens
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              Consulte imagens do Storage, edite seus nomes e confira os conteúdos onde cada arquivo é usado.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {midias.length} {midias.length === 1 ? "arquivo" : "arquivos"} no catálogo · {midias.filter((midia) => midia.semVinculosDetectados).length} sem vínculo detectado
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="default"
              onClick={() => void carregar()}
              loading={carregando}
              disabled={reconciliando}
              icon={<RefreshCw className="size-4" aria-hidden="true" />}
              className="min-h-11 2xl:min-h-10"
            >
              {carregando ? "Atualizando…" : "Atualizar lista"}
            </Button>
            <Button
              type="primary"
              onClick={confirmarReconciliar}
              loading={reconciliando}
              disabled={carregando}
              icon={<Sparkles className="size-4" aria-hidden="true" />}
              className="min-h-11 font-semibold 2xl:min-h-10"
            >
              {reconciliando ? "Conferindo…" : "Reconciliar Storage"}
            </Button>
          </div>
        </header>

        {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
        {aviso && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

        <div className="grid w-full min-w-0 max-w-full gap-3 rounded-xl border border-slate-300 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Buscar imagem ou referência
            <input className={CAMPO} type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome do arquivo, página ou texto alternativo" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Exibir
            <select className={CAMPO} value={filtro} onChange={(event) => setFiltro(event.target.value as Filtro)}>
              <option value="todas">Todas as imagens</option>
              <option value="vinculadas">Com vínculo</option>
              <option value="sem-vinculo">Sem vínculo detectado</option>
            </select>
          </label>
        </div>

        {carregando ? (
          <p role="status" className="rounded-xl border border-slate-300 bg-white p-5 text-slate-600">Carregando imagens…</p>
        ) : visiveis.length === 0 ? (
          <p className="rounded-xl border border-slate-300 bg-white p-5 text-slate-600">Nenhuma imagem corresponde a este filtro.</p>
        ) : (
          <ul className="grid w-full min-w-0 max-w-full gap-4 md:grid-cols-2">
            {visiveis.map((midia) => (
              <li key={midia.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[144px_minmax(0,1fr)] sm:p-5">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                    <Image src={midia.url} alt={midia.nomeOriginal ? `Prévia: ${midia.nomeOriginal}` : "Prévia da imagem"} fill unoptimized sizes="144px" className="object-contain" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="break-words font-semibold text-slate-900">{midia.nomeOriginal || "Arquivo sem nome"}</h2>
                      <Button
                        size="small"
                        icon={<Pencil className="size-3.5" aria-hidden="true" />}
                        onClick={() => abrirEdicaoNome(midia)}
                        className="shrink-0 text-xs"
                      >
                        Editar nome
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600">{midia.mime} · {formatarTamanho(midia.bytes)}</p>
                    {midia.largura && midia.altura && <p className="text-sm text-slate-600">{midia.largura} × {midia.altura} px</p>}
                    <p className="break-all font-mono text-xs text-slate-500">ID {midia.id}</p>
                    <p className="text-xs text-slate-500">Adicionada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(midia.criadoEm))}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
                  {midia.semVinculosDetectados ? (
                    <div className="space-y-2">
                      <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Sem vínculo detectado</p>
                      <p className="text-sm leading-5 text-slate-600">Candidata a órfã. O arquivo permanece no Storage; confirme referências e retenção antes de qualquer limpeza.</p>
                      <p className="text-sm leading-5 text-slate-600">
                        {midia.semVinculoDesde
                          ? `Retenção iniciada em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(midia.semVinculoDesde))}. O prazo mínimo é de 30 dias.`
                          : "Ainda não reconciliada: a retenção começa após confirmar referências e objetos no Storage."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-slate-800">Usada em {midia.quantidadeUsos} {midia.quantidadeUsos === 1 ? "lugar" : "lugares"}</h3>
                      <ul className="mt-2 space-y-2">
                        {midia.usos.map((uso) => (
                          <li key={uso.chave} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium text-slate-800">{NOMES_AREAS[uso.area] ?? uso.area} · {uso.registro}</p>
                              <p className="text-xs text-slate-600">
                                {uso.campo}
                                {uso.textoAlternativo ? ` · alt: ${uso.textoAlternativo}` : ""}
                                {uso.legenda ? ` · ${uso.legenda}` : ""}
                                {uso.credito ? ` · crédito: ${uso.credito}` : ""}
                              </p>
                            </div>
                            <Button
                              size="small"
                              onClick={() => abrirArea(uso.area)}
                              icon={<ExternalLink className="size-3.5" aria-hidden="true" />}
                              className="shrink-0 self-start sm:self-auto"
                            >
                              Abrir editor
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal de Edição de Nome da Imagem */}
      <ModalAdmin
        aberto={Boolean(midiaEmEdicao)}
        aoFechar={() => setMidiaEmEdicao(null)}
        titulo="Editar nome da imagem"
        descricao="Defina um nome descritivo para facilitar a identificação nos seletores e na biblioteca."
        larguraMaxima="max-w-xl"
      >
        {midiaEmEdicao && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void salvarNomeMidia();
            }}
            className="space-y-4"
          >
            {erroEdicao && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erroEdicao}</p>}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-slate-200">
                <Image src={midiaEmEdicao.url} alt="Prévia" fill unoptimized className="object-contain" />
              </div>
              <div className="min-w-0 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{midiaEmEdicao.mime} · {formatarTamanho(midiaEmEdicao.bytes)}</p>
                {midiaEmEdicao.largura && midiaEmEdicao.altura && <p>{midiaEmEdicao.largura} × {midiaEmEdicao.altura} px</p>}
                <p className="truncate font-mono text-slate-500">ID: {midiaEmEdicao.id}</p>
              </div>
            </div>

            <CampoAdmin
              label="Nome da imagem / arquivo"
              maxLen={255}
              proibirHtml
              value={novoNome}
              onChange={setNovoNome}
              placeholder="Ex: Foto do espetáculo, Cartaz oficial..."
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button onClick={() => setMidiaEmEdicao(null)} disabled={salvandoNome} className="min-h-11">
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={salvandoNome} className="min-h-11 px-5 font-semibold">
                Salvar nome
              </Button>
            </div>
          </form>
        )}
      </ModalAdmin>
    </ConfigProvider>
  );
}
