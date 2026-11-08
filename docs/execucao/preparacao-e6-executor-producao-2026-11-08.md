# E6 — Executor e pré-flight de produção

Registro de **08/11/2026** na `main` local. Foi preparada a CLI dedicada para consultar o catálogo, registrar o baseline, aplicar as migrações versionadas e importar o conteúdo com confirmações explícitas. A conexão e o Storage de produção foram verificados somente para leitura. **Nenhuma migração, criação de bucket, importação, publicação ou gravação de produção foi feita.**

## Configuração local

`.env.producao.local` está no `.gitignore`, com permissão local restrita, e não foi incluído neste relatório nem versionado. A referência local corresponde ao projeto `ekbgtafcgsjaeahuxojy`; a URL de banco corresponde à mesma identidade da origem registrada no manifesto E0. A conexão de migração é distinta da variável de leitura `ORIGEM_DATABASE_URL` e exige TLS. Os kill switches `PRODUCAO_MIGRATIONS_ENABLED` e `PRODUCAO_IMPORT_ENABLED` permanecem `false`.

Não registrar tokens, URLs com senha, connection strings, conteúdo de `.env.producao.local` ou dumps no Git, documentação ou chat.

## Leitura do banco e Storage

O pré-flight de banco usa `default_transaction_read_only=on` e uma transação `REPEATABLE READ READ ONLY`. Em 08/11/2026, conferiu:

| Checagem | Resultado |
| --- | --- |
| Projeto de destino | `ekbgtafcgsjaeahuxojy` |
| Identidade de banco comparada ao manifesto E0 | Correspondente |
| Tabelas do baseline | 5 |
| Colunas do baseline | 25 |
| Histórico `_prisma_migrations` | Ausente |
| Diferença entre catálogo atual e `0_base_legada` | Nenhuma |
| SHA-256 do baseline gerado a partir do catálogo | `0d592e6e82348f0ab001ce12df8305fb225da659f16369047c8e47ca7fcdb6c0` |
| Escritas realizadas pelo pré-flight | 0 |

O `prisma migrate status`, também somente para leitura, encontrou quatro migrações locais pendentes: `0_base_legada`, `20261108020000_estrutura_conteudo_migracao`, `20261108030000_publicacao_ordem_seo_legado` e `20261108040000_retencao_midia_sem_vinculo`. Isso é compatível com a ausência do histórico remoto observada no catálogo. O baseline versionado corresponde ao estado atual; ao registrá-lo, o comando `migrate resolve` marca a migração como aplicada sem executar seu SQL. Depois disso, `migrate deploy` pode aplicar as três migrações seguintes.

O endpoint de Storage respondeu HTTP 200 à consulta autenticada local e listou **zero buckets**. Nenhum bucket foi criado. O próximo importador só cria/verifica o bucket após receber `--criar-bucket`, a confirmação do nome e a trava `PRODUCAO_IMPORT_ENABLED=true`.

## Snapshot e backup locais atualizados

O inventário local foi corrigido para as rotas dinâmicas atuais da `main`: contatos, menu e seções da home agora são extraídos dos defaults literais compartilhados; as configurações padrão são projetadas para as chaves estáveis que o runtime já consulta. O parser continua sem executar componentes ou funções do site.

O snapshot de pré-corte atual está em `.conteudo-migracao/e6-preflight-main-2026-11-08/inventario.json`, fora do Git, com modo `600`. Ele registra o commit local `2665a959d9500f4b6a5f3c0de0c0c1c240d1e5c7` e SHA-256 `f1234231e25958c17198670ecc88e4aa79a4799df330533fced5a2705d7b09b1`. Inclui 67 fontes, 70 arquivos/mídias e não reporta arquivos ausentes nem conflitos. Os quatro conjuntos de dados (`integrantes`, `espetáculos`, `prêmios`, `projetos`) e os hashes das 70 mídias coincidem com o manifesto E0 do deploy `c05ce1b`.

Os 93 registros das cinco tabelas e os seis blobs da origem também coincidem por hash com o snapshot E0 anterior; não há delta desde aquela leitura. O dry-run local do importador validou 61 mídias únicas (17.498.114 bytes), 37 configurações, 4 contatos, 10 itens de menu, 4 seções de home, 6 integrantes, 2 espetáculos, 1 prêmio, 3 galerias/41 fotos e 13 páginas. Os 93 registros legados serão conciliados no mesmo banco. Nenhuma gravação foi feita.

Um novo dump custom de `public` foi gerado em modo somente leitura/TLS e guardado em `.conteudo-migracao/backups/`, com diretório `700` e arquivo `600`:

| Artefato | Bytes | SHA-256 | Validação |
| --- | ---: | --- | --- |
| `amargem-public-final-corte-2026-11-08.dump` | 2.276.721 | `decc94694107060211cafbc0af8022b861071b328644b008b65aa67e5fa72981` | Índice custom lido por `pg_restore --list`, 38 entradas |

O manifesto privado do dump é `manifesto-e6-final-corte-2026-11-08.json`. O ensaio de restore em PostgreSQL 17.11 isolado documentado no [relatório de backup E6](preparacao-e6-backup-restauracao-2026-11-08.md) foi feito com o dump anterior; este novo arquivo tem os mesmos bytes de escopo e catálogo observado, mas não foi restaurado de novo. Repetir dump e comparação de delta se houver intervalo ou gravação de conteúdo antes do corte.

## Proteções implementadas

- `scripts/migrar-schema-producao.mjs` oferece `check`, `preflight`, `status`, `baseline` e `deploy`. As operações de escrita exigem `--aplicar`, kill switch local, projeto, topologia, manifesto/hash/commit e confirmação específica para o baseline ou deploy.
- `scripts/conteudo/cli-producao.mjs` exige confirmação explícita para o mesmo banco, referência do projeto, manifesto, commit e bucket; prepara e valida os arquivos antes de começar a importação.
- `scripts/conteudo/executor.mjs` continua recusando produção sem a confirmação interna recebida exclusivamente pelo executor dedicado.
- A leitura read-only do PostgreSQL agora exige TLS para hosts Supabase quando `sslmode=require` estiver configurado ou omitido.
- Os comandos locais são `yarn migrate:producao` e `yarn conteudo:migrar:producao`.

Os verificadores de configuração, conexão e executor passaram em **17 testes** direcionados; inventário, adaptadores e preparação passaram em **9 testes** direcionados. Os arquivos de CLI passaram em `node --check`; `git diff --check` não reportou problemas. Esses testes locais não substituem a conferência final imediatamente antes da gravação nem a verificação pós-carga.

## Próxima sequência do corte

1. Imediatamente antes das escritas, regerar inventário/snapshot e delta; confirmar novamente conteúdo, hashes, relações, referências, blobs, buckets e deploy ativo. O snapshot e dump locais atuais são a referência de revisão, não substituem esse último corte.
2. Publicar a `main` local em uma janela coordenada, após autorização, e conferir a versão do deploy. A `main` local está commitada em `2665a95`, mas continua sem push.
3. Com autorização explícita, registrar `0_base_legada` como aplicada, executar `migrate deploy` para as três migrações aditivas e confirmar o status do Prisma.
4. Com autorização explícita, criar/configurar o bucket público e executar a importação automática com o manifesto do corte; verificar contagens, hashes de mídia, referências, idempotência e erros.
5. Só então habilitar o leitor novo na publicação, fazer smoke de páginas/admin/imagens/sitemap e observar logs. Manter a versão anterior e o caminho de rollback prontos.

As etapas 4–6 alteram o projeto de produção. O pré-flight atual não concede autorização para executá-las. Não fazer push/deploy até a versão, a janela e a sequência do corte estarem autorizadas.
