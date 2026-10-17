# Auditoria técnica: segurança, desempenho e SEO

**Data da revisão:** 17/10/2026
**Escopo:** análise estática do código, configuração, manifesto e lockfile.
**Resultado:** foram identificados riscos críticos de dependências, falhas de proteção no admin e oportunidades de melhoria em imagens, carregamento de conteúdo e SEO.
**Plano de correção:** [docs/plano-de-correcao.md](plano-de-correcao.md)

**Atualização das imagens locais:** [resultado e limitações da otimização](otimizacao-imagens-2026-10-17.md). Os números abaixo preservam o estado da auditoria inicial.

## Resumo executivo

> Este documento registra o estado encontrado na auditoria inicial. O código foi corrigido depois; veja [execução do plano](relatorio-correcoes.md) para o estado atual e as pendências.

1. Atualizar Next.js: o projeto usa `next@15.5.4` com App Router e há advisories críticos que abrangem essa versão. O lockfile também resolve `sharp@0.34.4`.
2. Remover credenciais e segredo padrão do admin; credenciais de acesso estão documentadas em arquivo versionado.
3. Proteger o endpoint de upload, impor limites de tamanho e validar o formato real dos arquivos.
4. Reduzir e servir imagens em tamanhos/formats adequados; o diretório `public` tem 61 imagens rasterizadas e aproximadamente 19,89 MB.
5. Criar metadados por página, renderizar conteúdo público no servidor e completar o sitemap com as páginas dinâmicas.

## Achados de segurança

### S1 — Next.js em versão afetada por vulnerabilidades críticas

**Severidade:** Crítica
**Arquivos:** `package.json`, `yarn.lock`, `src/app/**`, `src/components/Sidebar.tsx`

O manifesto fixa `next@15.5.4` e `eslint-config-next@15.5.4`; o lockfile confirma essa resolução. O projeto usa o App Router (`src/app`). A advisory CVE-2025-66478 descreve execução remota não autenticada no protocolo React Server Components para aplicações Next.js 15.x com App Router. A correção inicial para a linha 15.5 foi publicada em 15.5.7.

Há também um advisory crítico publicado em 14/10/2026 para versões Next.js até 15.5.27, corrigido em 15.5.28, relacionado à API de otimização de imagens. A exploração depende do runtime em Linux com glibc e do uso do otimizador. O projeto usa `next/image`, e o lockfile resolve `sharp@0.34.4`; o advisory cita `sharp@0.35.5` ou superior como alternativa de mitigação.

O lockfile também resolve `react` e `react-dom` em 19.2.0. O React publicou advisories para pacotes React Server Components nessa versão, incluindo uma correção posterior em 19.2.9. A vulnerabilidade do RSC é tratada também pelo framework Next.js; atualizar o Next e revisar a árvore efetivamente instalada é necessário para garantir que os pacotes RSC usados pelo servidor estejam corrigidos.

**Recomendação:** atualizar `next` e `eslint-config-next` para pelo menos 15.5.28 dentro dessa linha, ou para uma versão atualmente suportada e corrigida; atualizar o lockfile e confirmar a resolução de `sharp` e dos pacotes RSC. Se o site estiver publicado em Linux/glibc, tratar a atualização como urgente.

**Referências:**

- [Advisory oficial do Next.js: CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478)
- [Advisory Next.js: RCE na API de otimização de imagens](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)
- [Advisory React: RCE em React Server Components](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3)

### S2 — Credenciais e segredo padrão no admin

**Severidade:** Alta
**Arquivos:** `middleware.ts`, `src/lib/adminSession.ts`, `src/app/api/admin/auth/route.ts`, `ADMIN_CREDENTIALS.md`

O middleware e a rota de login usam valores padrão se `ADMIN_USER` ou `ADMIN_PASS` não estiverem definidos. A assinatura da sessão também usa um segredo padrão se `JWT_SECRET` estiver ausente. Como a validação da sessão depende desse segredo, uma implantação sem variáveis de ambiente seguras pode permitir acesso administrativo não autorizado.

`ADMIN_CREDENTIALS.md` está versionado e documenta o acesso ao painel. O valor da credencial não é reproduzido neste documento.

**Recomendação:** remover os valores de fallback e falhar a inicialização quando as variáveis obrigatórias não estiverem configuradas. Remover as credenciais do histórico/versionamento conforme a política do repositório e rotacioná-las caso o projeto já tenha sido compartilhado. Adicionar limitação de tentativas ao login.

### S3 — Upload público sem limites explícitos

**Severidade:** Alta
**Arquivo:** `src/app/api/upload/route.ts`

O endpoint aceita upload sem autenticação, valida apenas se o MIME declarado começa com `image/` e lê o arquivo inteiro em memória. Não há limite explícito de tamanho ou validação do conteúdo real. A resposta inclui os dados da imagem em mais de uma representação, ampliando o consumo de memória e banda por requisição.

O endpoint de imagem também envia `imagemTipo` armazenado no banco diretamente no cabeçalho `Content-Type` (`src/app/api/image/[type]/[id]/route.ts`). Isso torna importante validar o tipo no upload e restringi-lo a formatos rasterizados permitidos antes de armazenar e servir os dados.

**Recomendação:** exigir autenticação quando o upload for apenas administrativo; estabelecer limite de bytes antes de processar; validar o formato pelos bytes/conteúdo, não apenas pelo MIME informado pelo cliente; permitir uma lista restrita de formatos; e devolver uma única representação necessária ao frontend.

### S4 — Proteções adicionais da sessão

**Severidade:** Média
**Arquivo:** `src/app/api/admin/auth/route.ts`

O cookie da sessão define `HttpOnly` e `SameSite=Lax`, mas não define `Secure`. A sessão JWT é válida por 24 horas e não há revogação no servidor; o logout apenas remove o cookie do navegador.

**Recomendação:** marcar o cookie como `Secure` em produção, manter transporte HTTPS e considerar sessões revogáveis ou reduzir a validade conforme o uso do painel.

## SEO

### O1 — Metadados globais sem personalização por rota

**Arquivos:** `src/app/layout.tsx` e páginas em `src/app/**/page.tsx`

O layout define um único título e descrição globais. Não foram encontrados metadados específicos ou `generateMetadata` para as páginas públicas e rotas de detalhe. Isso reduz a relevância de títulos e snippets nos resultados de busca e o controle das prévias sociais.

**Recomendação:** adicionar título, descrição, canonical e Open Graph próprios às páginas públicas e às páginas dinâmicas, usando o conteúdo de cada registro.

### O2 — Conteúdo dinâmico carregado após hidratação

**Arquivos:** `src/app/agenda/page.tsx`, `src/app/noticias/page.tsx`, `src/app/projetos/page.tsx`, `src/app/sobre/page.tsx`

Essas páginas buscam dados em `useEffect`. O conteúdo principal, portanto, aparece depois do carregamento inicial e não integra o HTML inicial da mesma forma que uma busca renderizada no servidor.

**Recomendação:** buscar os dados no servidor (Server Components ou funções de dados do Next.js) e passar o resultado aos componentes interativos.

### O3 — Sitemap incompleto e `lastModified` artificial

**Arquivo:** `src/app/sitemap.xml/route.ts`

O sitemap inclui as páginas de lista, mas não as rotas dinâmicas de espetáculos, prêmios e integrantes. O campo `lastModified` é definido como o primeiro dia do mês para todas as páginas, sem refletir a data de alteração real.

**Recomendação:** gerar URLs de detalhe a partir dos dados e preencher `lastModified` com datas reais; omitir o campo quando não houver uma data confiável.

### O4 — Robots permite rastreamento de todas as rotas

**Arquivo:** `src/app/robots.txt/route.ts`

`Allow: /` não exclui rotas de administração ou APIs do rastreamento. Isso não substitui nem contorna a autenticação, mas pode desperdiçar rastreamento e expor páginas administrativas de login aos índices.

**Recomendação:** bloquear caminhos administrativos e APIs para robôs e manter a autenticação como controle de acesso independente.

## Desempenho, imagens e bundle

### P1 — Biblioteca de imagens estáticas pesada

**Medição local do diretório `public`:**

- 61 arquivos rasterizados;
- 19,89 MB no total;
- 33 arquivos acima de 200 KB;
- 11 arquivos acima de 500 KB;
- maior arquivo: `public/espetaculos/xire/img8.jpg`, com aproximadamente 2,35 MB.

Há usos de `<img>` nativo sem `loading="lazy"` em páginas como espetáculos, indicações e no carrossel (`src/app/espetaculos/page.tsx`, `src/app/indicacoes/page.tsx`, `src/components/PhotoCarousel.tsx`). O hero da home também usa imagens como `background-image`, sem variantes responsivas.

**Recomendação:** redimensionar originais para dimensões próximas ao maior tamanho de exibição, converter fotografias para WebP/AVIF, servir variantes responsivas e aplicar carregamento lazy às imagens fora da primeira dobra. Definir dimensões/aspect ratio para reduzir CLS. Corrigir Next.js antes de depender da API de otimização de imagens do framework.

### P2 — Dependências de interface no layout global

**Arquivos:** `src/app/layout.tsx`, `src/components/Sidebar.tsx`

O layout global inclui o `Sidebar`, que é Client Component e importa Ant Design (`Drawer`), ícones Ant Design e Framer Motion. Como o componente aparece em todas as páginas, essa árvore de dependências pode integrar o JavaScript compartilhado do site.

**Recomendação:** medir os chunks com uma análise de build e avaliar carregar o drawer sob demanda ou substituir componentes pesados por uma implementação mais enxuta. O efeito no bundle não foi medido nesta revisão.

### P3 — Atualização de estado em cada evento de scroll

**Arquivo:** `src/app/page.tsx`

A home registra um listener de scroll que chama `setAtBottom` sem limitação de frequência. Isso pode provocar renders repetidos durante a rolagem.

**Recomendação:** atualizar o estado apenas quando a condição de fim mudar, ou usar `requestAnimationFrame`/`IntersectionObserver`.

## Limites da revisão

- Revisão estática; não alterei o código do produto.
- `yarn npm audit --all` não concluiu porque a política do PowerShell bloqueou a execução de `yarn.ps1`. Portanto, não há resultado completo de vulnerabilidades transitivas.
- Não executei build, testes, Lighthouse ou medição de bundle/Core Web Vitals.
- As condições de exploração dependentes da hospedagem (por exemplo, runtime Linux/glibc e exposição da API de otimização de imagens) precisam ser confirmadas no ambiente de produção.

## Referências locais

- Dependências: `package.json`, `yarn.lock`
- Autenticação: `middleware.ts`, `src/lib/adminSession.ts`, `src/app/api/admin/auth/route.ts`, `ADMIN_CREDENTIALS.md`
- Upload e entrega de imagens: `src/app/api/upload/route.ts`, `src/app/api/image/[type]/[id]/route.ts`
- SEO: `src/app/layout.tsx`, `src/app/sitemap.xml/route.ts`, `src/app/robots.txt/route.ts`
- Imagens: `public/`, `src/components/PhotoCarousel.tsx`, `src/app/espetaculos/page.tsx`, `src/app/indicacoes/page.tsx`
