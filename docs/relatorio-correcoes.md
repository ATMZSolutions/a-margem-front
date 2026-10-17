# Execução do plano de correção

**Data:** 17/10/2026

**Auditoria base:** [auditoria técnica](auditoria-tecnica.md)

**Plano:** [plano de correção](plano-de-correcao.md)

**Atualização de imagens locais:** [medição antes/depois e limites de qualidade](otimizacao-imagens-2026-10-17.md).

## Correções feitas

### Dependências

- Atualizados `next` e `eslint-config-next` para `15.5.28`, `react` e `react-dom` para `19.2.9`.
- Declarado `sharp@0.35.5` diretamente; a atualização do Next também resolve essa versão no otimizador.
- Gerado o Prisma Client para o schema atual.

### Autenticação, sessões e dados administrativos

- Removidos os valores padrão de usuário, senha e segredo JWT. O painel e as APIs falham fechados quando a configuração está ausente ou fraca.
- Removido o fallback de Basic Auth. O middleware exige o cookie assinado para `/admin`, `/api/admin/*` e `/api/upload`.
- O JWT usa Web Crypto, valida assinatura, usuário e expiração e dura no máximo 8 horas. O cookie é `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Adicionado limite progressivo de tentativas de login. O contador é local ao processo; em hospedagem com múltiplas instâncias, deve ser substituído por um limitador compartilhado ou da plataforma.
- Corrigida a espera assíncrona pela validação de sessão na página do admin.
- Reescritas as rotas de CRUD do admin para aceitar campos permitidos, validar tipos, tamanhos, datas e identificadores. Listas de livros e histórico deixam de enviar os blobs completos ao navegador.
- Excluído `ADMIN_CREDENTIALS.md`, que continha uma credencial. A exclusão não remove o valor do histórico Git; a credencial antiga precisa ser rotacionada.

### Upload e entrega de imagens

- O upload exige sessão administrativa e mesma origem quando o cabeçalho `Origin` está presente.
- Arquivos têm limite de 5 MiB. JPEG, PNG e WebP são reconhecidos pela assinatura e decodificados por `sharp`, com limite de 40 megapixels.
- Imagens são giradas conforme orientação, redimensionadas para no máximo 2200 × 2200, recomprimidas em WebP e gravadas sem metadados. A resposta traz somente Base64 e MIME; o preview usa uma URL temporária no navegador.
- As rotas que persistem imagens validam Base64, tamanho, MIME e assinatura novamente.
- As consultas de livros e histórico passaram a buscar somente os metadados e um indicador SQL de existência da imagem; os blobs não são carregados ao renderizar listas públicas ou administrativas.
- A rota de imagem permite somente JPEG, PNG e WebP, confere o conteúdo, define `X-Content-Type-Options: nosniff` e limita o cache.
- A aplicação rejeita `Content-Length` acima do limite antes de ler o formulário. A plataforma de hospedagem ainda precisa impor o próprio limite de corpo da requisição, incluindo quando `Content-Length` não é fornecido.

### SEO e renderização

- Definidos `metadataBase`, metadados globais e títulos, descrições, canonical e Open Graph por rota pública.
- Agenda, notícias, projetos, histórico e indicações consultam o banco no servidor e entregam o conteúdo principal no HTML inicial.
- Adicionados metadados próprios aos detalhes de espetáculos, prêmios e integrantes.
- O sitemap inclui as páginas de detalhe geradas dos dados estáticos e não inventa datas `lastmod`.
- O `robots.txt` exclui o admin e APIs, preservando o acesso dos robôs às imagens públicas.

### Desempenho e cabeçalhos

- Substituídas nove fotos da home por WebP qualidade 90, sem alterar suas dimensões; o conjunto caiu de 5.931.398 B para 1.423.264 B. O logotipo caiu de 989.669 B para 359.454 B com pixels decodificados idênticos. Os URLs antigos recebem redirecionamento permanente. A redução total em `public/` foi de 5.138.349 B (22,9%); veja as ressalvas de qualidade e tráfego no [relatório de imagens](otimizacao-imagens-2026-10-17.md).
- Convertidas para `next/image` as imagens principais de carrosséis, espetáculos, integrantes, livros, histórico e home, com dimensões/responsividade ou `fill` e `sizes`.
- O Drawer do menu global é carregado somente quando o menu abre; a animação Framer Motion foi retirada do cabeçalho global e ícones foram trocados por SVGs Lucide.
- O listener de scroll da home agora limita o cálculo a um frame e só atualiza estado quando o valor muda.
- Adicionados `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, remoção do cabeçalho `X-Powered-By` e HSTS em produção.

## Verificações

- `yarn.cmd generate`: concluído.
- `yarn.cmd lint`: concluído sem erros; o projeto ainda reporta 19 avisos de hooks e código administrativo não utilizado.
- `yarn.cmd npm audit --all`: sem advisories de segurança críticos ou altos no resultado consultado. Foi reportada uma pendência moderada de suporte: `eslint@9.37.0` está fora de suporte segundo a [política de versões do ESLint](https://eslint.org/version-support/).
- `yarn.cmd build`: concluído com sucesso. O relatório de build mostra 135 kB de JavaScript compartilhado e 185 kB para a home; não há baseline anterior para comparar a redução.
- Não foram executados testes automatizados, Lighthouse ou medições comparativas de bundle/Core Web Vitals.

## Pendências antes de produção

1. Configurar `ADMIN_USER`, `ADMIN_PASS` (mínimo 16 caracteres) e `JWT_SECRET` (mínimo 32 bytes) no ambiente, usar valores exclusivos e rotacionar a credencial antiga.
2. Impor limite de corpo no proxy/hospedagem antes de o Next.js processar multipart.
3. Substituir o rate limiter local por um mecanismo compartilhado se houver mais de uma instância ou função serverless.
4. Validar login, CRUD, expiração de sessão, logout e upload válido/inválido em staging; verificar `/_next/image` no runtime real.
5. Repetir a auditoria no deploy, medir Lighthouse e Web Vitals e comparar os chunks por rota com um baseline.
6. Planejar a migração do ESLint 9 para 10 junto de uma versão de `eslint-config-next` que declare suporte ao ESLint 10. A configuração Next 15.5.28 declara peer support até ESLint 9; a mudança foi isolada para não introduzir uma combinação incompatível.
7. Avaliar CSP em modo `Report-Only` e resolver alertas restantes de lint sem alterar fluxos editoriais.

O limitador de login em memória ajuda contra repetição dentro de uma instância, mas não substitui proteção no edge. A validade do JWT é curta, mas logout apaga o cookie do navegador e não revoga um token copiado antes da expiração.
