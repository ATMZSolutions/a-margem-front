# Catálogo de conteúdo ainda fora do painel admin

Levantamento em **07/11/2026**, na `main`, commit de referência `c05ce1b`. Objetivo: permitir que todo o conteúdo editorial e a apresentação configurável do site sejam mantidos pelo painel, sem editar código.

Este é um inventário do código local: foram comparadas as rotas públicas, seus componentes e dados com os formulários administrativos, APIs e schema Prisma. Não houve validação de dados ou comportamento no deploy. Os itens abaixo são trabalho pendente, não funcionalidades implementadas.

Execução detalhada no [plano de implementação e migração automática para Supabase](plano-execucao-conteudo-supabase.md).

## Cobertura atual

O painel (`src/app/admin/AdminClient.tsx`) oferece somente **Agenda, Notícias, Livros, Projetos e Sobre**. Seus cinco modelos estão em [`prisma/schema.prisma`](../../prisma/schema.prisma), com CRUD em `src/app/api/admin/`.

| Área | Conteúdo já administrável | Limite atual |
| --- | --- | --- |
| Agenda | Título, data/horário, local e cidade | Aparência, textos e seleção dos destaques da home ficam no código. O horário é cadastrado, mas sua renderização pública está comentada. |
| Notícias | Título, conteúdo e link externo | Rótulos, aparência e ordem editorial não são configuráveis; listagem usa criação decrescente. |
| Livros / Indicações | Título, autor, descrição e imagem | Textos da página, aparência e ordem editorial ficam no código; listagem usa criação decrescente. |
| Projetos | Data e descrição dos registros da trajetória | Introdução e galeria são independentes do cadastro administrativo. |
| Sobre | Ano, descrição e imagem da trajetória | O texto e as imagens de “Sobre nós” na home são independentes deste cadastro. Ano é a chave primária: apenas um registro por ano; a API de edição não troca essa chave. |

Nenhuma página pública tem controle completo de conteúdo e apresentação. As lacunas transversais também se aplicam às cinco áreas acima.

## Mapa de todas as páginas públicas

“Sem controle” significa que o conteúdo principal depende de código/arquivos. “Parcial” significa que há dados vindos do admin, mas restam elementos fixos.

| Rota | Situação | Itens do catálogo |
| --- | --- | --- |
| `/` | Parcial: somente eventos usam o cadastro | C01–C04, C09–C14 |
| `/agenda` | Parcial | C04, C09–C14 |
| `/sobre` | Parcial | C08–C14 |
| `/coletivo` | Sem controle | C05, C09–C14 |
| `/coletivo/integrante/[nome]` | Sem controle | C05, C09–C14 |
| `/premios` | Sem controle | C07, C09–C14 |
| `/premios/[title]/[year]` | Sem controle | C07, C09–C14 |
| `/espetaculos` | Sem controle | C06, C09–C14 |
| `/espetaculos/[title]` | Sem controle | C06, C09–C14 |
| `/projetos` | Parcial | C08–C14 |
| `/noticias` | Parcial | C09–C14 |
| `/indicacoes` | Parcial | C09–C14 |
| `/contato` | Sem controle | C03, C09–C14 |
| Página 404 | Sem controle | C12 |

## Lacunas por área

### C01 — Home: abertura e composição

- **Fonte:** [`Main.tsx`](../../src/components/home/Main.tsx) e [`page.tsx`](../../src/app/page.tsx).
- **Fixo:** três fundos (`/home/img1.webp` a `img3.webp`), arte central `/grito-de-guerra.webp`, texto alternativo, intervalo de cinco segundos, overlay e sequência abertura → agenda → sobre → contato.
- **Disponibilizar:** adicionar/substituir/remover e ordenar slides, arte principal, textos alternativos, tempo de troca, parâmetros visuais e ativação/ordem das seções da home.
- **Conclusão:** uma campanha e a composição da home podem mudar pelo admin sem alterar os componentes.

### C02 — Home: apresentação institucional

- **Fonte:** [`home/Sobre.tsx`](../../src/components/home/Sobre.tsx).
- **Fixo:** título “Sobre nós”, parágrafo institucional, fundo `/exu-bg.svg`, seis fotos do carrossel e dois botões com texto/destino (“Conheça nossa história” e “Conheça os Integrantes”).
- **Disponibilizar:** título, texto, fundo, galeria ordenada, textos alternativos e botões com rótulo, destino e visibilidade.
- **Conclusão:** editar a história em `/admin` e editar esta apresentação são operações claramente identificadas; a home não mantém uma cópia institucional inacessível ao painel.

### C03 — Contato e redes sociais

- **Fontes:** [`home/Contato.tsx`](../../src/components/home/Contato.tsx) e [`contato/page.tsx`](../../src/app/contato/page.tsx).
- **Fixo e duplicado:** WhatsApp, e-mail, Instagram e TikTok, com seus rótulos e URLs. Também ficam fixos o título da seção, logo circular `/amargem-logo-insta.webp` e fundos.
- **Disponibilizar:** cadastro único de canais (tipo/ícone, rótulo, valor, URL, ordem e ativo), título e imagem da página.
- **Conclusão:** alterar um contato atualiza home e página de contato; é possível adicionar ou ocultar canais sem código.

### C04 — Agenda e destaques na home

- **Fontes:** [`home/Agenda.tsx`](../../src/components/home/Agenda.tsx), [`AgendaClient.tsx`](../../src/app/agenda/AgendaClient.tsx) e [`agenda/page.tsx`](../../src/app/agenda/page.tsx).
- **Fixo:** título, CTA “Agenda Completa”, mensagens, fundos, regra de eventos atuais/futuros e limite de duas cidades e três eventos por cidade na home. Cidades são escolhidas alfabeticamente; não existe curadoria pelo admin.
- **Disponibilizar:** seleção ou regra configurável dos destaques, limites, título/CTA, visibilidade do horário e opções de apresentação. Preservar a opção de seleção automática.
- **Conclusão:** escolher eventos/cidades destacados e exibir o horário cadastrado não exige modificar JSX. O CRUD atual deve ser preservado.

### C05 — Integrantes: lista e perfis

- **Fontes:** [`coletivo/page.tsx`](../../src/app/coletivo/page.tsx), [`data/integrantes.ts`](../../src/data/integrantes.ts) e [`coletivo/integrante/[nome]/`](../../src/app/coletivo/integrante/%5Bnome%5D/page.tsx).
- **Fixo:** seis integrantes, identificador de URL, nome, foto, ficha técnica e biografia. A lista possui um array próprio e os detalhes usam outro, criando duas fontes para nome/foto/identificador.
- **Disponibilizar:** CRUD de integrantes com slug estável, nome, foto/alt, ficha técnica, biografia, ordem e publicação; lista e detalhe devem consultar a mesma entidade.
- **Conclusão:** criar, editar, reordenar e retirar um integrante atualiza lista, perfil, metadados e sitemap. Mudança de slug deve preservar ou redirecionar a URL anterior.
- **Situação E3 (08/11/2026):** CRUD e leitores compartilhados foram implementados atrás da chave `CONTEUDO_EDITORIAL_SUPABASE_ATIVO`; validação de comportamento em staging ainda pendente.

### C06 — Espetáculos: catálogo e detalhes

- **Fontes:** [`data/espetaculos.ts`](../../src/data/espetaculos.ts), [`espetaculos/page.tsx`](../../src/app/espetaculos/page.tsx) e [`espetaculos/[title]/page.tsx`](../../src/app/espetaculos/%5Btitle%5D/page.tsx).
- **Fixo:** Xirê e Brechas da Muximba, títulos, anos de lançamento, capas, cores, galerias com data/legenda e seções de conceito/dramaturgia, fichas técnicas e trajetória/apresentações.
- **Duplicação:** `espetaculosData` alimenta cards/sitemap e `shows` alimenta detalhes. O slug deriva do título.
- **Disponibilizar:** CRUD único com slug, título, lançamento, capa, tema, galeria ordenada (foto, alt, legenda, crédito e data), seções textuais ordenadas e publicação.
- **Conclusão:** um novo espetáculo completo aparece no catálogo e tem detalhe/SEO/sitemap sem edição dos arrays; renomear não quebra links existentes.
- **Situação E3 (08/11/2026):** editor do espetáculo, seções e galeria, mais leitores/sitemap por slug, foram implementados atrás da chave editorial; smoke em staging ainda pendente.

### C07 — Prêmios: lista e detalhes

- **Fontes:** [`data/premios.ts`](../../src/data/premios.ts), [`premios/page.tsx`](../../src/app/premios/page.tsx), [`premios/[title]/[year]/page.tsx`](../../src/app/premios/%5Btitle%5D/%5Byear%5D/page.tsx) e [`Premio.tsx`](../../src/components/Premio.tsx).
- **Fixo:** prêmio cadastrado em arquivo, título, evento, ano, descrição, imagem e ordem de exibição. URL combina título convertido em slug e ano.
- **Disponibilizar:** CRUD com título, slug, evento, ano, descrição, imagem/alt, ordem e publicação.
- **Conclusão:** novos prêmios entram na lista, detalhe, metadados e sitemap pelo painel; mudanças em título/ano têm tratamento para links antigos.
- **Situação E3 (08/11/2026):** CRUD e leitores de lista/detalhe/SEO/sitemap foram implementados atrás da chave editorial; smoke em staging ainda pendente.

### C08 — Projetos e história: completar módulos existentes

- **Fontes:** [`ProjetosClient.tsx`](../../src/app/projetos/ProjetosClient.tsx), [`data/projetos.ts`](../../src/data/projetos.ts), [`YearStepper.tsx`](../../src/components/YearStepper.tsx), [`SobreClient.tsx`](../../src/app/sobre/SobreClient.tsx) e APIs administrativas de projeto/sobre.
- **Projetos fora do admin:** texto introdutório sobre ações educacionais, título “Conheça a trajetória” e galeria `projectImgs` (foto, data e descrição, que também contém créditos/local). O ano mínimo do seletor está fixo em 2023, mesmo que o banco receba registros anteriores.
- **Sobre:** a trajetória já vem do banco, mas título, aparência e rótulos não são editáveis. O ano identifica o registro; não há múltiplos marcos no mesmo ano nem troca de ano via PUT.
- **Disponibilizar:** apresentação e galeria de projetos, metadados das fotos, ordenação e textos de seção; derivar os limites do seletor dos registros ou configurá-los. Para história, permitir corrigir ano e, se adotado como requisito editorial, múltiplos marcos por ano com ID próprio.
- **Conclusão:** atualizar a galeria e a introdução independe da trajetória; todos os anos cadastrados ficam acessíveis. A decisão sobre múltiplos marcos deve ser registrada antes da migração.

## Lacunas transversais

| ID | Área e evidência | O que disponibilizar no painel / critério de conclusão |
| --- | --- | --- |
| C09 | Navegação: [`Sidebar.tsx`](../../src/components/Sidebar.tsx) | Rótulos, destinos, ordem e visibilidade dos dez itens; logo, alt e destino do cabeçalho. Uma página oculta deve ter regra explícita para acesso direto e sitemap: ocultar no menu, sozinho, não a despublica. |
| C10 | Identidade e rodapé: [`Footer.tsx`](../../src/components/Footer.tsx), [`layout.tsx`](../../src/app/layout.tsx), logos em `public/` | Nome público, logos e variantes, favicon, imagem social padrão, copyright (hoje fixa 2025) e texto de direitos. Centralizar dados usados em mais de um componente; definir ano automático ou manual. |
| C11 | Aparência: [`globals.css`](../../src/app/globals.css), páginas e componentes públicos | Paleta, fundos/padrões (`padrao1.webp`, `padrao2.webp`, `exu-bg.svg`), overlays e opções de tipografia/apresentação por página/seção. Props `bgColor`/`bgImage` em alguns clientes não são controles administrativos. Definir opções e limites para manter legibilidade e responsividade. |
| C12 | Textos de interface: `BackBtn`, `NewsCard`, `AppDrawer`, clientes públicos e [`not-found.tsx`](../../src/app/not-found.tsx) | Títulos/rótulos, CTAs (“Saiba mais”, “Mostrar mais”, “Ler mais/menos”), estados vazios/carregamento e mensagem 404. Manter valores padrão; distinguir texto editorial de textos técnicos internos do painel. |
| C13 | SEO: `src/app/layout.tsx`, `page.tsx`/`layout.tsx` das rotas e `generateMetadata` dos detalhes | Título, descrição, imagem de compartilhamento e overrides por página/entidade; padrões globais para nome, palavras-chave e autor. Detalhes hoje derivam metadados do conteúdo estático, mas não permitem override editorial. Domínio base está repetido no código. Sitemap deve acompanhar entidades publicadas; canonical deve permanecer coerente com URL e domínio configurados. |
| C14 | Publicação e ordem: schema Prisma, consultas públicas e [`sitemap.xml/route.ts`](../../src/app/sitemap.xml/route.ts) | Estado rascunho/publicado, visibilidade de páginas/seções/itens, ordem manual e destaques onde fizer sentido. Hoje não há campos de publicação/ordem editorial nos cinco modelos; filtros/ordens são definidos no código. Cadastro não deve exigir exclusão para ser ocultado. |
| C15 | Biblioteca de mídia: [`api/upload/route.ts`](../../src/app/api/upload/route.ts), [`api/image/[type]/[id]/route.ts`](../../src/app/api/image/%5Btype%5D/%5Bid%5D/route.ts) e `public/` | Upload existente atende formulários de Livro/Sobre; entrega de imagens do banco atende esses dois tipos. Criar gestão reutilizável para home, integrantes, espetáculos, projetos, prêmios e identidade, com alt, legenda, crédito, ordenação, troca e remoção explícita de vínculo. Hoje as APIs de Livro/Sobre permitem substituir a imagem, mas não oferecem operação explícita para limpá-la. |

C15 é dependência das áreas com imagens, mesmo quando não repetido no mapa de rotas. Conteúdo estático em `public/` só deixa de ser dependência operacional quando o painel consegue substituir seus usos.

## Sequência sugerida de implementação

Prioridades abaixo representam ganho de autonomia editorial, não severidade de segurança.

1. **Base compartilhada:** C03, C09, C10 e C15 — configurações globais, contatos únicos e mídia reutilizável.
2. **Áreas totalmente estáticas:** C05, C06 e C07 — modelos, migração dos arrays existentes, CRUD e integração pública.
3. **Home e módulos incompletos:** C01, C02, C04 e C08 — composição, galerias, textos e curadoria.
4. **Autonomia transversal:** C11–C14 — aparência, textos auxiliares, SEO e publicação/ordem. Os campos de publicação necessários aos módulos novos devem ser antecipados para suas respectivas entregas.

Sugestão de organização do painel: manter os cinco módulos atuais e acrescentar **Home, Integrantes, Espetáculos, Prêmios, Contatos e redes, Mídia e Configurações do site**. Em Configurações, reunir Navegação, Identidade/rodapé, Aparência, Textos e SEO; em cada módulo, expor as opções específicas da página.

## Critérios de aceite do objetivo “tudo customizável”

- [ ] Todos os itens C01–C15 têm controles persistidos e consumidos pelas páginas correspondentes.
- [ ] Conteúdo inicial dos arquivos/arrays é migrado preservando textos, imagens, créditos e URLs públicas; lista e detalhe compartilham uma fonte.
- [ ] A pessoa administradora consegue criar, editar, remover, ordenar, publicar e ocultar conteúdo quando aplicável; excluir mídia em uso tem comportamento definido.
- [ ] Alterações em contatos/identidade compartilhados aparecem em todos os pontos de uso, inclusive metadados.
- [ ] Novos integrantes, espetáculos e prêmios não exigem rebuild manual para entrar no site; carregamento, cache e geração de rotas são adequados à edição pelo painel.
- [ ] Sitemap e metadados refletem somente o conteúdo publicável; alterações de slug preservam links anteriores.
- [ ] Há valores padrão e tratamento de galerias vazias, imagem removida, seções ocultas e ausência de registros.
- [ ] A propagação de alterações e imagens tem prazo de cache definido e validado; imagens do banco atualmente podem permanecer antigas por até 60 segundos na resposta da rota.
- [ ] Validar cada entrega no painel e nas páginas públicas em desktop/mobile; registrar ambiente, data e evidência antes de marcar concluída.

O escopo cobre conteúdo, estrutura editorial e opções visuais. Autenticação, credenciais, conexão do banco, regras de segurança, componentes e lógica de aplicação continuam sendo configuração técnica/código. Este catálogo não pressupõe um editor de código, CSS livre ou um construtor arbitrário de páginas dentro do admin.
