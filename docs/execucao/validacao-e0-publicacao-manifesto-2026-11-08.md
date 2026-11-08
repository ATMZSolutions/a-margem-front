# Validação E0 — revisão publicada e manifesto

Verificação complementar em **08/11/2026**. Este documento atualiza a pendência E0 registrada no [relatório de importação](./importacao-staging-conteudo-2026-11-08.md).

## Correspondência entre código, arquivos e manifesto

- A branch `main` local e `origin/main` apontam para [`c05ce1b791569f4c577571f7cef236708b64f3aa`](https://github.com/ATMZSolutions/a-margem-front/commit/c05ce1b791569f4c577571f7cef236708b64f3aa); a branch padrão remota consultada também é `main`.
- O manifesto usado na carga registra esse mesmo commit e o hash interno `4ac9fc1d7ec6093379462f60b58074b708417c7ba01137f0f2890c1f191690fa`.
- Os hashes SHA-256 das **58 fontes** inventariadas foram comparados com os bytes de cada arquivo no commit `c05ce1b`; não houve divergências.
- Os hashes e tamanhos das **70 mídias** inventariadas também foram comparados com os blobs `public/` do commit; não houve divergências.
- O manifesto registra 93 registros legados (Agenda 49, Notícia 15, Livro 2, Projeto 23 e Sobre 4) e seis blobs de imagens do banco. A árvore constava como alterada quando o inventário foi gerado, mas nenhum dos 58 arquivos-fonte ou 70 ativos de mídia inventariados diverge do commit identificado.

Isso confirma que o snapshot de código e mídia usado na importação representa `main` em `c05ce1b`. A página pública [www.amargem.com.br](https://www.amargem.com.br/) serve o conteúdo principal esperado, mas não informa a revisão Git usada no deploy. A verificação pública disponível também não demonstra qual snapshot de banco está conectado à produção.

## Atualização da origem e status E0 — 08/11/2026

- O responsável informou `c05ce1b791569f4c577571f7cef236708b64f3aa` como SHA do deployment ativo. O SHA existe no Git e corresponde ao merge `#35`; a correspondência do deployment foi recebida como confirmação do responsável, sem sessão autenticada da Vercel nesta execução.
- A variável local `ORIGEM_DATABASE_URL` foi carregada sem exibir seu valor. A reconciliação do catálogo ocorreu em transação `READ ONLY` com `ROLLBACK`: 5 tabelas legadas, 25 colunas, RLS nas 5 tabelas, sem políticas/triggers customizadas e sem `public._prisma_migrations`.
- O SQL observado coincide com `0_base_legada/migration.sql`; a comparação agora ignora apenas quebras de linha extras no fim do arquivo. Nenhum SQL ou histórico foi gravado na origem.
- O manifesto anterior tinha outra identidade de conexão. Para não atribuí-lo indevidamente à origem atual, foi gerado localmente `.conteudo-migracao/inventario-e0-confirmado.json`, com hash `6c6488f111dcd6f5ad5b98c3ccfbe49f1227424276fc0b7d5872a9840a6534e2`. O arquivo continua ignorado pelo Git e protegido localmente.
- A integridade do manifesto e os hashes dos seus 58 arquivos-fonte e 70 mídias foram conferidos contra os bytes de `c05ce1b`; todos coincidem. O snapshot somente leitura da origem também coincide com a identidade do catálogo e contém 93 registros (Agenda 49, Notícia 15, Livro 2, Projeto 23, Sobre 4) e seis blobs (2.049.158 bytes).
- O snapshot anterior e o novo têm registros e blobs idênticos, apesar das identidades de conexão diferentes. O staging já importado permanece compatível com esses dados; não foi feita uma nova importação.
- O dry-run do manifesto confirmado validou 70 objetos locais (19.030.280 bytes), projetou os 93 registros legados e os DTOs editoriais/configurações. Não houve gravação em staging nem produção.

A tentativa de executar novamente o inventário completo no checkout atual de `dev` parou antes de ler o banco porque a lista literal `integrantes` já não existe em `src/app/coletivo/page.tsx`. Por isso, preservou-se o inventário-fonte já comprovado para `c05ce1b` e atualizou-se apenas o snapshot do banco em uma cópia separada.

**E0 está concluída para o SHA de deployment informado pelo responsável e para a origem configurada.** Não houve verificação independente no dashboard Vercel. Permanecem E6 (backup/restauração ensaiados, delta final e corte reversível) e a autorização específica para qualquer gravação em produção.
