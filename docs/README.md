# Documentação do projeto

Este diretório reúne auditorias, decisões, execução e trabalho ainda pendente na aplicação. Os documentos de auditoria e execução vieram da branch `feature/auditoria-e-otimizacao` (`8058125`); na criação desta organização, a branch de trabalho era `main` (`afdb8c1`). Portanto, uma correção descrita como concluída na feature só deve ser considerada ativa depois de integrada e validada no ambiente correspondente.

## Pastas

- [`planejamento/`](planejamento/): planos de correção e UX/UI, além do backlog aberto.
- [`desenvolvimento/`](desenvolvimento/): convenções de Gitflow, commits, nomes e testes.
- [`execucao/`](execucao/): alterações feitas na branch de auditoria, verificações registradas e limitações conhecidas.
- [`seguranca/`](seguranca/): auditoria inicial e revisão complementar de segurança.
- [`performance/`](performance/): medições e próximos passos para imagens e desempenho.

## Acompanhar pendências

Para ampliar a autonomia do painel, consulte o [catálogo de conteúdo ainda fora do admin](planejamento/catalogo-conteudo-administravel.md), com cobertura por página, campos faltantes, fontes no código e critérios de aceite.

O [plano de execução e migração automática para Supabase](planejamento/plano-execucao-conteudo-supabase.md) detalha etapas, modelos, importação de textos/imagens, validação, corte e reversão.

Execução iniciada no [relatório do inventário e estrutura do importador](execucao/inventario-conteudo-2026-11-07.md), com resultados locais, comandos e limitações da primeira entrega.

A [segunda entrega](execucao/adaptadores-snapshot-schema-2026-11-07.md) completa adaptadores, registra a leitura somente leitura do banco e prepara o schema aditivo; essa entrega de 07/11 não aplicou migrações remotamente.

A [reconciliação do schema e baseline](execucao/reconciliacao-baseline-2026-11-07.md) documenta o estado real e as diferenças do histórico antigo; veja no mesmo relatório a atualização posterior de staging.

O [ensaio em PostgreSQL isolado](execucao/ensaio-baseline-postgresql-isolado-2026-11-07.md) valida a cadeia SQL em banco vazio e povoado, preservação de blobs, histórico antigo e RLS. A origem configurada respondeu PostgreSQL 17.6; a CLI real foi validada também em PostgreSQL 17.11 isolado.

O [complemento de validação da CLI Prisma](execucao/validacao-cli-prisma-baseline-2026-11-07.md) registra os ensaios isolados de `migrate resolve`, `migrate deploy` e `migrate status` em PostgreSQL 18.6 e 17.11, feitos antes da aplicação posterior no staging.

A [projeção dos DTOs e validação de mídias](execucao/projecao-dtos-midias-2026-11-07.md) mapeia o inventário e os cinco conjuntos legados para o schema local, valida hashes/MIME/blobs e executa o `dry-run` integral sem upload ou gravação remota.

O [adaptador Storage local](execucao/adaptador-storage-local-2026-11-07.md) valida buckets, faz upload sem sobrescrita e confere hash baixando o objeto; sua bateria usa serviço falso, sem chamadas reais ao Supabase.

O [orquestrador de importação](execucao/orquestrador-importacao-local-2026-11-08.md) cobre idempotência, retomada e conflitos. A CLI protegida foi executada duas vezes no staging isolado; o [relatório da importação](execucao/importacao-staging-conteudo-2026-11-08.md) registra os hashes e contagens verificados.

O [adaptador PostgreSQL/Prisma local](execucao/adaptador-prisma-local-2026-11-08.md) acrescenta persistência por injeção, migração dos cinco modelos legados, hashes tipados para timestamps/blobs e pré-verificação de grants/RLS, sequences e checksums de migração. Passou em testes com cliente falso e ensaios com Prisma 6.17 sobre PGlite 18.6 e PostgreSQL 17.11 efêmeros.

O [comando de staging protegido](execucao/cli-staging-protegida-2026-11-08.md) exige kill switch e confirmações explícitas. Schema e bucket foram aplicados/verificados no staging isolado; a importação e sua repetição integral concluíram com 326 itens verificados e 70 mídias conferidas.

Para abrir localmente os novos módulos do admin usando o Supabase isolado, execute `yarn dev:staging`. O comando valida `.env.staging.local`, ativa o flag editorial apenas no processo local e inicia em `http://localhost:3104`; `yarn dev` mantém o comportamento padrão seguro.

O preflight e a importação em staging foram concluídos: 22 tabelas, 326 itens verificados e 70 mídias conferidas. E3–E5 estão concluídas no código e no staging. E0 foi confirmada para o SHA `c05ce1b` informado pelo responsável, com snapshot da origem somente leitura e dry-run sem divergências; veja a [validação E0](execucao/validacao-e0-publicacao-manifesto-2026-11-08.md). A [preparação E6](execucao/preparacao-e6-backup-restauracao-2026-11-08.md) registra a restauração isolada e as verificações pré-corte. O [relatório de produção](execucao/migracao-producao-conteudo-2026-11-08.md) registra o baseline, as migrações, a importação e a conferência das mídias; a ativação pública depende de publicar a `main` e confirmar o deployment/runtime.

Consulte o [backlog da aplicação](planejamento/pendencias.md). Ele separa correções já descritas na feature das tarefas que ainda dependem de integração, configuração de produção ou validação em staging.

As auditorias são registros datados, não uma garantia do estado atual do deploy. Atualize o backlog quando uma tarefa for concluída e anote a evidência, o ambiente e a data da validação.
