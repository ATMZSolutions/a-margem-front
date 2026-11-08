# Histórico anterior ao baseline

Os quatro scripts originais foram movidos para esta pasta em 07/11/2026, sem alterar seus bytes. Os hashes estão em `manifesto.json`. Esta pasta não é lida pelo Prisma Migrate.

A origem inspecionada já possui as cinco tabelas e não possui `_prisma_migrations`. Reaplicar os scripts originais falharia na criação das tabelas; o script de blobs também remove/recria colunas de imagem. O schema resultante do histórico ainda usaria `timestamp(3)` sem fuso em Agenda, enquanto a origem e os modelos atuais usam `timestamptz(6)`.

`schema-resultante.prisma` representa os tipos/defaults/PKs resultantes dos quatro scripts, sem alegar que foram aplicados na origem. Ele é usado somente para comparação local. Não foi reproduzido em um banco nesta entrega.

A cadeia ativa passa a ser `prisma/migrations/0_base_legada` → migração editorial aditiva. No banco existente, o baseline deverá ser registrado como aplicado em uma operação futura; seu SQL não deve ser executado sobre tabelas existentes. Outros ambientes que tenham histórico registrado precisam ser inspecionados antes de adotar esta cadeia: não apagar suas linhas de histórico nem marcar os scripts arquivados como se fossem o novo baseline.

Veja [reconciliação e runbook](../../docs/execucao/reconciliacao-baseline-2026-11-07.md).

O ensaio dos quatro SQLs antigos, do baseline e da migração editorial em PostgreSQL isolado está registrado em [ensaio da cadeia](../../docs/execucao/ensaio-baseline-postgresql-isolado-2026-11-07.md).
