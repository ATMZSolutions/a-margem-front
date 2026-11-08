-- CreateEnum
CREATE TYPE "EstadoPublicacao" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "EstadoImportacao" AS ENUM ('PENDENTE', 'ENVIADO', 'VINCULADO', 'VERIFICADO', 'ERRO', 'CONFLITO');

-- CreateTable
CREATE TABLE "Midia" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "largura" INTEGER,
    "altura" INTEGER,
    "nomeOriginal" TEXT,
    "origem" TEXT,
    "criadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Midia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsoMidia" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT NOT NULL,
    "midiaId" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "registro" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "textoAlternativo" TEXT NOT NULL DEFAULT '',
    "legenda" TEXT,
    "credito" TEXT,
    "dataEditorial" TEXT,

    CONSTRAINT "UsoMidia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoSite" (
    "chave" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "dados" JSONB NOT NULL,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ConfiguracaoSite_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "CanalContato" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CanalContato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMenu" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ItemMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integrante" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fichaTecnica" TEXT NOT NULL,
    "biografia" TEXT NOT NULL,
    "fotoId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "seo" JSONB,

    CONSTRAINT "Integrante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espetaculo" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "lancamento" TEXT NOT NULL,
    "estreia" TEXT,
    "localEstreia" TEXT,
    "corFundo" TEXT,
    "capaId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "seo" JSONB,

    CONSTRAINT "Espetaculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecaoEspetaculo" (
    "id" TEXT NOT NULL,
    "espetaculoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "SecaoEspetaculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premio" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ano" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotoId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "seo" JSONB,

    CONSTRAINT "Premio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Galeria" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT NOT NULL,
    "titulo" TEXT,
    "espetaculoId" TEXT,

    CONSTRAINT "Galeria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoGaleria" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT NOT NULL,
    "galeriaId" TEXT NOT NULL,
    "midiaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "textoAlternativo" TEXT NOT NULL DEFAULT '',
    "legenda" TEXT NOT NULL DEFAULT '',
    "credito" TEXT,
    "dataEditorial" TEXT,

    CONSTRAINT "FotoGaleria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaginaSite" (
    "id" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "configuracao" JSONB NOT NULL,
    "estado" "EstadoPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "seo" JSONB,

    CONSTRAINT "PaginaSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecaoHome" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "configuracao" JSONB NOT NULL,

    CONSTRAINT "SecaoHome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarcoHistorico" (
    "id" TEXT NOT NULL,
    "chaveOrigem" TEXT,
    "ano" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "anoLegado" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPublicacao" NOT NULL DEFAULT 'RASCUNHO',

    CONSTRAINT "MarcoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AliasURL" (
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "permanente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AliasURL_pkey" PRIMARY KEY ("origem")
);

-- CreateTable
CREATE TABLE "ExecucaoImportacao" (
    "id" TEXT NOT NULL,
    "ambiente" TEXT NOT NULL,
    "origemSha256" TEXT NOT NULL,
    "destinoSha256" TEXT NOT NULL,
    "manifestoSha256" TEXT NOT NULL,
    "versaoImportador" INTEGER NOT NULL,
    "commitOrigem" TEXT NOT NULL,
    "estado" "EstadoImportacao" NOT NULL DEFAULT 'PENDENTE',
    "iniciadoEm" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMPTZ(6),

    CONSTRAINT "ExecucaoImportacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemImportacao" (
    "id" TEXT NOT NULL,
    "execucaoId" TEXT NOT NULL,
    "chaveOrigem" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "destinoId" TEXT,
    "hashFonte" TEXT NOT NULL,
    "hashDestinoImportado" TEXT,
    "estado" "EstadoImportacao" NOT NULL DEFAULT 'PENDENTE',
    "erroCodigo" TEXT,
    "atualizadoEm" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ItemImportacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Midia_sha256_idx" ON "Midia"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "Midia_bucket_chave_key" ON "Midia"("bucket", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "UsoMidia_chaveOrigem_key" ON "UsoMidia"("chaveOrigem");

-- CreateIndex
CREATE INDEX "UsoMidia_dominio_registro_idx" ON "UsoMidia"("dominio", "registro");

-- CreateIndex
CREATE UNIQUE INDEX "CanalContato_chaveOrigem_key" ON "CanalContato"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "ItemMenu_chaveOrigem_key" ON "ItemMenu"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "Integrante_chaveOrigem_key" ON "Integrante"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "Integrante_slug_key" ON "Integrante"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Espetaculo_chaveOrigem_key" ON "Espetaculo"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "Espetaculo_slug_key" ON "Espetaculo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SecaoEspetaculo_espetaculoId_ordem_key" ON "SecaoEspetaculo"("espetaculoId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Premio_chaveOrigem_key" ON "Premio"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "Premio_slug_ano_key" ON "Premio"("slug", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "Galeria_chaveOrigem_key" ON "Galeria"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "FotoGaleria_chaveOrigem_key" ON "FotoGaleria"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "FotoGaleria_galeriaId_ordem_key" ON "FotoGaleria"("galeriaId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "PaginaSite_caminho_key" ON "PaginaSite"("caminho");

-- CreateIndex
CREATE UNIQUE INDEX "SecaoHome_chave_key" ON "SecaoHome"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "MarcoHistorico_chaveOrigem_key" ON "MarcoHistorico"("chaveOrigem");

-- CreateIndex
CREATE UNIQUE INDEX "MarcoHistorico_anoLegado_key" ON "MarcoHistorico"("anoLegado");

-- CreateIndex
CREATE INDEX "ItemImportacao_chaveOrigem_atualizadoEm_idx" ON "ItemImportacao"("chaveOrigem", "atualizadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "ItemImportacao_execucaoId_chaveOrigem_key" ON "ItemImportacao"("execucaoId", "chaveOrigem");

-- AddForeignKey
ALTER TABLE "UsoMidia" ADD CONSTRAINT "UsoMidia_midiaId_fkey" FOREIGN KEY ("midiaId") REFERENCES "Midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integrante" ADD CONSTRAINT "Integrante_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "Midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Espetaculo" ADD CONSTRAINT "Espetaculo_capaId_fkey" FOREIGN KEY ("capaId") REFERENCES "Midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecaoEspetaculo" ADD CONSTRAINT "SecaoEspetaculo_espetaculoId_fkey" FOREIGN KEY ("espetaculoId") REFERENCES "Espetaculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Premio" ADD CONSTRAINT "Premio_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "Midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Galeria" ADD CONSTRAINT "Galeria_espetaculoId_fkey" FOREIGN KEY ("espetaculoId") REFERENCES "Espetaculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoGaleria" ADD CONSTRAINT "FotoGaleria_galeriaId_fkey" FOREIGN KEY ("galeriaId") REFERENCES "Galeria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoGaleria" ADD CONSTRAINT "FotoGaleria_midiaId_fkey" FOREIGN KEY ("midiaId") REFERENCES "Midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemImportacao" ADD CONSTRAINT "ItemImportacao_execucaoId_fkey" FOREIGN KEY ("execucaoId") REFERENCES "ExecucaoImportacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS como nas tabelas legadas: acesso de clientes sem policies permanece bloqueado.
-- O painel usa acesso no servidor; não usa a sessão Supabase Auth do navegador.
ALTER TABLE "Midia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsoMidia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfiguracaoSite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CanalContato" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemMenu" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integrante" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Espetaculo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecaoEspetaculo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Premio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Galeria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FotoGaleria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaginaSite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecaoHome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarcoHistorico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AliasURL" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExecucaoImportacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemImportacao" ENABLE ROW LEVEL SECURITY;
