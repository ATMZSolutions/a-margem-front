-- Adiciona os controles de publicação aos cinco modelos legados.
-- PUBLICADO preserva a visibilidade atual; a ordem inicial reproduz a listagem
-- que cada página já usava antes da migração.

ALTER TABLE "Agenda"
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estado" "EstadoPublicacao" NOT NULL DEFAULT 'PUBLICADO',
  ADD COLUMN "seo" JSONB;

WITH ordenados AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "data" ASC, "id" ASC) - 1 AS posicao
  FROM "Agenda"
)
UPDATE "Agenda" AS item SET "ordem" = ordenados.posicao FROM ordenados WHERE item."id" = ordenados."id";
CREATE INDEX "Agenda_estado_ordem_idx" ON "Agenda"("estado", "ordem");

ALTER TABLE "Noticia"
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estado" "EstadoPublicacao" NOT NULL DEFAULT 'PUBLICADO',
  ADD COLUMN "seo" JSONB;

WITH ordenados AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, "id" DESC) - 1 AS posicao
  FROM "Noticia"
)
UPDATE "Noticia" AS item SET "ordem" = ordenados.posicao FROM ordenados WHERE item."id" = ordenados."id";
CREATE INDEX "Noticia_estado_ordem_idx" ON "Noticia"("estado", "ordem");

ALTER TABLE "Livro"
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estado" "EstadoPublicacao" NOT NULL DEFAULT 'PUBLICADO',
  ADD COLUMN "seo" JSONB;

WITH ordenados AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, "id" DESC) - 1 AS posicao
  FROM "Livro"
)
UPDATE "Livro" AS item SET "ordem" = ordenados.posicao FROM ordenados WHERE item."id" = ordenados."id";
CREATE INDEX "Livro_estado_ordem_idx" ON "Livro"("estado", "ordem");

ALTER TABLE "Projeto"
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estado" "EstadoPublicacao" NOT NULL DEFAULT 'PUBLICADO',
  ADD COLUMN "seo" JSONB;

WITH ordenados AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "data" DESC, "id" DESC) - 1 AS posicao
  FROM "Projeto"
)
UPDATE "Projeto" AS item SET "ordem" = ordenados.posicao FROM ordenados WHERE item."id" = ordenados."id";
CREATE INDEX "Projeto_estado_ordem_idx" ON "Projeto"("estado", "ordem");

ALTER TABLE "Sobre"
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estado" "EstadoPublicacao" NOT NULL DEFAULT 'PUBLICADO',
  ADD COLUMN "seo" JSONB;

WITH ordenados AS (
  SELECT "ano", ROW_NUMBER() OVER (ORDER BY "ano" ASC) - 1 AS posicao
  FROM "Sobre"
)
UPDATE "Sobre" AS item SET "ordem" = ordenados.posicao FROM ordenados WHERE item."ano" = ordenados."ano";
CREATE INDEX "Sobre_estado_ordem_idx" ON "Sobre"("estado", "ordem");
