# Padrões de desenvolvimento

Estas convenções orientam novas alterações e a manutenção do código existente. Nomes exigidos pelo framework, pelo sistema operacional, por ferramentas ou por protocolos seguem a convenção técnica correspondente.

## Fluxo de branches: Gitflow

- `main` contém o código de produção.
- `dev` é a branch de integração do projeto e cumpre o papel de `develop` no Gitflow atual.
- Crie `feature/<descricao-em-portugues>` a partir de `dev` para funcionalidades e melhorias.
- Crie `release/<versao>` a partir de `dev` para preparar uma versão; integre a versão validada em `main` e atualize `dev` com as correções finais.
- Crie `hotfix/<descricao-em-portugues>` a partir de `main` para correções urgentes; após validar e integrar em `main`, leve a correção também para `dev`.
- Use letras minúsculas, números quando necessário e hífens nos nomes descritivos. Os prefixos `feature/`, `release/` e `hotfix/` permanecem em inglês por serem convenções do Gitflow.

Exemplos: `feature/auditoria-de-seguranca`, `release/1.2.0` e `hotfix/corrige-login`.

## Mensagens de commit

Use o formato Conventional Commits. Os tipos padronizados permanecem em inglês; o escopo e a descrição devem estar em português. Escreva a descrição no presente, de forma direta, e sem ponto final.

Formato: `<tipo>(<escopo>): <descricao em portugues>`

Tipos recomendados: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore` e `revert`.

Exemplos:

- `feat(admin): valida sessão antes de salvar conteúdo`
- `fix(agenda): corrige a seleção da data atual`
- `docs: registra pendências de segurança`
- `test(upload): cobre rejeição de arquivo inválido`

## Idioma e nomes no código

- Escreva em português os nomes de variáveis, funções, tipos, componentes, testes e arquivos novos.
- Prefira nomes claros do domínio da aplicação. Use `camelCase` para variáveis e funções, `PascalCase` para componentes React e tipos, e `UPPER_SNAKE_CASE` para constantes globais quando fizer sentido.
- Use nomes de arquivo em português, em minúsculas e com hífens quando houver mais de uma palavra; por exemplo, `validar-sessao.ts` e `agenda.test.ts`.
- A regra vale para código novo e para nomes que já precisem ser alterados durante uma tarefa. Evite renomeações em massa sem necessidade funcional, pois elas aumentam o diff e dificultam a revisão.
- Preserve nomes impostos por convenções técnicas. No Next.js, por exemplo, arquivos como `page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts` e `not-found.tsx` precisam manter seus nomes reconhecidos pelo framework. O mesmo vale para comandos, APIs e identificadores públicos definidos por bibliotecas ou serviços externos.

## Testes com Vitest

- Use Vitest para testes unitários e testes de componentes. Para componentes React, use React Testing Library e `jsdom` quando o teste depender de APIs do navegador.
- Coloque cada teste junto do arquivo que cobre, usando o sufixo `.test.ts` ou `.test.tsx`. Exemplo: `Agenda.tsx` e `Agenda.test.tsx` no mesmo diretório. Não crie uma pasta raiz `/test` nem concentre os testes em uma pasta global.
- Nomeie arquivos, variáveis e descrições dos testes em português, respeitando as convenções obrigatórias das ferramentas.
- Configure a cobertura para incluir o código da aplicação e exigir pelo menos 80% em linhas, instruções, funções e branches. Aplique os limites na execução local e na CI. Exclua apenas arquivos gerados ou arquivos sem lógica testável, com cada exclusão documentada na configuração.
- Use `vitest run` para a execução previsível na CI e um comando separado de cobertura, como `vitest run --coverage`. Mantenha o modo watch disponível para desenvolvimento local.
- Teste resultados e comportamento observável; cubra caminhos de sucesso, falhas e limites relevantes, especialmente em autenticação, validação de dados e operações de escrita.
- O Vitest atualmente não oferece suporte a componentes de servidor assíncronos do Next.js. Cubra a lógica de negócio desses componentes com testes unitários e valide os fluxos que dependem da renderização assíncrona com testes ponta a ponta.

O guia do [Next.js para Vitest](https://nextjs.org/docs/app/guides/testing/vitest) documenta a integração e a possibilidade de manter testes junto ao código. A [documentação do Next.js sobre tipos de teste](https://nextjs.org/docs/app/guides/testing) descreve a limitação de Server Components assíncronos. Os limites de cobertura configuráveis estão na [documentação do Vitest](https://vitest.dev/guide/coverage).
