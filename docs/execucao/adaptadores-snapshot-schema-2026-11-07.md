# Adaptadores, leitura do banco e schema aditivo

Segunda entrega em 07/11/2026, na `main`, ainda sobre `c05ce1b` com alterações locais. Continuação do [inventário inicial](inventario-conteudo-2026-11-07.md) e das etapas E0/E1 do [plano](../planejamento/plano-execucao-conteudo-supabase.md).

## Entregue

- Adaptadores AST de contatos e configurações: 4 canais conciliados entre home/página, 10 itens de menu, 10 aliases (incluindo a regra dinâmica JPG/WebP) e 40 conjuntos versionados de configuração. Os conjuntos preservam SEO, textos, imagens/alt, CTAs, classes/estilos, CSS legado, defaults, limites, temporizações e ordem de seções.
- Leitor PostgreSQL explícito: `default_transaction_read_only=on`, snapshot `REPEATABLE READ READ ONLY`, timeouts locais e `ROLLBACK` inclusive no sucesso. SELECT de colunas, das cinco tabelas legadas e do histórico Prisma quando presente. Blobs exportados localmente com hash/base64, sem enviar ao Storage.
- Conferência automatizada dos nomes/checksums e estado das migrações, com registro de ausência de baseline. O leitor valida as colunas necessárias à extração, não todas as constraints/políticas do banco.
- Estrutura aditiva no schema Prisma: 17 tabelas e 2 enums para mídia/usos, configurações, contatos/menu, conteúdo editorial, galerias, marcos históricos, aliases e rastreamento de importação.
- SQL gerado por comparação de datamodels locais em `prisma/migrations/20261108020000_estrutura_conteudo_migracao/migration.sql`. Não foi aplicado. Nenhuma tabela/coluna antiga é removida ou alterada por esse SQL; FKs são criadas entre tabelas novas.

O schema preserva `Sobre.ano` como PK da aplicação atual. A nova `MarcoHistorico` permite múltiplos marcos por ano e tem referência opcional ao ano legado. A futura troca de leitores/formulários continua separada desta entrega. Configurações usam payload JSON versionado; validação de edição e mapeamento para módulos do painel ainda pertencem às próximas entregas.

## Leitura real executada

Executado `yarn conteudo:inventariar --ambiente local --ler-banco --usar-banco-atual`, usando explicitamente a conexão já configurada em `DATABASE_URL` como origem. `local` identifica o inventário, não classifica o servidor de origem como local ou staging. Não foi confirmada a revisão publicada nem a identidade de um projeto de destino.

| Tabela | Registros |
| --- | ---: |
| Agenda | 49 |
| Noticia | 15 |
| Livro | 2 |
| Projeto | 23 |
| Sobre | 4 |
| **Total** | **93** |

Foram exportadas 6 imagens em blob, somando 2.049.158 bytes. O inventário de arquivos do checkout continua com 70 arquivos, 17.316.784 bytes e nenhuma referência estática ausente.

A simulação combinada planejou 193 entidades de importação e 70 objetos únicos, incluindo os 6 blobs. Essas contagens são DTOs/fontes de importação, não a quantidade final de linhas em todas as tabelas relacionais. Blobs ainda exigem validação de MIME/formato antes de upload.

**Constatação bloqueante para deploy:** `public._prisma_migrations` não existe na origem consultada. Os cinco arquivos de migração locais, incluindo o novo, não podem ser tratados automaticamente como pendências seguras para aplicar. É necessário comparar schema real/histórico e preparar baseline sem reaplicar o SQL antigo que remove colunas de imagem. Nenhuma reconciliação ou marcação de migração foi gravada no banco.

## Artefatos e validação

O snapshot fica em `.conteudo-migracao/inventario.json`, ignorado no Git e com permissão 0600. Contém conteúdo e imagens, mas não credenciais. A simulação fica no mesmo diretório, sem repetir os bytes/base64. Comandos e limites estão em [`scripts/conteudo/README.md`](../../scripts/conteudo/README.md).

Schema validado por `prisma validate`; SQL gerado offline. `yarn test:coverage`: 21 arquivos e 128 testes passaram; cobertura geral de 96,95% de linhas e 90,50% de branches. Testes cobrem contatos divergentes, redirects alterados, extração da home/SEO, leitura somente leitura/rollback, preservação de blob/data, schema incompatível, histórico/checksum, deduplicação e inclusão dos dados do banco no plano. ESLint, TypeScript (`tsc --noEmit`), links locais e `git diff --check` passaram.

## Próximos passos

1. Confirmar revisão publicada e reconciliar baseline/schema real, inicialmente com relatório e ensaio isolado.
2. Mapear DTOs para as tabelas novas e validar MIME/conteúdo dos blobs.
3. A [projeção dos DTOs e validação de mídias](projecao-dtos-midias-2026-11-07.md) foi concluída em modo local; a cadeia Prisma também foi ensaiada em PostgreSQL 17.11 isolado.
4. Confirmar identidade/topologia do destino, integrar o adaptador Storage ao executor com persistência/retomada, e ensaiar em staging antes de qualquer aplicação remota.

Não houve aplicação de migrações, criação de bucket, upload ou gravação de conteúdo no Supabase.
