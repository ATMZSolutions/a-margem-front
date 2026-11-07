# Pendências da aplicação

Este backlog foi consolidado em 07/11/2026 a partir da auditoria e da revisão complementar feitas em 17/10/2026, além da comparação entre `main` (`afdb8c1`) e `feature/auditoria-e-otimizacao` (`8058125`). O relatório da feature registra correções que ainda não estavam em `main` nessa comparação. Reavalie advisories, configuração e estado do deploy antes de encerrar cada item.

## Segurança e integração

- [ ] **P0 — Integrar as correções de segurança da feature.** `main` ainda declara Next.js e `eslint-config-next` em `15.5.4`; o middleware mantém credenciais padrão e Basic Auth; o upload lê o formulário antes de impor limite e confia no MIME informado. Revisar a versão corrigida adequada no momento da integração e trazer as alterações de dependências, sessão e upload registradas no [relatório de execução](../execucao/relatorio-correcoes.md).
- [ ] **P0 — Rotacionar credenciais administrativas e configurar produção.** Definir `ADMIN_USER`, `ADMIN_PASS` e `JWT_SECRET` exclusivos por ambiente, remover/invalidar credenciais antigas e confirmar que não há fallback inseguro. A remoção de um arquivo do repositório não apaga seu conteúdo do histórico Git.
- [ ] **P1 — Reforçar as APIs administrativas.** Validar a sessão dentro de cada Route Handler, além do middleware; aceitar somente `application/json` como tipo MIME exato nas operações JSON e validar `Origin` nas gravações.
- [ ] **P1 — Corrigir e compartilhar a limitação de login.** Preservar o bloqueio enquanto `blockedUntil` estiver ativo e usar um limitador compartilhado ou da plataforma se a aplicação rodar em várias instâncias/serverless.
- [ ] **P1 — Impor limite do corpo da requisição na hospedagem.** O limite do handler não protege antes da leitura de multipart e pode não cobrir requisições sem `Content-Length`.
- [ ] **P2 — Revisar a documentação do admin.** `ADMIN_README.md` ainda descreve credenciais padrão, Basic Auth e SQLite; atualizar para o fluxo e banco atuais ou removê-lo.

## Operação e validação

- [ ] **P0 — Confirmar variáveis e conexão do banco em produção.** Verificar `DATABASE_URL` no ambiente publicado e testar as páginas que consultam Prisma; o build local não confirma conectividade com Supabase em produção.
- [ ] **P1 — Executar smoke tests em staging.** Cobrir login inválido/válido, sessão expirada, logout, leitura e gravação de CRUD, upload válido, upload acima do limite e MIME falso; conferir também `/_next/image`.
- [ ] **P1 — Configurar Vitest e atingir cobertura mínima.** O projeto não declara script de testes e os relatórios registram que testes automatizados não foram executados. Configurar Vitest, React Testing Library, `jsdom`, cobertura mínima de 80% para linhas, instruções, funções e branches, scripts de execução e gate na CI. Priorizar autorização, validação de payload e upload; seguir os [padrões de desenvolvimento](../desenvolvimento/padroes-de-desenvolvimento.md).
- [ ] **P1 — Validar fluxos com Server Components assíncronos.** O Vitest não cobre diretamente esses componentes do Next.js; testar a lógica isolada com testes unitários e os fluxos de renderização com testes ponta a ponta.

## Conteúdo, SEO e desempenho

- [ ] **P2 — Corrigir a invalidação de cache das imagens do banco.** A URL é estável após edição e pode servir conteúdo antigo por até uma hora; versionar a URL ou ajustar a política de cache.
- [ ] **P2 — Corrigir o ano inicial de projetos.** Quando não há projetos no ano corrente, iniciar pelo ano mais recente disponível.
- [ ] **P2 — Fazer revisão visual dos ativos convertidos.** Conferir home, logotipo e redirecionamentos em telas móveis e desktop depois de integrar as imagens WebP.
- [ ] **P2 — Medir desempenho no deploy.** Comparar bytes de `/_next/image`, Lighthouse, Core Web Vitals e chunks por rota com um baseline; os relatórios não têm baseline anterior nem medição de tráfego real.

## Manutenção

- [ ] **P3 — Avaliar CSP em modo `Report-Only`.** Recolher violações e definir política antes de aplicar bloqueio.
- [ ] **P3 — Reavaliar suporte do ESLint e resolver avisos.** A revisão registrou avisos de lint e pendência de suporte do ESLint 9 em outubro de 2026; confirmar a situação atual e atualizar Next ESLint config em versão compatível.

## Critério para fechar um item

Marque a tarefa como concluída somente depois de registrar onde foi validada (local, staging ou produção), a data e a evidência relevante. Se o item deixar de se aplicar, anote o motivo em vez de apagá-lo do histórico do backlog.
