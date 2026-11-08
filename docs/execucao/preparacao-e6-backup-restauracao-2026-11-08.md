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

## Comparação somente leitura: origem e staging

Em 08/11/2026, a origem (`ekbgtafcgsjaeahuxojy`) e o staging (`fyhihydxigsrcxfrtmcz`) foram consultados em transações `REPEATABLE READ READ ONLY`. O status do Prisma confirmou quatro migrações e `Database schema is up to date` no staging. Uma comparação inicial pelo Prisma gerado encontrou `Agenda.ordem` ausente na origem; isso é esperado, pois `ordem`, `estado` e `seo` foram adicionados pela E5 apenas no staging. A comparação foi refeita usando as colunas do baseline legado em ambas as bases.

Os hashes abaixo cobrem todas as colunas legadas por linha, ordenadas pela chave primária; os blobs foram normalizados por tamanho e SHA-256. As cinco tabelas conferem, sem delta de dados legado entre origem e staging neste instante:

| Tabela | Linhas | SHA-256 (origem = staging) |
| --- | ---: | --- |
| Agenda | 49 | `d47f89707d0035420d23def668a771a63548c25484ee662e445539ca201d90c4` |
| Noticia | 15 | `c600930e4969e9bd7c48646db1786f93a1b2517ba298f5d47795625ece7cb2d5` |
| Livro | 2 | `5e06c91307047e30c2e102185da2a5ed44972acbc9eb6f674c6c556ddd3bba6b` |
| Projeto | 23 | `52f2030e1eff28f6e01ba0044dfbb33c180f839a802cb72fcdc5ee739e9b3294` |
| Sobre | 4 | `9343a6a977700d14e3103bbcca6ab6b3cd2779b582d5a583d6807716ae94af92` |

Esse resultado confirma os cinco conjuntos legados no momento da leitura; o delta precisa ser repetido imediatamente antes do corte, pois a origem pode receber novas gravações até lá. As colunas novas de E5 foram conferidas no staging pelo status da cadeia e permanecem ausentes na origem até a aplicação autorizada das migrações.

## Limites e ações restantes

E6 ainda não está concluída. O executor dedicado foi preparado e seu [pré-flight de produção](preparacao-e6-executor-producao-2026-11-08.md) confirmou, por leitura somente leitura, o schema correspondente ao baseline, a ausência do histórico Prisma e zero buckets. O status do Prisma listou quatro migrações pendentes. Os dois kill switches de produção permanecem desligados. Antes do corte ainda falta:

1. Repetir o inventário/snapshot e o delta imediatamente antes do corte; comparar contagens, campos, hashes, sequências e referências.
2. Gerar e ensaiar um novo backup local de `public`; reexaminar Storage para determinar se já há objetos.
3. Revisar/commitar a preparação e publicar a `main` local com a versão de transição; identificar o deploy ativo.
4. Obter autorização explícita antes de registrar o baseline, aplicar migrações, criar/configurar bucket, importar conteúdo ou habilitar o novo leitor.
5. Após o corte, verificar contagens, hashes, relações, URLs, mídias e smoke público/admin; registrar retenção e plano de reversão.

Nenhuma migração, criação de bucket, importação, publicação ou gravação de produção foi feita nesta preparação. `ORIGEM_DATABASE_URL` continua somente leitura e não deve ser reutilizada para gravações.

O Supabase descreve que backups do banco não incluem bytes de objetos Storage; veja [backups de banco](https://supabase.com/docs/guides/platform/backups), [backup e restore pela CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) e [download de objetos](https://supabase.com/docs/guides/storage/management/download-objects). O plano Free não disponibilizou backup gerenciado na interface examinada; nenhuma alteração de plano foi feita.

## Git

O conteúdo de `dev` foi integrado localmente em `main` pelo merge `66dc909833fed3a62cbbb211f8228eaf4e1fcefc`, preservando `c05ce1b791569f4c577571f7cef236708b64f3aa` como ancestral. `origin/main` permanece em `c05ce1b791569f4c577571f7cef236708b64f3aa`; não houve push nem deploy.
