# Validação da CLI Prisma com o baseline

Complemento de **07/11/2026** ao [ensaio SQL em PostgreSQL isolado](ensaio-baseline-postgresql-isolado-2026-11-07.md). A CLI Prisma 6.17 foi executada em cenários vazio e povoado. Os ensaios iniciais usaram PGlite/PostgreSQL 18.6; este complemento repete a cadeia em PostgreSQL 17.11, mesma versão principal observada na conexão configurada para a origem (17.6). Nenhum comando de escrita foi direcionado ao Supabase.

## Versão observada na origem

Em consulta somente leitura, a conexão configurada respondeu PostgreSQL **17.6** (`server_version_num=170006`), banco `postgres`, role `postgres`. `public._prisma_migrations` não existe. A consulta não identificou por si só se essa origem é produção nem confirmou que ela é o projeto de destino da futura migração.

## PostgreSQL 17.11 isolado

O binário PostgreSQL 17.11 foi obtido em `/tmp`, sem adicionar dependência ao projeto. O servidor escutou apenas em `127.0.0.1:55434`, usou bases descartáveis e foi encerrado após a verificação.

### Banco vazio

Executei `prisma migrate deploy`. A CLI encontrou e aplicou, em ordem, `0_base_legada` e `20261108020000_estrutura_conteudo_migracao`.

### Banco preexistente com dados

Em outra base descartável, executei somente o SQL do baseline para simular o estado legado e inseri cinco registros fictícios, um por tabela, incluindo dois blobs binários. Em seguida:

```sh
DATABASE_URL='postgresql://...@127.0.0.1:55434/amargem_pg17_existing?schema=public' \
  yarn exec prisma migrate resolve --applied 0_base_legada --schema prisma/schema.prisma
DATABASE_URL='postgresql://...@127.0.0.1:55434/amargem_pg17_existing?schema=public' \
  yarn exec prisma migrate deploy --schema prisma/schema.prisma
DATABASE_URL='postgresql://...@127.0.0.1:55434/amargem_pg17_existing?schema=public' \
  yarn exec prisma migrate status --schema prisma/schema.prisma
```

`migrate resolve` registrou somente o baseline; `migrate deploy` aplicou somente a migração editorial; `migrate status` informou que o schema estava atualizado.

## Resultados verificados

- `_prisma_migrations` tem exatamente as duas entradas esperadas, ambas concluídas e sem rollback. Os checksums coincidem com os arquivos SQL locais:
  - baseline: `0d592e6e82348f0ab001ce12df8305fb225da659f16369047c8e47ca7fcdb6c0`
  - migração editorial: `c4ab75a0bdd14ce0954254eb4fe70d216dd9163e6112255ba0f06cdd9663a866`
- As cinco linhas de exemplo foram preservadas; os bytes dos blobs continuaram `00ff0102` e `080007ff`.
- Existem 22 tabelas da aplicação, todas com RLS habilitado, e os enums `EstadoImportacao` e `EstadoPublicacao`.
- Com grants explícitos de tabela para uma role `anon`, nenhuma linha ficou visível. A tentativa de inserir em `CanalContato` foi negada com SQLSTATE `42501` por falta de policy.
- O banco vazio também concluiu a cadeia integral via CLI.

Os testes anteriores em PGlite/PostgreSQL 18.6 cobriram os mesmos fluxos da CLI e o replay dos quatro SQLs históricos. PostgreSQL 17.11 aproxima melhor a origem, mas o patch level ainda difere de 17.6. A validação em ambiente de staging compatível continua necessária para conferir a plataforma, os grants/default privileges específicos do projeto, `auth`/`storage`, backup e restauração. A versão e a ausência de histórico foram consultadas remotamente somente para leitura; nenhuma tabela, migração, policy, role ou conteúdo foi gravado na origem.

O fluxo `migrate resolve --applied` registra uma migração como aplicada e evita executar novamente o SQL do baseline já existente, conforme o [guia oficial de baselining do Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining). O comando foi usado apenas nas bases locais efêmeras.
