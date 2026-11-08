# Inventário local e estrutura do importador

Entrega em 07/11/2026, na `main`, sobre `c05ce1b`, com alterações locais ainda sem commit. Relacionada a E0 e à infraestrutura inicial de E1 do [plano](../planejamento/plano-execucao-conteudo-supabase.md). Essas etapas permanecem parcialmente abertas.

## Implementado

- CLI de inventário e simulação offline, com relatórios JSON/Markdown e hashes das fontes/arquivos.
- Extração AST sem executar componentes; normalização/conciliação de integrantes, espetáculos, prêmios e galeria de projetos.
- Inventário de mídia, referência estática, dimensões/formato, deduplicação e detecção de ausência/conflito.
- Planejamento de chaves imutáveis do Storage e chaves de origem; regra para ignorar repetição e bloquear sobrescrita de edições posteriores.
- Bloqueio explícito de execução remota; nenhum schema, dado ou arquivo remoto foi alterado.

Uso e limitações em [`scripts/conteudo/README.md`](../../scripts/conteudo/README.md).

## Resultado observado no checkout

| Item | Quantidade |
| --- | ---: |
| Fontes | 58 |
| Arquivos em `public/` + favicon | 70 |
| Bytes totais | 17.316.784 |
| Integrantes | 6 |
| Espetáculos | 2 |
| Prêmios | 1 |
| Fotos na galeria de projetos | 27 |
| Referências estáticas ausentes detectadas | 0 |
| Conflitos entre domínios conciliados | 0 |
| Grupos de arquivos idênticos | 1 |
| Objetos únicos propostos para conteúdo referenciado + favicon | 64 |
| Entidades planejadas nesses quatro domínios | 36 |

Arquivos `/espetaculos/xire/img10.jpg` e `/projetos/2023-10-21.jpg` têm os mesmos bytes: a migração pode usar um único objeto, mantendo dois vínculos editoriais. Cinco arquivos não tiveram uso estático encontrado: `/file.svg`, `/globe.svg`, `/next.svg`, `/vercel.svg` e `/window.svg`. Nenhum foi removido.

Os relatórios detalhados ficam em `.conteudo-migracao/`, fora do versionamento, e são regeneráveis pelos comandos documentados. Os números acima não incluem blobs/registros do banco, imagens externas ou referências dinâmicas não resolvidas. Ausência de referências estáticas quebradas não comprova o deploy.

## Validação

`yarn test:coverage`: 19 arquivos e 119 testes passaram, incluindo 7 testes do inventário/planejamento. Cobertura geral: 96,39% de linhas e 90,58% de branches; nos dois módulos novos: 100% de linhas e 89,65% de branches.

## Pendente

Continuam pendentes confirmar a revisão publicada e identidade/topologia do destino, provisionar Storage e implementar executor com persistência/retomada. O snapshot, o baseline/schema e o ensaio da cadeia foram concluídos em entregas posteriores; a [projeção local dos DTOs e a validação de mídia](projecao-dtos-midias-2026-11-07.md) prepara os dados automaticamente. O uso remoto depende do executor e da validação em staging.
