# Projeção dos DTOs e validação das mídias

Entrega em **07/11/2026**, na `main`, após o ensaio da cadeia Prisma. Este passo prepara o mapeamento local dos dados do site para o schema aditivo. A origem foi consultada em modo somente leitura para atualizar o snapshot. Nenhuma migração, linha, objeto ou bucket foi gravado no Supabase.

## Implementado

- `preparacao.mjs` transforma o manifesto em registros dos modelos novos: mídia/usos, configurações, contatos, menu, aliases, integrantes, espetáculos/seções, prêmios, galerias/fotos, páginas, seções da home e marcos históricos.
- As cinco tabelas legadas são mapeadas separadamente para eventual cópia quando origem e destino forem bancos diferentes. IDs/anos, timestamps em texto, campos e bytes de imagem são preservados; os blobs ficam ligados pelo SHA-256 conferido.
- IDs e chaves de origem são determinísticos. Arquivos com o mesmo SHA-256 compartilham uma mídia e a chave proposta `originais/<sha256>.<ext>`. Cada contexto mantém seu vínculo/legenda.
- A preparação relê os arquivos locais e rejeita mudança de hash/tamanho, caminhos fora da raiz, symlinks, base64 não canônico, hash/tamanho de blob divergente, MIME incompatível e formatos não reconhecidos. Raster passa por assinatura, metadados e decodificação. SVG ativo ou com dependência externa é bloqueado; imagens raster embutidas são conferidas pelo MIME e assinatura.
- `globals.css` não é importado como campo editável. Sua conversão para opções de tema validadas continua pendente; os estilos atuais permanecem na aplicação durante a transição.
- O comando `migrar --dry-run` mantém os DTOs e bytes apenas em memória. Os relatórios gravam contagens, hash da projeção e bloqueios, sem textos completos ou bytes/base64.

## Ensaio com o snapshot atualizado

O inventário foi regenerado com `--ler-banco --usar-banco-atual`. O relatório confirmou a leitura `REPEATABLE READ READ ONLY` com `ROLLBACK`; a origem respondeu PostgreSQL 17.6 e continua sem `public._prisma_migrations`. O `dry-run` integral concluiu com:

- **70 mídias únicas** e **19.030.280 bytes**, somando arquivos referenciados/favicon e seis blobs do banco.
- **233 registros projetados** nos modelos novos: 70 mídias, 19 usos, 39 configurações, 4 contatos, 10 itens de menu, 10 aliases, 6 integrantes, 2 espetáculos, 7 seções, 1 prêmio, 3 galerias, 41 fotos, 13 páginas, 4 seções da home e 4 marcos históricos.
- **93 registros legados mapeados**: Agenda 49, Noticia 15, Livro 2, Projeto 23 e Sobre 4.
- Uma fonte global CSS excluída da configuração editável para conversão posterior em opções seguras.

Comandos executados:

```sh
yarn conteudo:inventariar --ambiente local --ler-banco --usar-banco-atual
yarn conteudo:migrar --ambiente local --dry-run --manifesto .conteudo-migracao/inventario.json
yarn test:run scripts/conteudo/
```

Os cinco arquivos de teste do importador passaram: **25 testes aprovados**. O ensaio da CLI Prisma contra PostgreSQL 17.11, incluindo o cenário vazio e o cenário povoado, está no [relatório de validação do baseline](validacao-cli-prisma-baseline-2026-11-07.md).

## Bloqueios e próxima etapa

O relatório do `dry-run` preserva três bloqueios: a origem não possui histórico Prisma, a identidade do projeto/bucket de destino ainda não foi verificada e o executor com upload, persistência de execução e retomada ainda não existe. Antes de qualquer staging, é necessário confirmar se será um banco vazio ou uma cópia da origem, aplicar o fluxo correspondente de baseline e conferir as permissões do Storage.

O mapeamento não executa inserção, `resolve`, `deploy`, upload, criação de bucket nem alteração de sequência. O adaptador Storage com teste falso foi preparado em entrega posterior; integração ao executor e persistência por item continuam pendentes. A aplicação real permanece desabilitada até o ensaio em staging identificado.
