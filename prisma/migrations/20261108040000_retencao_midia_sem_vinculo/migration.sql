-- Registra a primeira reconciliação em que o objeto existe e não tem referências.
-- Nenhum registro ou objeto é excluído por esta migração.
ALTER TABLE "Midia" ADD COLUMN "semVinculoDesde" TIMESTAMPTZ(6);
CREATE INDEX "Midia_semVinculoDesde_idx" ON "Midia"("semVinculoDesde");
