# Ensaio isolado do baseline e da cadeia de migrações

Ensaio concluído em **07/11/2026**, na `main`, sobre a reconciliação documentada em [reconciliacao-baseline-2026-11-07.md](reconciliacao-baseline-2026-11-07.md). Todos os bancos foram instâncias efêmeras do PGlite em `/tmp`; nenhum SQL foi enviado à conexão Supabase.

## Execução

Não havia `postgres`, `psql`, `initdb`, Docker ou Podman no ambiente. Instalei `@electric-sql/pglite` fora do repositório em `/tmp/amargem-postgres-isolado`; ele executa PostgreSQL 18.6 embutido em WebAssembly. O projeto e suas dependências não foram alterados para obter o engine.

Cada cenário usou um banco independente:

1. **Banco novo:** executei `0_base_legada/migration.sql` e a migração editorial `20261108020000_estrutura_conteudo_migracao/migration.sql`, em ordem.
2. **Banco preexistente:** criei o estado legado pelo baseline, inseri um registro de teste em cada tabela antiga (incluindo blobs binários em Livro e Sobre), registrei um marcador de baseline já aplicado e executei somente a migração editorial pendente. Comparei os registros e bytes antes/depois.
3. **Histórico anterior:** executei, em banco descartável, os quatro scripts preservados em `prisma/historico-arquivado/`, na ordem original.
4. **RLS:** inseri linhas de teste em uma tabela legada e em uma tabela nova, concedi permissões equivalentes às permissões de tabela padrão observadas para um role `anon` e tentei ler e inserir como esse role.

Os marcadores de migração no cenário 2 simulam a distinção entre baseline resolvido e migração editorial pendente; a CLI `prisma migrate resolve` não foi executada contra PGlite. O ensaio executa o SQL completo da cadeia, sem aplicar nada no banco real.

## Resultados

| Cenário | Resultado |
| --- | --- |
| Baseline em banco vazio | Criou as 5 tabelas legadas com RLS habilitado. |
| Cadeia ativa completa | Terminou com 22 tabelas, RLS nas 22 e os enums `EstadoImportacao` e `EstadoPublicacao`. |
| Migração editorial sobre dados existentes | Criou as estruturas novas sem alterar os registros legados, inclusive os bytes das duas imagens. O marcador de baseline permaneceu único. |
| Quatro SQLs históricos | Foram executados na ordem e reproduziram 25 colunas, `Livro.imagem` como `bytea` e `Agenda.data` como `timestamp(3)` sem fuso. |
| RLS com linhas existentes | Com role `anon`, nenhuma linha de teste ficou visível nas 22 tabelas; inserção em `CanalContato` foi bloqueada. Nenhuma policy estava instalada. |

Confirma as diferenças registradas na reconciliação: os scripts históricos antigos deixam `Agenda.data` e `Agenda.createdAt` sem fuso e com precisão 3; o estado observado usa `timestamptz(6)`. O baseline preparado reproduz o estado observado e evita reexecutar o script histórico que remove/recria blobs.

Hashes dos SQLs executados:

- Baseline `0_base_legada`: `0d592e6e82348f0ab001ce12df8305fb225da659f16369047c8e47ca7fcdb6c0`
- Migração editorial com RLS: `c4ab75a0bdd14ce0954254eb4fe70d216dd9163e6112255ba0f06cdd9663a866`

## Escopo da validação

O ensaio executou os SQLs reais em PostgreSQL 18.6 e verificou catálogo, tipos, RLS, conteúdo e blobs. `prisma validate` já havia aprovado tanto o schema atual quanto o datamodel do baseline. A comparação local do datamodel baseline ao atual gerou a estrutura da migração editorial; o complemento RLS foi verificado separadamente.

Na primeira execução, o ambiente não fornecia endpoint TCP para conectar o Prisma Migrate ao PGlite. Essa limitação foi resolvida numa etapa posterior com PGlite Socket e Prisma CLI real: o [complemento de validação](validacao-cli-prisma-baseline-2026-11-07.md) cobre `migrate resolve`, `migrate deploy` e `migrate status` nos cenários vazio e povoado.

Este ensaio SQL inicial usou PostgreSQL 18.6 embutido. Depois, a origem configurada foi consultada em modo somente leitura: respondeu PostgreSQL 17.6 e não possui `public._prisma_migrations`. A [validação complementar da CLI](validacao-cli-prisma-baseline-2026-11-07.md) repetiu os fluxos em PostgreSQL 17.11, a mesma versão principal, incluindo `migrate resolve`, `migrate deploy`, `migrate status`, preservação de dados/blobs e RLS. O patch level e a configuração específica do Supabase ainda diferem; antes de qualquer registro remoto, é necessário confirmar a identidade do projeto, reconferir o catálogo e ensaiar em staging compatível.

## Conclusão

A cadeia SQL está coerente nos cenários de banco vazio e banco preexistente com dados, preserva blobs e aplica o RLS proposto. A CLI Prisma passou em PostgreSQL 18.6 e 17.11. A confirmação da identidade do destino, o staging e qualquer gravação no Supabase continuam pendentes.
