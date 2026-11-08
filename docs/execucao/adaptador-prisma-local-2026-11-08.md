# Adaptador PostgreSQL/Prisma, preparado e ensaiado localmente

Em 08/11/2026, foi implementado `scripts/conteudo/repositorio-prisma.mjs`. A fábrica recebe uma instância Prisma criada por quem chama; o módulo não constrói clientes nem lê variáveis de ambiente. A CLI separada de staging prepara o cliente com a conexão explicitamente validada e o injeta no adaptador.

## Persistência preparada

- Cria/retoma `ExecucaoImportacao` e `ItemImportacao` com IDs determinísticos e consulta o item verificado mais recente para a chave e o destino corretos.
- Faz lookup, criação e atualização dos 15 modelos editoriais via delegates Prisma. A projeção do destino usa os mesmos campos do DTO e ignora colunas técnicas.
- Copia `Agenda`, `Noticia`, `Livro`, `Projeto` e `Sobre` com SQL parametrizado e identificadores/tipos definidos por constantes. Preserva IDs, blobs e valores de data; os bytes continuam no banco legado até a etapa de retenção.
- Normaliza timestamp com fuso como instante UTC em microssegundos, e timestamp sem fuso como horário de parede. Assim, uma mudança de `TimeZone` na sessão não cria falso conflito nem altera o horário local legado.
- Usa transação `Serializable` por linha. Reconfere a versão do destino dentro da transação; para as linhas legadas também bloqueia a chave com `FOR UPDATE`. Uma mudança concorrente é sinalizada como conflito.
- Converte `null` dos campos JSON opcionais em `Prisma.DbNull`; o hash continua sendo calculado sobre o DTO antes dessa conversão.
- Expõe `verificarPermissoes`, uma leitura dos catálogos que exige as 22 tabelas, grants de leitura/escrita, capacidade de atravessar RLS e `USAGE`/`UPDATE` nas quatro sequences legadas antes do executor continuar.
- Expõe `ajustarSequenciasLegadas`, que exige `confirmarDestinoDiferente: true`; trata as quatro sequences serial, excluindo `Sobre`, cuja chave é `ano`.

`hashSnapshot` mantém o hash bruto da linha no inventário para auditoria. `hashFonte` passou a representar um hash tipado dos campos transferidos; timestamps são normalizados e blobs contam por tamanho e SHA-256. O leitor de destino usa a mesma função.

## Validação executada

- `scripts/conteudo/repositorio-prisma.test.mjs` usa delegates Prisma e SQL falsos em memória. Cobre persistência/retomada, atualização condicional, edição concorrente, `DbNull`, cópia das cinco tabelas legadas, normalização de timestamps e gates de grants/RLS/sequences.
- A pré-verificação lê `_prisma_migrations` e confere presença, estado e checksum local do baseline e da migração editorial antes de permitir a execução.
- O preflight também exige `USAGE` e `UPDATE` nas quatro sequences ligadas aos modelos legados; sem esses privilégios o executor para antes de criar uma execução de importação.
- A busca de prêmios usa filtros escalares `slug` + `ano` no `findFirst`; IDs legados numéricos são serializados como texto antes de gravar `ItemImportacao.destinoId`.
- ESLint e `yarn test:run scripts/conteudo/`: aprovados, **50 testes em 9 arquivos**.
- O `dry-run` integral com o manifesto local passou: 70 mídias, 93 registros legados e 233 DTOs editoriais/configurações projetados.
- Também houve ensaio de integração com Prisma 6.17 real sobre PGlite/PostgreSQL 18.6 efêmero, disponível apenas em loopback. Foram aplicadas as duas migrações locais ao banco vazio; a pré-verificação aprovou 22 tabelas, a repetição da mesma configuração não duplicou linha, a atualização condicional funcionou, os cinco modelos legados foram copiados/verificados e as quatro sequences foram ajustadas (próximo ID da Agenda: 3 após inserir ID 2).
- O mesmo fluxo foi repetido em PostgreSQL 17.11 isolado com `prisma migrate deploy` e Prisma 6.17. Um papel com grants de tabela/sequences, mas sem `BYPASSRLS`, foi bloqueado antes da importação; um papel com os mesmos grants e `BYPASSRLS` passou pelo preflight. Criação, repetição idempotente, atualização condicional, cópia/verificação dos cinco modelos e ajuste das quatro sequences passaram; o próximo ID da Agenda foi 3 após inserir o ID 2. O cluster de teste em `/tmp` foi removido ao final.

O adaptador foi exercitado em PGlite 18.6 e PostgreSQL 17.11 local; o projeto de origem em PostgreSQL 17.6 não foi alterado. Em 08/11, após a aplicação das migrações ao staging vazio, o preflight remoto foi aprovado para as 22 tabelas, grants/RLS, sequences e checksums. Isso valida o papel configurado nesse staging, sem provar permissões de produção.

## Próxima etapa

1. Integrar as entidades e configurações importadas aos módulos do painel e às páginas públicas (E3–E5).
2. Confirmar a revisão publicada antes de preparar qualquer migração de produção; E0 segue pendente nesse ponto.
3. Planejar separadamente backup, delta e corte de produção (E6), sem reaplicar o baseline ao banco existente.

## Atualização de 08/11/2026: execução remota

A execução em staging concluiu e foi repetida integralmente. O adaptador passou a localizar `Premio` por filtros escalares e o executor converte IDs numéricos legados para texto no marcador. Os testes focados de repositório, executor e Storage passaram (**23 testes em 3 arquivos**) e ESLint passou nos seis arquivos alterados.

O relatório [importação do conteúdo em staging](importacao-staging-conteudo-2026-11-08.md) registra 326 itens verificados, 93 linhas legadas preservadas, 70 arquivos conferidos, sequences alinhadas e segunda execução com 326 ignorados. A origem e produção não foram alteradas.
