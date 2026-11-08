# Reconciliação do schema e baseline preparado

Terceira entrega em **07/11/2026**, na `main` sobre `c05ce1b`, com alterações locais ainda sem commit. Continuação da [segunda entrega](adaptadores-snapshot-schema-2026-11-07.md). **Nenhum SQL, histórico, política ou conteúdo foi gravado no Supabase.**

## Origem e método

Foi consultada a conexão configurada em `DATABASE_URL`, escolhida explicitamente como origem por `--usar-banco-atual`. Isso não confirma que a conexão representa produção nem identifica o projeto de destino da futura importação.

O novo comando `yarn conteudo:reconciliar --usar-banco-atual` consulta os catálogos PostgreSQL em conexão com `default_transaction_read_only=on`, transação `REPEATABLE READ READ ONLY` e `ROLLBACK`. Não usa shadow database nem lê conteúdo editorial. Foram inspecionados tipos/precisão, obrigatoriedade/defaults, PKs/constraints, índices, ownership/configuração das sequências, RLS, políticas, triggers, proprietários, grants e permissões padrão. Os catálogos `auth` e `storage` não são gerenciados por este baseline.

Os artefatos detalhados estão em `.conteudo-migracao/reconciliacao/`, ignorados no Git e com permissão 0600. Não contêm a URL de conexão. A amostra versionada em `scripts/conteudo/amostras/catalogo-legado.json` contém somente os metadados estruturais usados pelos testes, sem conexão, dados editoriais, proprietários ou ACLs.

## Estado observado

| Item | Resultado |
| --- | --- |
| Tabelas públicas | Agenda, Livro, Noticia, Projeto e Sobre |
| Colunas | 25 |
| PKs e respectivos índices | 5 de cada; sem outros índices/constraints |
| Sequências | 4, inteiras, incremento/início/cache 1, vinculadas aos IDs |
| RLS | Habilitado nas 5 tabelas; não forçado |
| Políticas RLS customizadas | 0 |
| Triggers customizados nas tabelas | 0 |
| Proprietário das tabelas | `postgres` |
| Grants de tabela visíveis | 140 entradas entre `anon`, `authenticated`, `postgres`, `service_role` |
| Permissões padrão visíveis | 6 entradas |
| `public._prisma_migrations` | Não existe |
| Estruturas editoriais novas | Ainda não existem na origem |

Não foi inferido que os scripts antigos foram executados: a ausência de histórico impede afirmar sua procedência. O catálogo prova o estado atual, não o caminho usado para chegar até ele.

## Diferenças e decisões

| Aspecto | Histórico antigo | Origem real / decisão |
| --- | --- | --- |
| `Agenda.data` | `TIMESTAMP(3)` sem fuso | `TIMESTAMPTZ(6)`, igual ao modelo atual. Baseline preserva o banco, sem converter datas. |
| `Agenda.createdAt` | `TIMESTAMP(3)` sem fuso, default CURRENT_TIMESTAMP | `TIMESTAMPTZ(6)`, mesmo default, igual ao modelo atual. Baseline preserva. |
| `Noticia.createdAt`, `Livro.createdAt`, `Projeto.data` | `TIMESTAMP(3)` sem fuso | Coincidem. Anotações `@db.Timestamp(3)` agora explícitas no schema principal, sem mudar o tipo físico. |
| `Livro.imagem`, `Sobre.imagem` | Inicialmente TEXT; script posterior faz DROP/ADD para BYTEA | Já são BYTEA opcionais. Baseline cria diretamente o estado final em banco vazio; nunca executa DROP sobre a origem. |
| `imagemTipo` e `Agenda.cidade` | Acrescentados por scripts intermediários | Já existem, com nulabilidade correspondente. Baseline inclui os campos diretamente. |
| Ordem física das colunas de Livro/Sobre | A sequência de ADD/DROP produziria outra ordem | Baseline conserva a ordem visível atual. A comparação de datamodels Prisma não representa ordem física. |
| PKs/defaults/sequências | PKs e SERIAL previstos | Nomes e comportamento coincidem: cinco PKs, quatro sequências padrão. O baseline não contém valores atuais de sequência nem dados. |
| RLS | Não declarado nos quatro SQLs antigos nem no datamodel Prisma | Habilitado nas cinco tabelas. Incluído explicitamente no SQL do baseline. |
| Policies/triggers/índices secundários | Não previstos | Nenhum encontrado nas tabelas observadas; gerador bloqueia estruturas desse tipo não suportadas. |
| Grants/proprietários/permissões padrão | Não declarados no histórico da aplicação | São configuração da plataforma/ambiente. Inventariados, preservados no banco existente e não recriados como roles/grants pelo baseline. |
| Histórico Prisma | Quatro scripts antigos no repositório | Ausente no banco. Arquivar scripts originais e adotar baseline único que descreve o estado real. |
| Migração editorial | 17 tabelas e 2 enums preparados localmente | Continuam posteriores ao baseline, ainda não aplicados. Nunca marcar essa migração como aplicada antes de criar suas estruturas. |

A comparação local entre o datamodel resultante dos quatro scripts antigos e o datamodel do estado observado produziu somente as duas alterações de tipo em Agenda. Esse SQL foi usado como **evidência**, não como migração a aplicar: esses tipos já estão corretos no banco. RLS/permissões não aparecem nesse diff do Prisma e foram conferidos separadamente.

## Cadeia local preparada

```text
prisma/migrations/
  migration_lock.toml
  0_base_legada/migration.sql
  20261108020000_estrutura_conteudo_migracao/migration.sql

prisma/baseline/
  schema-legado.prisma

prisma/historico-arquivado/
  <quatro diretórios originais, sem alterar seus SQLs>
  manifesto.json
  schema-resultante.prisma
```

Os hashes dos quatro arquivos arquivados são verificados pelos testes. `schema-resultante.prisma` representa logicamente o resultado desses scripts para comparação; não é usado como schema da aplicação. O diretório arquivado fica fora da cadeia ativa do Prisma Migrate.

O baseline contém somente as cinco tabelas legadas, seus tipos/defaults/PKs, SERIAL e RLS. Não inclui dados, valores correntes das sequências, roles gerenciadas pelo Supabase ou as estruturas editoriais novas. O gerador valida as configurações das sequências antes de emitir SERIAL; estruturas desconhecidas interrompem a geração. Na origem existente, registrar o baseline futuramente não executa seu CREATE TABLE nem reinicia sequências.

Na migração editorial, a parte estrutural continua igual ao diff local baseline → schema principal. Foram acrescentados comandos de RLS para as 17 tabelas novas: o catálogo mostrou grants padrão para clientes, e o fluxo planejado grava pelo servidor. Não foram criadas policies de escrita do navegador. O uso de roles diferentes de owner/service role deverá ser ensaiado no ambiente de destino; o schema Prisma não modela esse aspecto.

## Runbook futuro — NÃO executado nesta entrega

Este procedimento distingue banco já populado de banco vazio. Conforme o [fluxo de baselining do Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining), registrar uma migração como aplicada evita executar novamente a criação de estruturas que já existem. A instalação local foi conferida como Prisma 6, com as flags disponíveis no próprio CLI.

### Banco existente observado

1. Antes de qualquer escrita futura, confirmar identidade do ambiente, backup/restauração, revisão do código e snapshot recente. Reexecutar a reconciliação somente leitura e confirmar que o SQL gerado coincide com o baseline versionado. Se o catálogo ou histórico mudou, interromper e reconciliar novamente.
2. O ensaio isolado foi concluído em PostgreSQL 17.11 para a origem observada em 17.6: baseline em banco vazio, registro do baseline em banco povoado, migração editorial, checksums, preservação de blobs e RLS. Veja o [relatório da CLI Prisma](validacao-cli-prisma-baseline-2026-11-07.md). Antes de uma escrita remota, repetir a validação em staging compatível com o Supabase de destino e conferir a plataforma/permissões. Não apontar shadow database, reset ou testes de replay para o Supabase existente.
3. Em uma entrega de escrita autorizada, selecionar explicitamente a conexão de administração/migração do ambiente, mantendo o diretório ativo correto. Registrar **somente** `0_base_legada` como aplicado. O comando abaixo está documentado e **não foi executado**:

   ```sh
   yarn exec prisma migrate resolve --applied 0_base_legada --schema prisma/schema.prisma
   ```

   Esse comando grava em `_prisma_migrations`; não é uma consulta nem um dry-run. Não usar a credencial readonly para tentar contornar essa etapa.
4. Conferir que só o baseline foi registrado e que a migração editorial permanece pendente. A criação das 17 tabelas/2 enums será uma operação posterior, após ensaio e revisão de permissões/RLS. Não executar `migrate deploy` antes de registrar o baseline: ele tentaria criar as tabelas legadas existentes.
5. Atualizar a evidência com hashes e ambiente. Outros bancos com histórico já registrado exigem reconciliação própria antes de adotar a cadeia arquivada; não apagar o histórico remoto para forçar compatibilidade.

### Banco novo e vazio

Aplicar o baseline como migração normal cria as cinco tabelas e sequências. Não usar `resolve --applied` nesse banco vazio, pois isso registraria tabelas que ainda não existem. Configurar roles/grants da plataforma separadamente, ensaiar o restante da cadeia e só então importar dados. Depois de importar IDs existentes em outro banco, ajustar as sequências é tarefa do importador, não do baseline.

## Validação e limites

- `prisma validate` aprovou schema principal e datamodel do baseline.
- Diff local baseline → schema principal reproduziu a parte estrutural da migração editorial; RLS é o complemento SQL intencional.
- Testes cobrem geração do baseline a partir da amostra do catálogo, tipos de data, blobs, RLS, SQL não destrutivo, metadados desconhecidos bloqueantes, transação somente leitura/rollback, preservação dos quatro hashes e RLS nas tabelas novas.
- `yarn test:coverage`: 22 arquivos e 134 testes aprovados; cobertura geral de 97,18% de linhas e 90,53% de branches. ESLint, TypeScript, links locais e `git diff --check` aprovados. O comando final de reconciliação retornou sem problemas e confirmou igualdade entre baseline gerado e versionado.
- A comparação direta pelo schema engine do Prisma contra a conexão configurada não concluiu e foi interrompida. Não é apresentada como validação aprovada. A inspeção real por `pg`, em transação somente leitura, concluiu normalmente.
- Na entrega inicial não havia PostgreSQL/psql/pg_dump ou Docker no ambiente; depois, PostgreSQL embutido em `/tmp` permitiu executar a cadeia SQL e o PostgreSQL 17.11 permitiu testar a CLI real. A versão local foi 17.11; a origem observada respondeu 17.6.

Na entrega de **07/11/2026**, o baseline estava preparado localmente e ainda não havia sido aplicado no Supabase. A reconciliação documenta o estado observado na origem e os ensaios isolados.

### Atualização de 08/11/2026

Após confirmação do usuário de que o projeto era staging isolado e o banco estava vazio, `prisma migrate deploy` aplicou `0_base_legada` e `20261108020000_estrutura_conteudo_migracao` nesse destino. A verificação remota somente leitura confirmou 22 tabelas, grants/RLS/sequences e checksums corretos. A origem e produção não foram alteradas; nenhum bucket, objeto ou conteúdo foi criado.

Depois, em 08/11/2026, o responsável autorizou a importação no mesmo staging isolado. O bucket foi criado e os dados foram carregados e verificados; os resultados estão no [relatório da importação](importacao-staging-conteudo-2026-11-08.md). A observação acima descreve o estado logo após aplicar o schema.
