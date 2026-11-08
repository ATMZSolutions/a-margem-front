# Integração editorial E5 — primeira entrega

Implementação na branch `dev`, em **08/11/2026**. Esta entrega liga publicação, ordem, SEO, aparência e textos comuns do painel às consultas públicas. E5 continua em andamento; este relatório registra apenas o que foi implementado e conferido nesta etapa.

## O que entrou

- Os modelos legados Agenda, Notícia, Livro, Projeto e Sobre receberam `estado`, `ordem` e `seo`. A nova migração preserva todos como `PUBLICADO` e atribui uma ordem inicial compatível com as listagens atuais.
- O painel ganhou **Publicação e SEO** para estados e ordem dos registros, publicação de páginas, overrides de título/descrição/imagem social e configurações gerais de aparência/textos. Páginas sem override usam os padrões existentes.
- As listas públicas de Agenda, Notícias, Indicações, Projetos, História, Integrantes, Espetáculos e Prêmios filtram rascunhos/arquivados e respeitam ordem editorial. As páginas `PaginaSite` ocultas respondem como 404, saem do menu e do sitemap. Detalhes publicados também respeitam o estado do registro.
- Metadados por página e por integrante, espetáculo e prêmio são gerados com o domínio da identidade global; o sitemap usa o mesmo domínio e inclui só páginas/conteúdos publicáveis. A URL canônica continua derivada da rota, sem um campo livre que possa divergir do domínio.
- Aparência geral oferece paletas seguras, padrões já existentes e tipografias existentes. Textos comuns de navegação, chamadas, estados vazios, painéis e 404 passaram a vir de configuração persistida, com padrões quando não há configuração.
- A auditoria de strings ampliou os textos administráveis para estados vazios de integrantes, espetáculos, prêmios e projetos por ano; subtítulo/complemento de Indicações; carregamento; rótulos acessíveis do menu, topo, carrossel e navegação entre anos; e o título de detalhes/integrante. Os campos ficam no JSON site:transversal; dados antigos usam os padrões e não precisam de migração SQL. A revisão de outros textos fixos ainda está pendente.

## Migração e verificação

A migração `20261108030000_publicacao_ordem_seo_legado` foi aplicada ao staging isolado após conferir que era a única pendente. O checksum registrado em `_prisma_migrations` é `bf4c5a4ab8cb66f7f5e01a4f478615efa05615e58d60e7142b173764efb6a270`; `prisma migrate status` confirmou schema atualizado.

| Tabela | Total | Publicados | Faixa inicial de ordem |
| --- | ---: | ---: | ---: |
| Agenda | 49 | 49 | 0–48 |
| Noticia | 15 | 15 | 0–14 |
| Livro | 2 | 2 | 0–1 |
| Projeto | 23 | 23 | 0–22 |
| Sobre | 4 | 4 | 0–3 |

Os cinco modelos mantiveram os **93 registros** importados; SEO permaneceu nulo até edição. A cadeia baseline + migração editorial + E5 também foi executada em PGlite isolado com uma linha de amostra por tabela: nenhuma linha foi perdida, o estado inicial foi `PUBLICADO` e a ordem começou em zero.

`prisma validate`, TypeScript, ESLint focado nos arquivos alterados e `git diff --check` passaram. Não houve gravação de conteúdo de teste no staging. Produção e a origem não foram alteradas.

O smoke funcional reversível foi concluído em **08/11/2026**, usando o painel pela API administrativa e as rotas públicas servidas localmente com o staging isolado como banco. A configuração geral persistida apareceu na home; o override de SEO apareceu nos metadados de `/agenda`; a página publicada entrou no sitemap e, ao mudar para rascunho, respondeu 404 e saiu do sitemap. Uma Agenda temporária confirmou estado publicado inicial, ordenação manual, ocultação como rascunho e arquivado. O registro, a publicação/SEO de `/agenda` e a configuração global foram restaurados; a Agenda temporária foi removida. Nenhum registro temporário permaneceu.

## Biblioteca de mídia — primeira entrega C15

O painel ganhou a área **Mídia**, com busca, filtros de vínculo, prévias, tipo/tamanho/dimensões e referências detectadas em `UsoMidia`, nas relações editoriais e nas configurações JSON de site/páginas/seções. Cada referência abre a área correspondente para trocar ou remover o vínculo; os editores existentes oferecem seleção vazia ou ação explícita de remoção.

Arquivos sem referência detectada aparecem como candidatos a órfãos. Esta entrega não apaga linhas nem objetos do Storage: o adaptador ainda não oferece exclusão, e a rotina prevista no plano exige retenção e uma nova verificação de referências antes de qualquer remoção física.

Uma consulta somente leitura ao staging encontrou **70 mídias**, **68 com referência detectada**, **79 referências** e **2 candidatas a órfãs**. A consulta incluiu os seletores efetivos da identidade, home, contato e projetos para evitar classificar imagens de fallback como órfãs. Nenhuma linha ou objeto foi alterado.

O smoke visual/funcional da biblioteca foi concluído em **08/11/2026**, no painel local autenticado com o banco de staging isolado, sem gravar no Supabase. Busca por arquivo, filtro “Sem vínculo detectado” (2 resultados) e os atalhos “Abrir editor” foram conferidos; uma referência da História abriu a área Sobre e uma referência de configuração abriu Configurações. As referências dos marcos passaram a exibir o ano em vez do identificador técnico, e a linha correspondente à tabela legada está marcada como “legado”.

A biblioteca foi conferida em **1280×900** e **390×844**. O layout desktop mostra cards em duas colunas; no viewport móvel o formulário e os cards ficam em uma coluna e `scrollWidth` não ultrapassa a largura do viewport.

## Revisão responsiva das rotas públicas

Em **08/11/2026**, as dez rotas públicas principais (`/`, `/agenda`, `/coletivo`, `/contato`, `/espetaculos`, `/indicacoes`, `/noticias`, `/premios`, `/projetos` e `/sobre`) e três detalhes existentes (`/coletivo/integrante/bento`, `/espetaculos/brechas-da-muximba` e `/premios/trofeu-construtores-da-cultura-de-paz/2024`) foram conferidos localmente em **390×844**. As telas carregaram conteúdo e imagens observadas; não houve rolagem horizontal. O card da ficha de integrante estava com largura zero por falta de largura no item flex. O contêiner recebeu `w-full max-w-xs shrink-0`; a imagem passou a ocupar 320 px no viewport móvel.

As mesmas 13 rotas foram verificadas em **1280×900**: cada uma apresentou conteúdo, elemento principal e `scrollWidth` igual à largura útil da página. Títulos, descrições e canônicas dos detalhes foram conferidos após a conclusão da geração assíncrona de metadados.

O login e o shell do painel também foram conferidos em 390×844; Sobre e Publicação e SEO carregaram sem overflow. A sidebar desktop foi compactada para itens de 48 px, alinhada ao header e tornada rolável quando a altura da janela não comportar a lista completa. Ela usa a mesma lista de áreas do seletor mobile; a checagem visual final desta correção fica junto da revisão dos editores restantes.

A revisão dos formulários restantes não terminou: durante a alternância de módulos, o staging acusou saturação do pool (`EMAXCONNSESSION`, limite de 15 clientes), com respostas 500 em algumas consultas GET e 200 em novas tentativas. O servidor Next local encerrou antes da confirmação final de Página de projetos e Configurações. Não houve POST/PUT/DELETE nem gravação no Supabase nesta auditoria.

## Pendências para concluir E5

- Concluir a auditoria visual responsiva dos editores restantes; as 13 rotas públicas listadas acima passaram pela revisão mobile e pela verificação desktop. Revisar também strings de interface que ainda são conteúdo fixo.
- Concluir o tratamento de órfãos de C15: relatório de candidatos e referências está disponível no painel; a retenção, reconciliação com o Storage e remoção física continuam pendentes.
- Confirmar em E0 que o manifesto representa a revisão publicada. E6 (backup, delta e corte de produção) continua sem execução.
