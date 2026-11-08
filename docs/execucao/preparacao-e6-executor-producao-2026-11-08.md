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

## Proteções implementadas

- `scripts/migrar-schema-producao.mjs` oferece `check`, `preflight`, `status`, `baseline` e `deploy`. As operações de escrita exigem `--aplicar`, kill switch local, projeto, topologia, manifesto/hash/commit e confirmação específica para o baseline ou deploy.
- `scripts/conteudo/cli-producao.mjs` exige confirmação explícita para o mesmo banco, referência do projeto, manifesto, commit e bucket; prepara e valida os arquivos antes de começar a importação.
- `scripts/conteudo/executor.mjs` continua recusando produção sem a confirmação interna recebida exclusivamente pelo executor dedicado.
- A leitura read-only do PostgreSQL agora exige TLS para hosts Supabase quando `sslmode=require` estiver configurado ou omitido.
- Os comandos locais são `yarn migrate:producao` e `yarn conteudo:migrar:producao`.

Os verificadores de configuração, conexão e executor passaram em **17 testes** direcionados. Os três arquivos de CLI passaram em `node --check`; `git diff --check` não reportou problemas. Esses testes locais não substituem o backup final, o delta de dados ou a verificação pós-carga.

## Próxima sequência do corte

1. Regerar o inventário e snapshot de produção imediatamente antes do corte; conferir o commit publicado, dados atuais, contagens, hashes, relações, referências e blobs. O manifesto E0 existente é histórico e não deve ser usado como snapshot final sem revalidação.
2. Gerar e ensaiar um novo backup local de `public`, manter os arquivos fora do Git e confirmar novamente o escopo/limites do backup Free. O Storage será exportado/conferido separadamente se houver objetos nesse momento.
3. Revisar e commitar a preparação local; depois publicar a `main` em uma janela coordenada, conferindo a versão do deploy. A `main` local ainda não foi publicada nesta etapa.
4. Com autorização explícita, registrar `0_base_legada` como aplicada, executar `migrate deploy` para as três migrações aditivas e confirmar o status do Prisma.
5. Com autorização explícita, criar/configurar o bucket público e executar a importação automática com o manifesto final; verificar contagens, hashes de mídia, referências, idempotência e erros.
6. Só então habilitar o leitor novo na publicação, fazer smoke de páginas/admin/imagens/sitemap e observar logs. Manter a versão anterior e o caminho de rollback prontos.

As etapas 4–6 alteram o projeto de produção. O pré-flight atual não concede autorização para executá-las. Não fazer push/deploy até a versão, a janela e a sequência do corte estarem autorizadas.
