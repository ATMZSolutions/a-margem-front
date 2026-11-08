# Validação E0 — revisão publicada e manifesto

Verificação complementar em **08/11/2026**. Este documento atualiza a pendência E0 registrada no [relatório de importação](./importacao-staging-conteudo-2026-11-08.md).

## Correspondência entre código, arquivos e manifesto

- A branch `main` local e `origin/main` apontam para [`c05ce1b791569f4c577571f7cef236708b64f3aa`](https://github.com/ATMZSolutions/a-margem-front/commit/c05ce1b791569f4c577571f7cef236708b64f3aa); a branch padrão remota consultada também é `main`.
- O manifesto usado na carga registra esse mesmo commit e o hash interno `4ac9fc1d7ec6093379462f60b58074b708417c7ba01137f0f2890c1f191690fa`.
- Os hashes SHA-256 das **58 fontes** inventariadas foram comparados com os bytes de cada arquivo no commit `c05ce1b`; não houve divergências.
- Os hashes e tamanhos das **70 mídias** inventariadas também foram comparados com os blobs `public/` do commit; não houve divergências.
- O manifesto registra 93 registros legados (Agenda 49, Notícia 15, Livro 2, Projeto 23 e Sobre 4) e seis blobs de imagens do banco. A árvore constava como alterada quando o inventário foi gerado, mas nenhum dos 58 arquivos-fonte ou 70 ativos de mídia inventariados diverge do commit identificado.

Isso confirma que o snapshot de código e mídia usado na importação representa `main` em `c05ce1b`. A página pública [www.amargem.com.br](https://www.amargem.com.br/) serve o conteúdo principal esperado, mas não informa a revisão Git usada no deploy. A verificação pública disponível também não demonstra qual snapshot de banco está conectado à produção.

## O que ainda falta para encerrar E0

Não foi encontrada evidência autoritativa que ligue o deploy de produção ao commit `c05ce1b`: os status/checks do commit estão vazios e o workflow versionado nesse repositório executa testes, não publica o site. O HTML público ou uma captura visual confirmam conteúdo acessível, mas não provam a revisão construída.

A extração somente leitura do banco está registrada no [relatório de adaptadores](./adaptadores-snapshot-schema-2026-11-07.md): ela usou `DATABASE_URL`, encontrou 93 registros e seis blobs, e não encontrou `public._prisma_migrations`. A [reconciliação de schema](./reconciliacao-baseline-2026-11-07.md) documenta o baseline e o estado observado. Os dois relatórios alertam que a conexão configurada não foi confirmada como o banco atualmente ligado ao site publicado. Este passo não abriu uma nova conexão com a origem. O staging permanece confirmado como projeto isolado e recebeu apenas as migrações/conteúdo documentados; produção não foi consultada nem gravada nesta verificação.

E0 fica **parcialmente confirmado**. Para fechá-lo, registrar o SHA do deployment atualmente ativo e confirmar de forma somente leitura que a conexão usada na extração corresponde ao banco do site publicado. Se o SHA publicado não for `c05ce1b`, será necessário gerar outro snapshot a partir da revisão efetivamente publicada e comparar seu delta antes de qualquer corte.
