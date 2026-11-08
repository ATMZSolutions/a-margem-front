# Pendências da aplicação

Este backlog foi consolidado em 07/11/2026 a partir da auditoria e da revisão complementar feitas em 17/10/2026, além da comparação entre `main` (`afdb8c1`) e `feature/auditoria-e-otimizacao` (`8058125`). O relatório da feature registra correções que ainda não estavam em `main` nessa comparação. Reavalie advisories, configuração e estado do deploy antes de encerrar cada item.

## Segurança e integração

- [ ] **P0 — Integrar as correções de segurança da feature.** `main` ainda declara Next.js e `eslint-config-next` em `15.5.4`; o middleware mantém credenciais padrão e Basic Auth; o upload lê o formulário antes de impor limite e confia no MIME informado. Revisar a versão corrigida adequada no momento da integração e trazer as alterações de dependências, sessão e upload registradas no [relatório de execução](../execucao/relatorio-correcoes.md).
- [ ] **P0 — Rotacionar credenciais administrativas e configurar produção.** Definir `ADMIN_USER`, `ADMIN_PASS` e `JWT_SECRET` exclusivos por ambiente, remover/invalidar credenciais antigas e confirmar que não há fallback inseguro. A remoção de um arquivo do repositório não apaga seu conteúdo do histórico Git.
- [x] **P1 — Reforçar as APIs administrativas.** Em 07/11/2026, os Route Handlers revalidam a sessão; gravações exigem mesma origem e as operações JSON aceitam somente o tipo MIME `application/json`. Ver `src/lib/adminRequest.ts`, `src/lib/adminInput.ts` e `src/app/api/admin/**/route.ts`. A validação de comportamento em staging continua no smoke test abaixo.
- [x] **P1 — Preservar bloqueios ativos no limitador local.** Em 07/11/2026, a janela não reinicia enquanto `blockedUntil` estiver no futuro (`src/app/api/admin/auth/route.ts`).
- [ ] **P1 — Compartilhar a limitação de login.** O `Map` permanece local à instância; configurar limitador compartilhado ou proteção da plataforma antes de operar com múltiplas instâncias/serverless.
- [ ] **P1 — Impor limite do corpo da requisição na hospedagem.** O limite do handler não protege antes da leitura de multipart e pode não cobrir requisições sem `Content-Length`.
- [x] **P2 — Revisar a documentação do admin.** Em 07/11/2026, `ADMIN_README.md` foi atualizado para o login por variáveis de ambiente, Yarn 4/Corepack e PostgreSQL; removeu credenciais padrão e instruções de Basic Auth/SQLite.

## Operação e validação

- [ ] **P0 — Confirmar variáveis e conexão do banco em produção.** Verificar `DATABASE_URL` no ambiente publicado e testar as páginas que consultam Prisma; o build local não confirma conectividade com Supabase em produção.
- [ ] **P1 — Executar smoke tests em staging.** Cobrir login inválido/válido, sessão expirada, logout, leitura e gravação de CRUD, upload válido, upload acima do limite e MIME falso; conferir também `/_next/image`.
- [ ] **P1 — Configurar Vitest e atingir cobertura mínima.** Vitest, React Testing Library, `jsdom`, scripts, gate na CI e cobertura acima de 80% foram configurados para a fatia administrativa testada em 07/11/2026: autorização, validação de payload, APIs CRUD, upload, cache, login e componentes de Notícias/imagens. Falta ampliar a cobertura para os demais módulos da aplicação; seguir os [padrões de desenvolvimento](../desenvolvimento/padroes-de-desenvolvimento.md).
- [ ] **P1 — Validar fluxos com Server Components assíncronos.** O Vitest não cobre diretamente esses componentes do Next.js; testar a lógica isolada com testes unitários e os fluxos de renderização com testes ponta a ponta.

## Conteúdo, SEO e desempenho

- [ ] **P2 — Concluir a migração automatizada do conteúdo e imagens para Supabase.** E1 (schema/infraestrutura) e E2 (carga integral em staging) foram concluídas em 08/11/2026 para o manifesto registrado no [relatório de importação](../execucao/importacao-staging-conteudo-2026-11-08.md): 326/326 itens verificados, 93 registros legados conferidos, 70 mídias conferidas e a repetição integral não criou nem atualizou linhas. A implementação E3 dos leitores/módulos editoriais está na `main`, atrás de `CONTEUDO_EDITORIAL_SUPABASE_ATIVO`; seu smoke em staging ainda está pendente. E0 precisa confirmar a revisão publicada, E4–E5 precisam integrar as demais áreas, e E6 ainda requer backup, delta e corte controlado de produção. O schema foi ensaiado em PostgreSQL 17.11 e PGlite 18.6; o staging passou em grants/RLS, sequences e checksums. Origem e produção não foram alteradas.

- [ ] **P2 — Tornar o conteúdo público administrável pelo painel.** Seguir o [catálogo de conteúdo ainda fora do admin](catalogo-conteudo-administravel.md), levantado na `main` (`c05ce1b`) em 07/11/2026. O inventário cobre todas as rotas públicas e as lacunas compartilhadas, com itens C01–C15 e critérios de aceite. E3 está implementada na `main` e aguarda smoke em staging; E4–E5 continuam pendentes.

- [x] **P2 — Reduzir o tempo de cache das imagens do banco.** Em 07/11/2026, `src/app/api/image/[type]/[id]/route.ts` reduziu o cache público de uma hora para 60 segundos e exige revalidação; uma imagem ainda pode ficar desatualizada por até um minuto.
- [x] **P2 — Corrigir o ano inicial de projetos.** Em 07/11/2026, `src/app/projetos/ProjetosClient.tsx` inicia no ano mais recente disponível e usa o ano atual somente quando não há projetos.
- [ ] **P2 — Fazer revisão visual dos ativos convertidos.** Conferir home, logotipo e redirecionamentos em telas móveis e desktop depois de integrar as imagens WebP.
- [ ] **P2 — Medir desempenho no deploy.** Comparar bytes de `/_next/image`, Lighthouse, Core Web Vitals e chunks por rota com um baseline; os relatórios não têm baseline anterior nem medição de tráfego real.

## Manutenção

- [ ] **P3 — Avaliar CSP em modo `Report-Only`.** Recolher violações e definir política antes de aplicar bloqueio.
- [ ] **P3 — Reavaliar suporte do ESLint e resolver avisos.** A revisão registrou avisos de lint e pendência de suporte do ESLint 9 em outubro de 2026; confirmar a situação atual e atualizar Next ESLint config em versão compatível.

## Critério para fechar um item

Marque a tarefa como concluída somente depois de registrar onde foi validada (local, staging ou produção), a data e a evidência relevante. Se o item deixar de se aplicar, anote o motivo em vez de apagá-lo do histórico do backlog.
