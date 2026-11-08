# E3 — módulos editoriais e leitores públicos

- **Data:** 08/11/2026
- **Branch:** `dev` (commit `a216344`; implementação transferida da `main`).
- **Escopo:** integrantes, espetáculos, prêmios e mídia usada por esses módulos.

## Implementado

- Listas, detalhes, metadados e sitemap podem consultar as entidades publicadas no PostgreSQL (`Integrante`, `Espetaculo`, `Premio`, seções, galerias e mídias). Os caminhos públicos existentes usam o `slug` armazenado.
- O painel ganhou áreas de integrantes, espetáculos e prêmios. Os formulários cobrem textos, imagem, ordem, estado editorial, seções e fotos de galeria; as APIs validam payloads, autenticação e origem, arquivam sem excluir e revalidam as páginas afetadas.
- A API de mídia lista metadados e envia novos arquivos ao bucket já provisionado. O upload passa pela otimização/validação existente e confirma o objeto no Storage; a rota não cria buckets.
- Texto alternativo das fotos de espetáculo é passado ao carrossel público.
- `CONTEUDO_EDITORIAL_SUPABASE_ATIVO` é a chave de corte reversível. Ausente ou `false`, leitores e sitemap mantêm os dados atuais dos arquivos, as novas áreas do admin ficam ocultas e suas APIs respondem `503` após autenticação. `true` habilita os leitores e módulos do banco no ambiente configurado.

## Verificação local

- `yarn tsc --noEmit` — aprovado.
- `yarn eslint` nos arquivos alterados — aprovado.
- Smoke manual em staging isolado aprovado: leitura dos 6 integrantes, 2 espetáculos e 1 prêmio publicados; login; GET/POST/PUT/arquivamento; páginas de lista/detalhe; metadados e sitemap.
- A API de mídia reconheceu uma imagem já importada pelo mesmo SHA-256/ID. Não criou objeto nem registro duplicado. Os registros temporários foram removidos e uma consulta posterior confirmou zero resíduos nos três domínios.
- Origem e produção não foram acessadas ou alteradas nesta etapa.

## Próxima validação

O smoke cobriu CRUD, publicação, detalhes, metadados, sitemap e mídia preexistente. Validar visualmente `/_next/image` e um upload de objeto novo permanece junto da revisão visual E5; o smoke não criou mídia nova.

E3 está concluída para os critérios de integração e CRUD em staging. O smoke funcional E4 também passou em staging e as páginas foram conferidas no preview 858×900; um viewport mobile estreito segue sem medição. E0 ainda exige confirmação de que o manifesto corresponde à revisão publicada, e E5 segue pendente. Não habilitar a chave em produção antes do plano de corte E6.
