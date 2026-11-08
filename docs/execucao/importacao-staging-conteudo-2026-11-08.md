# Importação do conteúdo em staging

Execução em **08/11/2026**, na `main`, usando o manifesto `4ac9fc1d7ec6093379462f60b58074b708417c7ba01137f0f2890c1f191690fa`, associado ao commit `c05ce1b`. O banco e o Storage pertencem ao projeto de staging isolado confirmado pelo responsável. O processo não alterou a origem nem produção.

## Resultado

- A CLI criou e conferiu o bucket público configurado; a API confirmou os limites e tipos MIME esperados.
- Importação integral: **326/326 itens verificados**, com hashes de origem/destino iguais; 92 itens criados nesta retomada e 234 reaproveitados após as tentativas anteriores.
- Segunda execução integral com o mesmo manifesto: **326 ignorados, 0 criados, 0 atualizados**. A execução existente permaneceu idempotente.
- Os 93 registros legados conferem: Agenda 49, Noticia 15, Livro 2, Projeto 23 e Sobre 4.
- As **70 mídias** foram verificadas por tamanho e SHA-256; total de **19.030.280 bytes**, sem divergências.
- As sequences foram ajustadas e conferidas: Agenda 49/49, Noticia 24/24, Livro 16/16 e Projeto 35/35 (maior ID / último valor).
- O estado final da execução é `VERIFICADO`; preflight, as 22 tabelas, grants/RLS e checksums das duas migrações passaram.

## Correções descobertas durante a execução

1. O GET do Supabase Storage para uma chave inexistente respondeu HTTP 400 com `statusCode: 404`, `error: not_found` e `code: NoSuchKey`. `storage.mjs` reconhecia somente HTTP 404. O adaptador agora trata apenas essa resposta estruturada como ausência; demais HTTP 400 continuam sendo erro. O teste cobre o fluxo de upload e verificação.
2. A busca de `Premio` passava o seletor composto `slug_ano` a `findFirst`. Foi substituída por filtros escalares `slug` e `ano` em `AND`, com teste de busca pela combinação.
3. O ID numérico de modelos legados era encaminhado como número ao campo textual `ItemImportacao.destinoId`. O executor agora converte IDs não nulos para texto; o teste cobre um ID legado numérico. A linha Agenda 1 que já havia sido gravada antes da falha foi identificada pelo hash e reaproveitada, sem duplicação.

Os testes focados de Storage, repositório Prisma e executor passaram (**23 testes em 3 arquivos**); ESLint passou nos seis arquivos alterados. A verificação final remota foi somente leitura.

## Estado do plano

E1 (schema e infraestrutura) e E2 (importação integral em staging) estão concluídas para este manifesto. E0 permanece pendente quanto à confirmação de que o snapshot representa exatamente a revisão publicada. As etapas de integrar as entidades e configurações aos leitores públicos e ao painel continuam em E3–E5; migração/corte de produção continua em E6. Nenhum comando de migração foi executado na origem ou produção.
