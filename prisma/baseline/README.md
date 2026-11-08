# Estado legado observado

`schema-legado.prisma` descreve as cinco tabelas da origem observada em 07/11/2026. Serve para comparação local e geração/verificação da migração editorial, sem incluir as tabelas novas do painel.

O SQL correspondente fica em `../migrations/0_base_legada/migration.sql`. Inclui RLS conforme o catálogo; o datamodel Prisma não representa RLS, políticas, grants ou proprietários. As permissões da plataforma estão inventariadas no catálogo local e documentadas no relatório.

O baseline está preparado, mas não foi registrado na origem. O documento [reconciliação e runbook](../../docs/execucao/reconciliacao-baseline-2026-11-07.md) distingue criar um banco vazio de registrar o baseline em um banco com dados.
