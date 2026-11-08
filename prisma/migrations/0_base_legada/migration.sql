-- Baseline do estado legado observado. Criar somente em banco vazio.
-- No banco existente: registrar como aplicado futuramente; NÃO executar este SQL.
-- RLS reproduzido do catálogo; permissões por papel são inventariadas separadamente.

CREATE TABLE public."Agenda" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    "local" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cidade" TEXT NOT NULL,
    CONSTRAINT "Agenda_pkey" PRIMARY KEY (id)
);
ALTER TABLE public."Agenda" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."Livro" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "imagem" BYTEA,
    "imagemTipo" TEXT,
    "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Livro_pkey" PRIMARY KEY (id)
);
ALTER TABLE public."Livro" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."Noticia" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Noticia_pkey" PRIMARY KEY (id)
);
ALTER TABLE public."Noticia" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."Projeto" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    "descricao" TEXT NOT NULL,
    CONSTRAINT "Projeto_pkey" PRIMARY KEY (id)
);
ALTER TABLE public."Projeto" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."Sobre" (
    "ano" INTEGER NOT NULL,
    "imagem" BYTEA,
    "imagemTipo" TEXT,
    "descricao" TEXT NOT NULL,
    CONSTRAINT "Sobre_pkey" PRIMARY KEY (ano)
);
ALTER TABLE public."Sobre" ENABLE ROW LEVEL SECURITY;
