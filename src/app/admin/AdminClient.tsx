"use client";

import React, { useEffect, useState } from "react";

type AgendaItem = {
  id?: number;
  titulo: string;
  data: string;
  local?: string;
};

type NoticiaItem = {
  id?: number;
  titulo: string;
  conteudo: string;
  link: string;
};

type LivroItem = {
  id?: number;
  titulo: string;
  autor: string;
  descricao: string;
  imagem?: string;
};

export default function AdminClient() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
  const [livros, setLivros] = useState<LivroItem[]>([]);

  const [newAgenda, setNewAgenda] = useState<AgendaItem>({
    titulo: "",
    data: "",
    local: "",
  });
  const [agendaTime, setAgendaTime] = useState<string>("19:00"); // horário padrão
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [editingAgendaTime, setEditingAgendaTime] = useState<string>("19:00");
  const [newNoticia, setNewNoticia] = useState<NoticiaItem>({
    titulo: "",
    conteudo: "",
    link: "",
  });
  const [editingNoticia, setEditingNoticia] = useState<NoticiaItem | null>(null);
  const [newLivro, setNewLivro] = useState<LivroItem>({
    titulo: "",
    autor: "",
    descricao: "",
    imagem: "",
  });
  const [editingLivro, setEditingLivro] = useState<LivroItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  async function load() {
    const a = await fetch("/api/admin/agenda").then((r) => r.json());
    const n = await fetch("/api/admin/noticias").then((r) => r.json());
    const l = await fetch("/api/admin/livros").then((r) => r.json());
    setAgendas(a || []);
    setNoticias(n || []);
    setLivros(l || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createAgenda(e: React.FormEvent) {
    e.preventDefault();
    // Combinar data e hora no fuso horário local
    const dateTimeString = `${newAgenda.data}T${agendaTime}:00`;
    const localDate = new Date(dateTimeString);
    const isoString = localDate.toISOString();

    const agendaToCreate = {
      ...newAgenda,
      data: isoString,
    };

    await fetch("/api/admin/agenda", {
      method: "POST",
      body: JSON.stringify(agendaToCreate),
      headers: { "Content-Type": "application/json" },
    });
    setNewAgenda({ titulo: "", data: "", local: "" });
    setAgendaTime("19:00");
    load();
  }

  async function deleteAgenda(id?: number) {
    if (!id) return;
    await fetch("/api/admin/agenda?id=" + id, { method: "DELETE" });
    load();
  }

  function startEditAgenda(agenda: AgendaItem) {
    setEditingAgenda(agenda);
    // Extrair hora da data ISO
    const date = new Date(agenda.data);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setEditingAgendaTime(`${hours}:${minutes}`);
  }

  function cancelEditAgenda() {
    setEditingAgenda(null);
    setEditingAgendaTime("19:00");
  }

  async function updateAgenda(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAgenda) return;

    // Combinar data e hora no fuso horário local
    const currentDate = new Date(editingAgenda.data);
    const dateOnly = currentDate.toISOString().split('T')[0];
    const dateTimeString = `${dateOnly}T${editingAgendaTime}:00`;
    const localDate = new Date(dateTimeString);
    const isoString = localDate.toISOString();

    const agendaToUpdate = {
      ...editingAgenda,
      data: isoString,
    };

    await fetch("/api/admin/agenda", {
      method: "PUT",
      body: JSON.stringify(agendaToUpdate),
      headers: { "Content-Type": "application/json" },
    });
    setEditingAgenda(null);
    setEditingAgendaTime("19:00");
    load();
  }

  async function createNoticia(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/noticias", {
      method: "POST",
      body: JSON.stringify(newNoticia),
      headers: { "Content-Type": "application/json" },
    });
    setNewNoticia({ titulo: "", conteudo: "", link: "" });
    load();
  }

  async function deleteNoticia(id?: number) {
    if (!id) return;
    await fetch("/api/admin/noticias?id=" + id, { method: "DELETE" });
    load();
  }

  function startEditNoticia(noticia: NoticiaItem) {
    setEditingNoticia(noticia);
  }

  function cancelEditNoticia() {
    setEditingNoticia(null);
  }

  async function updateNoticia(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNoticia) return;

    await fetch("/api/admin/noticias", {
      method: "PUT",
      body: JSON.stringify(editingNoticia),
      headers: { "Content-Type": "application/json" },
    });
    setEditingNoticia(null);
    load();
  }

  // Livro functions
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        setNewLivro({ ...newLivro, imagem: data.url });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingImage(false);
    }
  }

  async function createLivro(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/livros", {
      method: "POST",
      body: JSON.stringify(newLivro),
      headers: { "Content-Type": "application/json" },
    });
    setNewLivro({ titulo: "", autor: "", descricao: "", imagem: "" });
    load();
  }

  async function deleteLivro(id?: number) {
    if (!id) return;
    await fetch("/api/admin/livros?id=" + id, { method: "DELETE" });
    load();
  }

  function startEditLivro(livro: LivroItem) {
    setEditingLivro(livro);
  }

  function cancelEditLivro() {
    setEditingLivro(null);
  }

  async function updateLivro(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLivro) return;

    await fetch("/api/admin/livros", {
      method: "PUT",
      body: JSON.stringify(editingLivro),
      headers: { "Content-Type": "application/json" },
    });
    setEditingLivro(null);
    load();
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingLivro) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        setEditingLivro({ ...editingLivro, imagem: data.url });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingImage(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    // redirect to login
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen py-20 bg-gray-900 text-white ">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex justify-between items-center mb-4 bg-black/30 p-4 rounded">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <button onClick={logout} className="bg-gray-700 px-3 py-1 rounded">
            Logout
          </button>
        </div>

        <section className="mb-8">
          <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
            Agendas
          </h2>
          <form
            onSubmit={createAgenda}
            className="flex flex-col gap-2 my-3 text-white"
          >
            <input
              required
              placeholder="Título"
              value={newAgenda.titulo}
              onChange={(e) =>
                setNewAgenda({ ...newAgenda, titulo: e.target.value })
              }
              className="p-2 border border-white rounded"
            />
            <div className="flex gap-2 w-full">
              <input
                required
                type="date"
                value={newAgenda.data}
                onChange={(e) =>
                  setNewAgenda({ ...newAgenda, data: e.target.value })
                }
                className="p-2 border border-white rounded flex-1 min-w-0"
              />
              <input
                type="time"
                value={agendaTime}
                onChange={(e) => setAgendaTime(e.target.value)}
                className="p-2 border border-white rounded flex-1 min-w-0"
              />
            </div>
            <input
              placeholder="Local"
              value={newAgenda.local}
              onChange={(e) =>
                setNewAgenda({ ...newAgenda, local: e.target.value })
              }
              className="p-2 border border-white rounded"
            />
            <button className="bg-orange-500 px-3 rounded py-2 mb-4 hover:cursor-pointer active:bg-orange-700">
              Adicionar
            </button>
          </form>

          {agendas.length > 0 && (
            <h3 className="text-lg mt-4 my-2">Agendas cadastradas: </h3>
          )}
          <ul className="space-y-2">
            {agendas.map((a) => (
              <li key={a.id} className="bg-black/30 px-4 py-2 rounded">
                {editingAgenda?.id === a.id && editingAgenda ? (
                  <form onSubmit={updateAgenda} className="space-y-2">
                    <input
                      required
                      placeholder="Título"
                      value={editingAgenda.titulo}
                      onChange={(e) =>
                        setEditingAgenda({ 
                          ...editingAgenda, 
                          titulo: e.target.value,
                          data: editingAgenda.data || "",
                          local: editingAgenda.local || ""
                        })
                      }
                      className="w-full p-2 border border-white rounded text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        required
                        type="date"
                        value={new Date(editingAgenda.data).toISOString().split('T')[0]}
                        onChange={(e) =>
                          setEditingAgenda({ 
                            ...editingAgenda, 
                            data: e.target.value,
                            titulo: editingAgenda.titulo || "",
                            local: editingAgenda.local || ""
                          })
                        }
                        className="flex-1 p-2 border border-white rounded text-white"
                      />
                      <input
                        type="time"
                        value={editingAgendaTime}
                        onChange={(e) => setEditingAgendaTime(e.target.value)}
                        className="flex-1 p-2 border border-white rounded text-white"
                      />
                    </div>
                    <input
                      placeholder="Local"
                      value={editingAgenda.local || ""}
                      onChange={(e) =>
                        setEditingAgenda({ 
                          ...editingAgenda, 
                          local: e.target.value,
                          titulo: editingAgenda.titulo || "",
                          data: editingAgenda.data || ""
                        })
                      }
                      className="w-full p-2 border border-white rounded text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditAgenda}
                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{a.titulo}</div>
                      <div className="text-sm text-gray-300">
                        {new Date(a.data).toLocaleString("pt-BR")} — {a.local}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditAgenda(a)}
                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteAgenda(a.id)}
                        className="bg-red-600 px-2 rounded hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
            Notícias
          </h2>
          <form
            onSubmit={createNoticia}
            className="flex gap-2 my-3 flex-col text-white"
          >
            <input
              required
              placeholder="Título"
              value={newNoticia.titulo}
              onChange={(e) =>
                setNewNoticia({ ...newNoticia, titulo: e.target.value })
              }
              className="p-2 border border-white rounded"
            />
            <textarea
              required
              placeholder="Adicione o conteúdo ..."
              value={newNoticia.conteudo}
              onChange={(e) =>
                setNewNoticia({ ...newNoticia, conteudo: e.target.value })
              }
              className="p-2 border border-white rounded"
            />
            <input
              placeholder="Link"
              value={newNoticia.link || ""}
              onChange={(e) =>
                setNewNoticia({ ...newNoticia, link: e.target.value })
              }
              className="p-2 border border-white rounded"
            />
            <button className="bg-orange-500 px-3 rounded py-2 mb-4 hover:cursor-pointer active:bg-orange-700">
              Adicionar
            </button>
          </form>

          {noticias.length > 0 && (
            <h3 className="text-lg mt-4 my-2">Notícias cadastradas: </h3>
          )}
          <ul className="space-y-2">
            {noticias.map((n) => (
              <li key={n.id} className="bg-black/30 p-2 rounded">
                {editingNoticia?.id === n.id && editingNoticia ? (
                  <form onSubmit={updateNoticia} className="space-y-2">
                    <input
                      required
                      placeholder="Título"
                      value={editingNoticia.titulo}
                      onChange={(e) =>
                        setEditingNoticia({ 
                          ...editingNoticia, 
                          titulo: e.target.value,
                          conteudo: editingNoticia.conteudo || "",
                          link: editingNoticia.link || ""
                        })
                      }
                      className="w-full p-2 border border-white rounded text-white"
                    />
                    <textarea
                      required
                      placeholder="Adicione o conteúdo ..."
                      value={editingNoticia.conteudo}
                      onChange={(e) =>
                        setEditingNoticia({ 
                          ...editingNoticia, 
                          conteudo: e.target.value,
                          titulo: editingNoticia.titulo || "",
                          link: editingNoticia.link || ""
                        })
                      }
                      className="w-full p-2 border border-white rounded text-white"
                      rows={3}
                    />
                    <input
                      placeholder="Link"
                      value={editingNoticia.link || ""}
                      onChange={(e) =>
                        setEditingNoticia({ 
                          ...editingNoticia, 
                          link: e.target.value,
                          titulo: editingNoticia.titulo || "",
                          conteudo: editingNoticia.conteudo || ""
                        })
                      }
                      className="w-full p-2 border border-white rounded text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditNoticia}
                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{n.titulo}</div>
                      <div className="text-sm text-gray-300 line-clamp-2">
                        {n.conteudo}
                      </div>
                      {n.link && (
                        <a
                          href={n.link}
                          className="text-blue-500 hover:underline"
                        >
                          {n.link}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditNoticia(n)}
                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteNoticia(n.id)}
                        className="bg-red-600 px-2 rounded hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Livros Section */}
        <section>
          <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">Livros</h2>
          <form onSubmit={createLivro} className="space-y-3 my-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                required
                placeholder="Título"
                value={newLivro.titulo}
                onChange={(e) =>
                  setNewLivro({ ...newLivro, titulo: e.target.value })
                }
                className="p-2 text-white rounded border border-white"
              />
              <input
                required
                placeholder="Autor"
                value={newLivro.autor}
                onChange={(e) =>
                  setNewLivro({ ...newLivro, autor: e.target.value })
                }
                className="p-2 text-white rounded border border-white"
              />
            </div>
            <textarea
              required
              placeholder="Descrição"
              value={newLivro.descricao}
              onChange={(e) =>
                setNewLivro({ ...newLivro, descricao: e.target.value })
              }
              className="w-full p-2 text-white rounded border border-white"
              rows={3}
            />
            <div className="flex gap-3 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="p-2 text-white bg-gray-700 rounded"
              />
              {uploadingImage && (
                <span className="text-yellow-400">Enviando...</span>
              )}
              {newLivro.imagem && (
                <img
                  src={newLivro.imagem}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
              )}
            </div>
            <button
              type="submit"
              className="bg-orange-500 px-3 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              disabled={uploadingImage}
            >
              Criar Livro
            </button>
          </form>

          {livros.length > 0 && (
            <h3 className="text-lg mt-4 my-2">Livros cadastrados: </h3>
          )}
          <ul className="space-y-2">
            {livros.map((l) => (
              <li key={l.id} className="bg-black/30 p-2 rounded">
                {editingLivro?.id === l.id && editingLivro ? (
                  <form onSubmit={updateLivro} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        required
                        placeholder="Título"
                        value={editingLivro.titulo}
                        onChange={(e) =>
                          setEditingLivro({ 
                            ...editingLivro, 
                            titulo: e.target.value,
                            autor: editingLivro.autor || "",
                            descricao: editingLivro.descricao || ""
                          })
                        }
                        className="p-2 text-white rounded border border-white"
                      />
                      <input
                        required
                        placeholder="Autor"
                        value={editingLivro.autor}
                        onChange={(e) =>
                          setEditingLivro({ 
                            ...editingLivro, 
                            autor: e.target.value,
                            titulo: editingLivro.titulo || "",
                            descricao: editingLivro.descricao || ""
                          })
                        }
                        className="p-2 text-white rounded border border-white"
                      />
                    </div>
                    <textarea
                      required
                      placeholder="Descrição"
                      value={editingLivro.descricao}
                      onChange={(e) =>
                        setEditingLivro({ 
                          ...editingLivro, 
                          descricao: e.target.value,
                          titulo: editingLivro.titulo || "",
                          autor: editingLivro.autor || ""
                        })
                      }
                      className="w-full p-2 text-white rounded border border-white"
                      rows={3}
                    />
                    <div className="flex gap-3 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        disabled={uploadingImage}
                        className="p-2 text-white bg-gray-700 rounded"
                      />
                      {uploadingImage && (
                        <span className="text-yellow-400">Enviando...</span>
                      )}
                      {editingLivro.imagem && (
                        <img
                          src={editingLivro.imagem}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                        disabled={uploadingImage}
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditLivro}
                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start flex-1">
                      {l.imagem && (
                        <img
                          src={l.imagem}
                          alt={l.titulo}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{l.titulo}</div>
                        <div className="text-sm text-gray-300">por {l.autor}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {l.descricao}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditLivro(l)}
                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteLivro(l.id)}
                        className="bg-red-600 px-2 rounded hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
