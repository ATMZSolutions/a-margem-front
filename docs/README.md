# Documentação do projeto

Este diretório reúne auditorias, decisões, execução e trabalho ainda pendente na aplicação. Os documentos de auditoria e execução vieram da branch `feature/auditoria-e-otimizacao` (`8058125`); na criação desta organização, a branch de trabalho era `main` (`afdb8c1`). Portanto, uma correção descrita como concluída na feature só deve ser considerada ativa depois de integrada e validada no ambiente correspondente.

## Pastas

- [`planejamento/`](planejamento/): planos de correção e UX/UI, além do backlog aberto.
- [`desenvolvimento/`](desenvolvimento/): convenções de Gitflow, commits, nomes e testes.
- [`execucao/`](execucao/): alterações feitas na branch de auditoria, verificações registradas e limitações conhecidas.
- [`seguranca/`](seguranca/): auditoria inicial e revisão complementar de segurança.
- [`performance/`](performance/): medições e próximos passos para imagens e desempenho.

## Acompanhar pendências

Consulte o [backlog da aplicação](planejamento/pendencias.md). Ele separa correções já descritas na feature das tarefas que ainda dependem de integração, configuração de produção ou validação em staging.

As auditorias são registros datados, não uma garantia do estado atual do deploy. Atualize o backlog quando uma tarefa for concluída e anote a evidência, o ambiente e a data da validação.
