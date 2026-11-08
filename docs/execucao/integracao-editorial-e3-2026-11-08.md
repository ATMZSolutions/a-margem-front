# E3 — módulos editoriais e leitores públicos

- **Data:** 08/11/2026
- **Branch de implementação:** `main`; transferência atual para `dev`.
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
- O smoke de staging confirmou localmente a separação entre o destino e a conexão regular, mas Prisma retornou `P1001` ao abrir a conexão do banco. A falha ocorreu antes de qualquer gravação; nenhum registro ou objeto foi alterado. Repetir o smoke quando o endpoint de staging estiver acessível.
- Origem e produção não foram acessadas ou alteradas nesta etapa.

## Próxima validação

No staging isolado, configurar as variáveis de runtime correspondentes ao destino de staging e `CONTEUDO_EDITORIAL_SUPABASE_ATIVO=true`; então conferir login, leitura das três listas, abrir detalhes publicados, criar/editar/arquivar registros de validação, ordenar/publicar, editar seções/galeria e carregar uma imagem no bucket existente. Conferir URLs, alt text, metadados, sitemap e `/_next/image`. Registrar os resultados antes de marcar E3 concluída.

E0 ainda exige confirmação de que o manifesto corresponde à revisão publicada. E4 e E5 continuam pendentes; não habilitar a chave em produção antes do plano de corte E6.
