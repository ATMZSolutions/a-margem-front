# Orquestrador da importação, validado localmente

Em 08/11/2026, foi preparado o fluxo de execução sobre os DTOs do inventário. O módulo `scripts/conteudo/executor.mjs` recebe repositório e Storage por injeção; não cria cliente Prisma nem lê credenciais. Os testes deste relatório usam adaptadores em memória.

## Fluxo implementado

- Só aceita `staging`, referência explícita de destino, hashes do manifesto/origem, commit e limites/MIME do bucket compatíveis com as mídias.
- Deriva IDs estáveis para execução e itens, registra estados `PENDENTE`, `ENVIADO`, `VINCULADO`, `VERIFICADO`, `ERRO` e `CONFLITO` e verifica a identidade da execução retomada.
- Confirma ou cria o bucket apenas por meio do adaptador injetado, com `allowCreateBucket` explícito; envia/verifica cada mídia antes de registrar sua linha `Midia`.
- Consulta o destino e o último item verificado para a mesma chave e destino. Conteúdo igual é adotado; uma fonte nova atualiza somente se o destino ainda tiver o último hash importado; edição externa vira conflito.
- Se uma gravação ocorreu antes de uma interrupção, compara o hash no destino e adota o conteúdo já igual à fonte. Uploads repetidos são delegados ao adaptador Storage idempotente.
- Falhas atualizam o item e a execução com código genérico, sem persistir mensagens ou dados sensíveis da exceção.

O contrato exige `obterUltimoItemVerificado(destinoSha256, chaveOrigem)`, que localiza `ItemImportacao` verificado associado a uma execução do mesmo destino. O adaptador Prisma/PostgreSQL, a normalização de hashes e o comando de staging protegido foram adicionados depois; consulte o [relatório do adaptador](adaptador-prisma-local-2026-11-08.md). A execução real e sua repetição idempotente estão registradas em [importação do conteúdo em staging](importacao-staging-conteudo-2026-11-08.md).

## Ensaios locais

`scripts/conteudo/executor.test.mjs` cobre criação e repetição, atualização condicional, edição externa concorrente, retomada após falha e recusa de produção. O repositório falso preserva execuções/itens/destinos em mapas; o Storage falso guarda bytes em memória. Não há `fetch`, Prisma ou conexão PostgreSQL neste ensaio.

Validação executada em 08/11/2026:

- ESLint nos módulos e testes do executor: aprovado.
- `yarn test:run scripts/conteudo/`: 7 arquivos, 35 testes aprovados.
- `git diff --check`: aprovado.

## Pendências antes de staging

1. Repetir a integração em PostgreSQL 17 e conferir RLS/grants e checksums com o papel destinado ao staging.
2. Confirmar topologia, identidade e permissões do projeto/bucket de staging; não inferir pelo `.env` da aplicação.
3. Ensaiar de ponta a ponta com o comando protegido em staging identificado, sem habilitar produção.

Este avanço não registrou nada no Supabase nem em outro banco remoto.

### Atualização de 08/11/2026

Após a entrega local, o executor foi usado no projeto Supabase de staging isolado. A execução e sua repetição integral verificaram os 326 itens. Nenhum comando deste relatório foi alterado retroativamente; detalhes e correções encontradas durante a carga estão no [relatório de importação](importacao-staging-conteudo-2026-11-08.md).
