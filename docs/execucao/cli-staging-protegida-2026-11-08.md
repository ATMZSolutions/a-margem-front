# CLI de importação em staging: guardrails e status

Em 08/11/2026, `scripts/conteudo/cli-staging.mjs` foi conectado ao executor, ao repositório Prisma e ao adaptador Storage. Depois da confirmação do responsável de que o projeto era staging isolado e estava vazio, o comando foi executado duas vezes com o mesmo manifesto. A CLI normal continua limitada ao inventário e ao `dry-run`.

Na revisão seguinte do runbook, foram corrigidos os exemplos antigos de `--apply`/`--resume`: a CLI real usa `--aplicar`, confirma projeto, topologia e SHA do manifesto, e não tem modo staging `--dry-run` nem subcomando de verificação. O executor retoma a execução determinística ao receber os mesmos dados.

Depois, foi adicionado `.env.staging.local`, ignorado pelo Git. A configuração local foi validada sem exibir valores e o manifesto passou na verificação de integridade.

Durante o preflight inicial, `STAGING_IMPORT_ENABLED` estava ativo no arquivo local; a gravação só começou após a autorização explícita do usuário para executar o plano no staging. O arquivo `.env.staging.local` permanece ignorado pelo Git e seus valores não foram incluídos na saída.

## Travas de execução

O comando encerra antes de criar clientes/requisições se faltar qualquer confirmação:

- `--ambiente staging --aplicar` é obrigatório; produção é rejeitada.
- `STAGING_IMPORT_ENABLED=true`, `STAGING_PROJECT_REF`, `STAGING_DATABASE_URL`, `STAGING_SUPABASE_URL`, chave privilegiada e parâmetros explícitos do bucket são obrigatórios.
- `--destino-ref` e `--confirmar-destino` devem coincidir com `STAGING_PROJECT_REF`. A URL da API e o host/user PostgreSQL também precisam corresponder à referência.
- `--topologia` deve coincidir com `STAGING_ORIGEM_DESTINO` e `--confirmar-topologia`. Para `mesmo-banco`, o hash do endpoint precisa coincidir com o snapshot; para bancos separados, precisa divergir.
- `--confirmar-manifesto` exige o SHA-256 exato do snapshot. O snapshot precisa conter identidade SHA-256 da origem; as mídias e DTOs são revalidados localmente antes da conexão.
- Só carrega `.env.staging.local` e `.env.staging`. Nunca usa `DATABASE_URL` como fallback do destino. A conexão staging é passada explicitamente ao Prisma.
- O repositório confere grants/RLS nas 22 tabelas, `USAGE`/`UPDATE` nas quatro sequences legadas e nomes, estados e checksums locais do baseline `0_base_legada` e da migração editorial. A CLI não aplica migrações.
- O bucket é criado somente com `--criar-bucket`; por padrão apenas é conferido. Upload de mais de 6 MiB bloqueia até a integração de TUS.

As novas secret API keys `sb_secret_` são enviadas somente no header `apikey`. O JWT legado `service_role` continua aceito com `apikey` e `Authorization: Bearer`. O Supabase documenta a transição para as novas chaves e alerta para não enviar secret keys novas como bearer JWT ([API keys](https://supabase.com/docs/guides/getting-started/api-keys), [migração](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)).

## Validação e limites

`staging.test.mjs` cobre referência/URLs, kill switch, `--aplicar`, hash de manifesto, confirmação de topologia, fingerprint do banco e capacidade de MIME/tamanho do bucket. O teste de Storage verifica headers das chaves novas e legadas. O repositório também bloqueia ausência de grants nas sequences. A suíte do importador passou com **50 testes em 9 arquivos** e ESLint aprovado.

O executor/repositório passou em ensaio local com Prisma 6.17 sobre PGlite 18.6 e PostgreSQL 17.11 efêmeros em loopback. No PostgreSQL 17, `prisma migrate deploy` aplicou a cadeia; o preflight bloqueou um papel sem `BYPASSRLS` e aprovou o papel de importação com grants de tabela/sequences e `BYPASSRLS`. Criação, repetição, atualização, cópia dos cinco modelos e ajuste das quatro sequences foram validados. O cluster temporário foi removido. Esse ensaio não identifica o projeto Supabase real nem prova as permissões configuradas nele.

## Schema aplicado e verificação remota

Após o usuário confirmar que o projeto era staging isolado e que o banco estava vazio, foi executado `prisma migrate deploy` com a URL de `STAGING_DATABASE_URL`, sem carregar a `DATABASE_URL` da aplicação. As duas migrações locais foram aplicadas: `0_base_legada` e `20261108020000_estrutura_conteudo_migracao`.

O preflight remoto passou: **22 tabelas**, grants de leitura/escrita, bypass de RLS, `USAGE`/`UPDATE` nas quatro sequences e checksums/estado das duas migrações aprovados. A CLI criou/verificou o bucket e concluiu **326/326 itens**. A repetição integral resultou em **326 ignorados, zero criados e zero atualizados**. A conferência independente está em [importação do conteúdo em staging](importacao-staging-conteudo-2026-11-08.md).

Na conferência final, os 93 registros legados, 326 marcadores e 70 objetos (19.030.280 bytes) corresponderam ao manifesto; não houve hashes divergentes e as quatro sequences ficaram alinhadas aos maiores IDs. A origem e produção não receberam migrações, registros ou arquivos.
