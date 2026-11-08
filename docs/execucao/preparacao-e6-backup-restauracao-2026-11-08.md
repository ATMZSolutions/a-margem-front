# E6 — backup e ensaio de restauração

Registro de **08/11/2026** na branch `dev`. Foi gerado um backup lógico do schema `public` da origem de produção, verificada a disponibilidade de backup no painel e restaurado o arquivo custom em PostgreSQL 17.11 isolado. O replay complementar em PGlite validou campos e blobs. Nenhuma gravação foi feita na origem, no projeto Supabase de produção ou no staging.

## Origem e cobertura

A conexão `ORIGEM_DATABASE_URL` aponta para o projeto `ekbgtafcgsjaeahuxojy`, o mesmo projeto de produção aberto no painel. O `pg_dump` usou conexão TLS e modo somente leitura. O servidor reportou PostgreSQL 17.6 e o cliente utilizado foi `pg_dump` 18.6.

O dashboard do projeto indica plano Free, sem backups gerenciados de banco ou PITR incluídos. A área Storage estava sem buckets no momento da inspeção. Portanto, não havia objetos remotos de Storage para exportar; isso não cobre objetos que venham a ser criados futuramente.

O backup contém somente o schema `public`: as cinco tabelas legadas, dados e sequências. O catálogo confirmou 93 registros, RLS habilitado nas cinco tabelas, nenhum histórico `_prisma_migrations` na origem e nenhum bucket de Storage. Não inclui `auth`, `storage`, roles, privilégios nem configurações gerenciadas da plataforma.

## Arquivos locais

Os arquivos ficam em `.conteudo-migracao/backups/`, ignorado pelo Git, com pasta em modo `700` e arquivos em `600`:

| Artefato | Formato | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `amargem-public-2026-11-08.dump` | Arquivo custom do `pg_dump` | 2.276.721 | `97f118b58f82454e2b4e25c7820fbe84e3411c61e2da5e9ec2aca7fe29293cb8` |
| `amargem-public-2026-11-08-inserts.sql` | SQL com 93 `INSERT`s, sem `COPY` | 4.130.343 | `07702caf3ad4290c4adc3c4cad7783bb687f5658e63a78452da74fc5783263f0` |

O manifesto local `manifesto-e6-2026-11-08.json` registra hashes, versões, escopo, contagens e resultado do ensaio. Estes artefatos são uma cópia local de recuperação do conteúdo e não estão versionados nem enviados ao remoto.

## Ensaios executados

1. O arquivo custom foi aberto com `pg_restore --list`: 38 entradas no índice do arquivo, incluindo dados das cinco tabelas e quatro sequências.
2. O arquivo custom foi restaurado com `pg_restore` 18.6, em uma única transação, em uma base descartável do PostgreSQL 17.11. As cinco tabelas foram conferidas por contagem (93 linhas), RLS estava ativo nas cinco, havia quatro sequências e nenhuma política personalizada em `public`. Escritas externas: zero.
3. Separadamente, o SQL com `INSERT`s foi reproduzido em uma instância PGlite 18.6 em memória. Foram removidos somente os comandos de proteção `\restrict`/`\unrestrict` do `psql` e a criação de `public`, schema que já existia na instância.
4. No replay PGlite, todos os campos e timestamps coincidiram; os seis blobs, totalizando **2.049.158 bytes**, conferiram em tamanho e SHA-256. Nenhuma escrita externa foi feita.

O restore do arquivo custom valida a compatibilidade do dump `public` com PostgreSQL 17.11. O replay PGlite valida, adicionalmente, os campos e blobs do payload. **Nenhum dos dois é uma restauração integral do projeto Supabase**: o dump foi limitado a `public` e não inclui schemas gerenciados, roles, configuração da plataforma nem objetos do Storage.

O manifesto de conteúdo da E0 também foi validado separadamente: ele liga as 58 fontes e 70 mídias ao SHA informado para o deploy (`c05ce1b791569f4c577571f7cef236708b64f3aa`). Esse snapshot é útil para a importação e conferência dos ativos versionados, mas não substitui o dump do banco.

## Limites e ações restantes

E6 ainda não está concluída. Antes da carga e do corte em produção, falta:

1. Preparar o delta final entre o snapshot confirmado e o estado atual, aplicar somente migrações aditivas revisadas e comparar contagens, campos, hashes, sequências e referências.
2. Inspecionar e tratar separadamente quaisquer novos objetos de Storage; a observação atual encontrou zero buckets em produção.
3. Promover a versão revisada de `dev` para `main`, identificar o deploy e fazer uma janela de corte com plano de reversão.
4. Antes de qualquer escrita de schema, carga, criação de bucket ou habilitação do novo leitor em produção, apresentar o plano concreto e obter autorização explícita. Nenhuma dessas escritas foi feita nesta preparação.

O Supabase descreve que backups do banco não incluem bytes de objetos Storage; veja [backups de banco](https://supabase.com/docs/guides/platform/backups), [backup e restore pela CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) e [download de objetos](https://supabase.com/docs/guides/storage/management/download-objects). O plano Free não disponibilizou backup gerenciado na interface examinada; nenhuma alteração de plano foi feita.

## Git

Esta atualização permanece na `dev`. `main` e `origin/main` continuam em `c05ce1b791569f4c577571f7cef236708b64f3aa`; `dev` está 25 commits à frente de `origin/dev`. Não houve merge, push nem deploy.
