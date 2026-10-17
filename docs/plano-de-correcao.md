# Plano de correção

**Data:** 17/10/2026

**Base:** [Auditoria técnica](auditoria-tecnica.md)

## Objetivo

**Execução e estado atual:** [relatório de correções](relatorio-correcoes.md).

**Fase de imagens:** dez arquivos locais otimizados; [resultado medido e próximos passos](otimizacao-imagens-2026-10-17.md). A medição visual e de tráfego real ainda está pendente.

Eliminar primeiro os caminhos de execução remota, acesso administrativo não autorizado e negação de serviço; em seguida melhorar rastreamento, conteúdo indexável, imagens e JavaScript enviado ao navegador.

## Ordem de execução

| Fase | Prioridade | Entrega |
| --- | --- | --- |
| 0. Redução imediata de exposição | Imediata, se o site estiver público | Ambiente de hospedagem confirmado, credenciais rotacionadas e patch de segurança preparado |
| 1. Dependências críticas | P0 | Next.js, React/RSC e `sharp` em versões corrigidas |
| 2. Autenticação administrativa | P1 | Sem valores padrão, sessão e login endurecidos |
| 3. Upload e imagens recebidas | P1 | Upload autenticado, limitado e validado |
| 4. SEO e renderização | P2 | Metadados por página, conteúdo no HTML inicial e sitemap completo |
| 5. Imagens e bundle | P2 | Menos bytes no carregamento inicial e dependências compartilhadas reduzidas |
| 6. Prevenção e monitoramento | P2 | Auditoria contínua e cabeçalhos de segurança |

## Fase 0 — Reduzir exposição

1. Confirmar onde a aplicação está hospedada, se está pública, o runtime e o sistema operacional. Registrar se o servidor usa Linux com glibc e se a rota `/_next/image` está exposta.
2. Se o site estiver público, preparar a atualização de segurança como hotfix e priorizá-la sobre as melhorias de SEO e performance.
3. Rotacionar `ADMIN_USER`, `ADMIN_PASS` e `JWT_SECRET`; usar valores aleatórios e exclusivos por ambiente. Não copiar valores secretos para este repositório ou para logs.
4. Se a versão vulnerável já esteve pública, revisar logs de aplicação e plataforma desde a exposição. Tratar a rotação de outros segredos da aplicação conforme evidências e política de resposta a incidentes.

**Critérios de conclusão:** ambiente e exposição documentados; novos segredos instalados em produção e staging; nenhum segredo novo adicionado ao repositório.

## Fase 1 — Atualizar dependências críticas

1. Em uma branch de correção, atualizar `next` e `eslint-config-next` juntos para uma versão corrigida compatível com a linha 15.5, **no mínimo 15.5.28** conforme os advisories verificados em 17/10/2026. Preferir patch posterior, se já estiver disponível e corrigido no momento da implementação.
2. Atualizar `react` e `react-dom` de forma compatível com Next. A versão 19.2.9 foi publicada como correção para os pacotes RSC na linha 19.2; verificar a resolução real de `react-server-dom-*` usada pelo Next antes de concluir.
3. Atualizar o lockfile e confirmar que a versão de `sharp` usada pelo otimizador é pelo menos 0.35.5. Não instalar diretamente pacotes internos de RSC sem orientação do Next; confirmar a árvore com o gerenciador de pacotes.
4. Executar a auditoria completa de dependências em um ambiente que permita executar Yarn e acessar o registry. Corrigir vulnerabilidades críticas/altas adicionais ou registrar justificativa e prazo para cada exceção.
5. Rodar lint e build de produção. Corrigir regressões e testar em staging antes do deploy.
6. Após publicar a correção, observar erros 5xx, uso de CPU/memória, falhas de otimização de imagens e fluxos do admin. Se a aplicação vulnerável ficou exposta, avaliar rotação adicional de segredos.

**Critérios de conclusão:** Next e configuração de lint em versões corrigidas; `sharp` e pacotes RSC resolvidos em versões corrigidas; auditoria de dependências sem vulnerabilidades críticas/altas sem plano aceito; build, staging e smoke tests aprovados.

**Referências:** [CVE-2025-66478 do Next.js](https://nextjs.org/blog/CVE-2025-66478), [advisory de otimização de imagens](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), [advisory RSC do React](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3), [release Next.js 15.5.28](https://github.com/vercel/next.js/releases/tag/v15.5.28), [release React 19.2.9](https://github.com/facebook/react/releases/tag/v19.2.9).

## Fase 2 — Corrigir autenticação do admin

1. Centralizar a leitura de configuração de autenticação para middleware e rota de login, removendo os fallbacks de usuário, senha e segredo JWT.
2. Fazer a aplicação falhar no início quando variáveis obrigatórias estiverem ausentes ou fracas; não gerar segredo silenciosamente em produção.
3. Remover `ADMIN_CREDENTIALS.md` do estado atual do repositório e rotacionar a credencial documentada. Se o repositório for público ou amplamente compartilhado, avaliar também a remoção do segredo do histórico conforme o processo do repositório; a rotação continua necessária.
4. Adicionar limitação progressiva de tentativas por conta e origem no login, com respostas genéricas para usuário ou senha inválidos e registro de tentativas sem incluir senha/token.
5. Definir `Secure` no cookie em produção; manter `HttpOnly` e `SameSite`; usar somente HTTPS; explicitar `Path`, prazo da sessão e comportamento de logout.
6. Fazer logout revogar a sessão no servidor ou documentar a janela máxima de validade do token. Corrigir a checagem server-side para aguardar a validação assíncrona da sessão em `src/app/admin/page.tsx`.
7. Validar que toda rota `/api/admin/*` permanece protegida e que a rota de login é a única exceção necessária.

**Critérios de conclusão:** inicialização falha sem configuração segura; credenciais rotacionadas; requisições sem sessão válida não leem nem alteram dados administrativos; sessões expiradas/revogadas falham; cookie de produção inclui `Secure`; tentativas repetidas são limitadas.

## Fase 3 — Proteger upload e entrega de imagens

1. Restringir `/api/upload` à sessão administrativa, se não houver requisito de upload público. Aplicar o mesmo controle no servidor da rota, não apenas na interface.
2. Definir limite de corpo também no proxy/plataforma, antes de `request.formData()`, e limite de arquivo no handler. Como ponto inicial, avaliar 5 MiB por arquivo e ajustar ao conteúdo editorial real.
3. Permitir somente formatos necessários (por exemplo JPEG, PNG e WebP); não aceitar SVG ou formatos ativos sem requisito explícito. Conferir assinatura e decodificar a imagem, em vez de confiar em `file.type`.
4. Limitar dimensões e número de pixels; recomprimir e remover metadados quando possível. Retornar ao frontend uma única representação apropriada, sem enviar simultaneamente Buffer serializado e data URL completa.
5. Validar corpo e campos em todas as rotas administrativas antes de enviar dados ao Prisma. Usar lista permitida de campos e tipos por modelo.
6. Na rota `/api/image/[type]/[id]`, permitir apenas os MIME validados, definir o `Content-Type` a partir do formato verificado e enviar `X-Content-Type-Options: nosniff`.
7. Aplicar limites de requisição e monitoramento para reduzir abuso de recursos.

**Critérios de conclusão:** visitante não autenticado não consegue usar upload administrativo; arquivo acima do limite e tipo falso são rejeitados; SVG não é servido como conteúdo ativo; imagens aceitas são decodificadas com sucesso e o tamanho da resposta não contém cópias redundantes.

## Fase 4 — Melhorar SEO e HTML inicial

1. Adicionar metadados por rota pública: título, descrição, canonical e Open Graph. Usar `generateMetadata` nos detalhes dinâmicos.
2. Mover a busca de dados públicos de `useEffect` para carregamento no servidor. Manter componentes cliente apenas para interações (calendário, drawer, filtros e navegação).
3. Gerar sitemap incluindo detalhes válidos de espetáculos, prêmios e integrantes. Usar `lastModified` real; omitir datas não confiáveis.
4. Atualizar `robots.txt` para excluir admin e endpoints de API do rastreamento. Não tratar `robots.txt` como mecanismo de autenticação.
5. Revisar hierarquia de headings, um título principal descritivo por página, texto alternativo e links internos para páginas de detalhe.
6. Confirmar que `metadataBase`, canonical, Open Graph e sitemap usam o domínio canônico de produção.

**Critérios de conclusão:** HTML da resposta inicial contém o conteúdo público principal; cada rota pública tem título/descrição próprios; sitemap inclui rotas dinâmicas válidas e datas confiáveis; admin/API não aparecem como páginas rastreáveis.

## Fase 5 — Otimizar imagens e bundle

1. Capturar baseline de Lighthouse/Web Vitals e tamanhos dos chunks por rota antes de mudar o frontend.
2. Começar pelas maiores imagens e pela home: redimensionar ao maior tamanho de exibição, converter fotografias para WebP/AVIF e revisar qualidade visual em telas móveis e desktop.
3. Usar `next/image` com `width`/`height` ou `fill`, `sizes` coerente e `priority` somente para o elemento LCP. Aplicar lazy loading em conteúdo abaixo da primeira dobra. Manter a otimização desativada para SVG conforme o comportamento seguro do Next.
4. Revisar os carrosséis e o hero: carregar imagens que serão exibidas, mas evitar transferir todas as versões grandes sem necessidade; evitar CSS background quando for importante fornecer dimensões/responsividade.
5. Medir a contribuição do `Sidebar` global. Carregar o Drawer sob demanda ou substituir a dependência se a medição confirmar custo relevante. Revisar imports de Ant Design, ícones e Framer Motion por rota.
6. Reduzir atualizações no listener de scroll da home, preferindo `IntersectionObserver` ou atualização limitada por frame, e evitar estado repetido quando o valor não muda.
7. Repetir as medições após as alterações e comparar com o baseline. Proposta inicial: nenhuma imagem não crítica acima de 500 KB; imagens da primeira dobra dimensionadas e comprimidas; nenhuma imagem abaixo da dobra transferida antes de necessária. Ajustar o limite após avaliação visual.

**Critérios de conclusão:** carregamento inicial menor que o baseline; imagens responsivas com dimensões reservadas; imagens fora da primeira dobra carregadas sob demanda; chunk compartilhado medido e sem dependência desnecessária incluída globalmente; sem regressão visual relevante.

## Fase 6 — Prevenção contínua

1. Adicionar `yarn npm audit --all` à CI e uma rotina automática de atualização de dependências. Fazer a CI falhar para vulnerabilidades críticas e altas sem exceção documentada.
2. Adicionar verificações de lint e build em pull requests; manter um processo de revisão de advisories para Next, React, Prisma e dependências de upload/imagem.
3. Adicionar cabeçalhos de segurança no Next/proxy: `X-Content-Type-Options`, `Referrer-Policy`, política de frame e `Strict-Transport-Security` apenas em domínio HTTPS.
4. Introduzir CSP primeiro em modo `Report-Only`, revisar violações do Next, Ant Design e recursos externos; passar a enforcement depois de validar o site.
5. Documentar responsável, prazo e aceite para exceções de segurança ou budgets de performance.

**Critérios de conclusão:** CI executa auditoria de dependências; headers conferidos em staging/produção; CSP implantada sem bloquear recursos legítimos; exceções têm dono e data de expiração.

## Verificação final antes do deploy

- `yarn npm audit --all` sem críticas/altas não tratadas.
- Lint e build de produção aprovados.
- Em staging: rotas admin testadas sem sessão, com sessão inválida, expirada e válida.
- Upload testado com arquivo válido, arquivo excessivo, MIME falsificado e tentativa não autenticada.
- `/_next/image` servido pela versão corrigida; imagens públicas carregam sem erro.
- HTML inicial, titles, canonical, sitemap e robots conferidos.
- Lighthouse/Web Vitals e tamanhos do bundle comparados ao baseline.
- Logs e métricas monitorados após a publicação.

## Dependências e observações

- A auditoria completa de pacotes não foi executada na revisão inicial porque o PowerShell bloqueou a execução do wrapper `yarn.ps1`; a primeira atividade da Fase 1 é executá-la em um ambiente autorizado.
- A recomendação de versão mínima reflete advisories verificados em 17/10/2026. Confirmar novamente os advisories oficiais antes de atualizar, pois novas correções podem ter sido publicadas.
- O escopo e o limite máximo de upload dependem do fluxo editorial e da plataforma de hospedagem; o limite de 5 MiB é uma proposta inicial, não uma medição do uso atual.
