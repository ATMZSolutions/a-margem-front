"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, ConfigProvider, Input, Modal, Tag } from "antd";
import { Instagram, Mail, Pencil, Phone, Plus, Settings2, Share2, Trash2 } from "lucide-react";
import { TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons";
import ModalAdmin from "./ModalAdmin";
import EstadoLista from "./EstadoLista";
import CampoAdmin from "./CampoAdmin";

type Midia = {
  id: string;
  url: string;
  mime: string;
  bytes: number;
  nomeOriginal: string | null;
};

type Selecao = {
  midiaId: string | null;
  origem: string | null;
  url: string | null;
  alt: string;
};

type CanalContato = {
  id: string;
  chaveOrigem?: string;
  tipo: string;
  rotulo: string;
  url: string;
  ordem: number;
  ativo: boolean;
};

type PaginaContato = {
  titulo: string;
  fundo: Selecao;
  logo: Selecao;
};

const CAMPO = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";
const CLASSE_LABEL = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

const TIPOS_CANAL = [
  { valor: "whatsapp", rotulo: "WhatsApp" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "email", rotulo: "E-mail" },
  { valor: "telefone", rotulo: "Telefone" },
  { valor: "tiktok", rotulo: "TikTok" },
  { valor: "outro", rotulo: "Outro link" },
];

function IconeTipo({ tipo }: { tipo: string }) {
  switch (tipo.toLowerCase()) {
    case "whatsapp":
      return <WhatsAppOutlined className="text-emerald-600 text-lg" />;
    case "instagram":
      return <Instagram className="size-5 text-pink-600" aria-hidden="true" />;
    case "email":
      return <Mail className="size-5 text-indigo-600" aria-hidden="true" />;
    case "telefone":
      return <Phone className="size-5 text-blue-600" aria-hidden="true" />;
    case "tiktok":
      return <TikTokOutlined className="text-slate-900 text-lg" />;
    default:
      return <Share2 className="size-5 text-slate-600" aria-hidden="true" />;
  }
}

export default function AdminContatos() {
  const [modal, contextHolder] = Modal.useModal();
  const [canais, setCanais] = useState<CanalContato[]>([]);
  const [pagina, setPagina] = useState<PaginaContato>({
    titulo: "Entre em contato",
    fundo: { midiaId: null, origem: null, url: null, alt: "" },
    logo: { midiaId: null, origem: null, url: null, alt: "" },
  });
  const [midias, setMidias] = useState<Midia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [busca, setBusca] = useState("");

  // Modal de canal (criar / editar)
  const [modalCanalAberto, setModalCanalAberto] = useState(false);
  const [canalEmEdicao, setCanalEmEdicao] = useState<CanalContato | null>(null);
  const [formTipo, setFormTipo] = useState("whatsapp");
  const [formRotulo, setFormRotulo] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formOrdem, setFormOrdem] = useState(0);
  const [formAtivo, setFormAtivo] = useState(true);
  const [salvandoCanal, setSalvandoCanal] = useState(false);
  const [erroCanal, setErroCanal] = useState("");

  // Modal de configurações da página de contato
  const [modalPaginaAberto, setModalPaginaAberto] = useState(false);
  const [paginaRascunho, setPaginaRascunho] = useState<PaginaContato>(pagina);
  const [salvandoPagina, setSalvandoPagina] = useState(false);
  const [erroPagina, setErroPagina] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setFalhaCarga(false);
    try {
      const res = await fetch("/api/admin/contatos", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar dados de contato.");
      const data = await res.json() as { canais: CanalContato[]; pagina: PaginaContato; midias: Midia[] };
      setCanais(data.canais ?? []);
      if (data.pagina) setPagina(data.pagina);
      setMidias(data.midias ?? []);
    } catch (err) {
      console.error(err);
      setFalhaCarga(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const canaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return canais;
    return canais.filter(
      (c) => c.rotulo.toLowerCase().includes(termo) || c.url.toLowerCase().includes(termo) || c.tipo.toLowerCase().includes(termo)
    );
  }, [busca, canais]);

  function abrirCriacaoCanal() {
    setCanalEmEdicao(null);
    setFormTipo("whatsapp");
    setFormRotulo("");
    setFormUrl("https://");
    setFormOrdem(canais.length);
    setFormAtivo(true);
    setErroCanal("");
    setModalCanalAberto(true);
  }

  function abrirEdicaoCanal(canal: CanalContato) {
    setCanalEmEdicao(canal);
    setFormTipo(canal.tipo);
    setFormRotulo(canal.rotulo);
    setFormUrl(canal.url);
    setFormOrdem(canal.ordem);
    setFormAtivo(canal.ativo);
    setErroCanal("");
    setModalCanalAberto(true);
  }

  async function salvarCanal(e: FormEvent) {
    e.preventDefault();
    if (!formRotulo.trim()) {
      setErroCanal("O rótulo do canal é obrigatório.");
      return;
    }
    if (!formUrl.trim()) {
      setErroCanal("A URL do canal é obrigatória.");
      return;
    }

    setSalvandoCanal(true);
    setErroCanal("");
    try {
      const metodo = canalEmEdicao ? "PUT" : "POST";
      const payload = canalEmEdicao
        ? { id: canalEmEdicao.id, tipo: formTipo, rotulo: formRotulo, url: formUrl, ordem: formOrdem, ativo: formAtivo }
        : { tipo: formTipo, rotulo: formRotulo, url: formUrl, ordem: formOrdem, ativo: formAtivo };

      const res = await fetch("/api/admin/contatos", {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const dados = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(dados?.error || "Falha ao salvar canal.");
      }

      setModalCanalAberto(false);
      await carregar();
      modal.success({
        title: "Sucesso",
        content: canalEmEdicao ? "Canal atualizado com sucesso!" : "Canal adicionado com sucesso!",
      });
    } catch (err) {
      setErroCanal(err instanceof Error ? err.message : "Erro ao salvar canal.");
    } finally {
      setSalvandoCanal(false);
    }
  }

  function confirmarExclusaoCanal(canal: CanalContato) {
    modal.confirm({
      title: "Confirmar exclusão",
      content: `Deseja realmente excluir o canal "${canal.rotulo}"?`,
      okText: "Sim, excluir",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/contatos?id=${encodeURIComponent(canal.id)}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Falha ao excluir canal.");
          await carregar();
          modal.success({ title: "Sucesso", content: "Canal excluído com sucesso!" });
        } catch (err) {
          console.error(err);
          modal.error({ title: "Erro", content: "Não foi possível excluir o canal." });
        }
      },
    });
  }

  function abrirConfiguracaoPagina() {
    setPaginaRascunho({
      titulo: pagina.titulo,
      fundo: { ...pagina.fundo },
      logo: { ...pagina.logo },
    });
    setErroPagina("");
    setModalPaginaAberto(true);
  }

  async function salvarConfiguracaoPagina(e: FormEvent) {
    e.preventDefault();
    setSalvandoPagina(true);
    setErroPagina("");
    try {
      const res = await fetch("/api/admin/contatos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina: paginaRascunho }),
      });
      if (!res.ok) {
        const dados = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(dados?.error || "Falha ao salvar configurações da página.");
      }
      setPagina(paginaRascunho);
      setModalPaginaAberto(false);
      modal.success({ title: "Sucesso", content: "Configurações da página atualizadas!" });
    } catch (err) {
      setErroPagina(err instanceof Error ? err.message : "Erro ao salvar página.");
    } finally {
      setSalvandoPagina(false);
    }
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
      <section className="space-y-4" aria-labelledby="admin-secao-titulo">
        <header className="flex w-full min-w-0 max-w-full flex-col gap-4 rounded-xl border border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 2xl:p-4">
          <div className="min-w-0 flex-1 border-l-4 border-[#F38901] pl-4">
            <h1 id="admin-secao-titulo" className="break-words text-lg font-bold text-[#19121d] sm:text-xl">
              Contatos
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              Gerencie os canais de contato e a apresentação da página pública /contato.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="default"
              onClick={abrirConfiguracaoPagina}
              icon={<Settings2 className="size-4" aria-hidden="true" />}
              className="min-h-11 font-medium 2xl:min-h-10"
            >
              Configurar página
            </Button>
            <Button
              type="primary"
              onClick={abrirCriacaoCanal}
              icon={<Plus className="size-4" aria-hidden="true" />}
              className="min-h-11 font-semibold 2xl:min-h-10"
            >
              Novo canal
            </Button>
          </div>
        </header>

        {/* Lista de Canais */}
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-4 sm:p-6 2xl:p-5">
          {!falhaCarga && canais.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#19121d]">Canais de contato cadastrados</h3>
              </div>
              <Input.Search
                placeholder="Filtrar por rótulo, URL ou tipo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                allowClear
              />
            </div>
          )}

          {carregando ? (
            <EstadoLista carregando={true} buscando={false} mensagemVazia="" />
          ) : falhaCarga ? (
            <div className="py-8 text-center space-y-3">
              <p role="alert" className="text-sm font-medium text-red-700">
                Não foi possível carregar os canais de contato.
              </p>
              <button
                type="button"
                onClick={() => void carregar()}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] hover:bg-slate-50"
              >
                Tentar novamente
              </button>
            </div>
          ) : canaisFiltrados.length > 0 ? (
            <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300 border-t border-slate-300">
              {canaisFiltrados.map((canal) => (
                <li key={canal.id} className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
                  <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] 2xl:size-10">
                        <IconeTipo tipo={canal.tipo} />
                      </span>
                      <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-bold text-[#19121d]">{canal.rotulo}</h3>
                          <Tag color={canal.ativo ? "success" : "default"} className="text-xs">
                            {canal.ativo ? "Ativo" : "Inativo"}
                          </Tag>
                          <span className="text-xs text-slate-500">Ordem: {canal.ordem}</span>
                        </div>
                        <div className="mt-1 min-w-0 max-w-full">
                          <a
                            href={canal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block max-w-full truncate text-sm text-[#412551] underline decoration-[#F38901]/60 underline-offset-2 hover:text-[#681A01]"
                          >
                            {canal.url}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 sm:pl-4">
                      <Button
                        onClick={() => abrirEdicaoCanal(canal)}
                        icon={<Pencil size={15} aria-hidden="true" />}
                        className="min-h-11 2xl:min-h-10"
                      >
                        Editar
                      </Button>
                      <Button
                        danger
                        onClick={() => confirmarExclusaoCanal(canal)}
                        icon={<Trash2 size={15} aria-hidden="true" />}
                        className="min-h-11 2xl:min-h-10"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EstadoLista
              carregando={false}
              buscando={Boolean(busca)}
              mensagemVazia="Ainda não há canais de contato cadastrados."
              textoAcao="Adicionar primeiro canal"
              aoCriar={abrirCriacaoCanal}
            />
          )}
        </div>
      </section>

      {/* Modal de Canal (Criar / Editar) */}
      <ModalAdmin
        aberto={modalCanalAberto}
        aoFechar={() => setModalCanalAberto(false)}
        titulo={canalEmEdicao ? "Editar canal de contato" : "Novo canal de contato"}
        descricao={canalEmEdicao ? `Atualize as informações de "${canalEmEdicao.rotulo}".` : "Adicione um canal como WhatsApp, Instagram ou e-mail."}
        larguraMaxima="max-w-xl"
      >
        <form onSubmit={salvarCanal} className="space-y-4">
          {erroCanal && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erroCanal}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={CLASSE_LABEL}>
              Tipo de canal
              <select
                className={CAMPO}
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value)}
              >
                {TIPOS_CANAL.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </label>

            <CampoAdmin
              label="Ordem de exibição"
              tipo="number"
              min={0}
              max={9999}
              value={formOrdem}
              onChange={(v) => setFormOrdem(Number(v) || 0)}
            />
          </div>

          <CampoAdmin
            label="Rótulo exibido"
            required
            maxLen={300}
            minLen={2}
            proibirHtml
            value={formRotulo}
            onChange={setFormRotulo}
            placeholder="Ex: @coletivoamargem, WhatsApp de Produção..."
          />

          <CampoAdmin
            label="URL / Link do canal"
            tipo="url"
            required
            maxLen={1000}
            value={formUrl}
            onChange={setFormUrl}
            placeholder="Ex: https://instagram.com/coletivoamargem, mailto:contato@amargem.com"
          />

          <label className="flex items-center gap-2 pt-1 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formAtivo}
              onChange={(e) => setFormAtivo(e.target.checked)}
              className="size-4 rounded border-slate-300 text-[#412551] focus:ring-[#412551]"
            />
            Canal ativo e visível na página pública
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setModalCanalAberto(false)} disabled={salvandoCanal} className="min-h-11">
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={salvandoCanal} className="min-h-11 px-5 font-semibold">
              {canalEmEdicao ? "Salvar alterações" : "Adicionar canal"}
            </Button>
          </div>
        </form>
      </ModalAdmin>

      {/* Modal de Configuração da Página /contato */}
      <ModalAdmin
        aberto={modalPaginaAberto}
        aoFechar={() => setModalPaginaAberto(false)}
        titulo="Configurar página de contato"
        descricao="Personalize o título, fundo e logo exibidos na rota /contato."
        larguraMaxima="max-w-xl"
      >
        <form onSubmit={salvarConfiguracaoPagina} className="space-y-4">
          {erroPagina && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erroPagina}</p>}

          <CampoAdmin
            label="Título da página"
            required
            maxLen={200}
            minLen={2}
            proibirHtml
            placeholder="Ex: Entre em contato"
            value={paginaRascunho.titulo}
            onChange={(valor) => setPaginaRascunho({ ...paginaRascunho, titulo: valor })}
          />

          {/* Seletor de Fundo */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className={pagina.fundo.url ? "grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start" : "space-y-2"}>
              {pagina.fundo.url && (
                <div className="flex flex-col gap-1.5 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white min-w-[120px]">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fundo atual</span>
                  <div className="relative h-20 w-32 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                    <Image src={pagina.fundo.url} alt="Fundo atual" fill unoptimized className="object-cover" />
                  </div>
                </div>
              )}
              <div className="space-y-2 flex-1">
                <label className={CLASSE_LABEL}>
                  Imagem de fundo
                  <select
                    className={CAMPO}
                    value={paginaRascunho.fundo.midiaId ?? ""}
                    onChange={(e) => {
                      const m = midias.find((item) => item.id === e.target.value);
                      setPaginaRascunho({
                        ...paginaRascunho,
                        fundo: {
                          ...paginaRascunho.fundo,
                          midiaId: m?.id ?? null,
                          origem: null,
                          url: m?.url ?? null,
                        },
                      });
                    }}
                  >
                    <option value="">Usar fundo padrão (/padrao2.webp)</option>
                    {midias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nomeOriginal || m.id.slice(0, 12)} · {Math.ceil(m.bytes / 1024)} KB
                      </option>
                    ))}
                  </select>
                </label>
                {paginaRascunho.fundo.url && (
                  <div className="flex items-center gap-3">
                    <Image src={paginaRascunho.fundo.url} alt="Prévia fundo" width={72} height={72} unoptimized className="size-16 rounded-md object-cover" />
                    <span className="text-xs text-slate-600">Novo fundo selecionado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seletor de Logo */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className={pagina.logo.url ? "grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start" : "space-y-2"}>
              {pagina.logo.url && (
                <div className="flex flex-col gap-1.5 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white min-w-[120px]">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Logo atual</span>
                  <div className="relative size-20 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                    <Image src={pagina.logo.url} alt="Logo atual" fill unoptimized className="object-cover" />
                  </div>
                </div>
              )}
              <div className="space-y-2 flex-1">
                <label className={CLASSE_LABEL}>
                  Logo central da página
                  <select
                    className={CAMPO}
                    value={paginaRascunho.logo.midiaId ?? ""}
                    onChange={(e) => {
                      const m = midias.find((item) => item.id === e.target.value);
                      setPaginaRascunho({
                        ...paginaRascunho,
                        logo: {
                          ...paginaRascunho.logo,
                          midiaId: m?.id ?? null,
                          origem: null,
                          url: m?.url ?? null,
                        },
                      });
                    }}
                  >
                    <option value="">Usar logo padrão (/amargem-logo-insta.webp)</option>
                    {midias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nomeOriginal || m.id.slice(0, 12)} · {Math.ceil(m.bytes / 1024)} KB
                      </option>
                    ))}
                  </select>
                </label>
                {paginaRascunho.logo.url && (
                  <div className="flex items-center gap-3">
                    <Image src={paginaRascunho.logo.url} alt="Prévia logo" width={72} height={72} unoptimized className="size-16 rounded-full object-cover" />
                    <span className="text-xs text-slate-600">Novo logo selecionado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setModalPaginaAberto(false)} disabled={salvandoPagina} className="min-h-11">
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={salvandoPagina} className="min-h-11 px-5 font-semibold">
              Salvar configurações
            </Button>
          </div>
        </form>
      </ModalAdmin>
    </ConfigProvider>
  );
}

