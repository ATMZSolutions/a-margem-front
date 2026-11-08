# E4 — configurações globais, home, projetos e história

- **Data:** 08/11/2026
- **Branch:** `dev`, sobre `a216344`.
- **Estado:** smoke funcional concluído no Supabase de staging isolado em 08/11/2026 e preview visual das páginas públicas conferido em 858×900. O snapshot de conteúdo foi restaurado ao final; produção não foi acessada.

## Implementado

- Leitores públicos com fallback legado/default para identidade e SEO global, menu, rodapé, contatos, composição da home, destaques da agenda, apresentação institucional, página de contato, galeria/apresentação de projetos e marcos da história.
- As referências locais do inventário resolvem para `Midia` por `origem` quando a chave editorial está ativa. A home e projetos continuam usando os caminhos atuais quando não há seleção ou a chave está desativada.
- A composição da home permite ativar/reordenar seções, manter slides e galeria ordenados, trocar imagens, textos, CTAs, overlay e intervalo. Os destaques da agenda aceitam seleção manual de registros ou escolha automática com limites por cidade e evento.
- Contatos são compartilhados entre home e `/contato`. O painel altera canais, rótulos, URLs, ordem e visibilidade. Navegação, logo, destino/alt, identidade, SEO padrão e rodapé usam a mesma configuração.
- A página de projetos recebe texto, título, fundo e galeria do painel; imagens mantêm alt, legenda, crédito, data e ordem. A lista antiga de datas/descrições continua na entidade `Projeto` que já tem CRUD.
- A página `/sobre` usa `MarcoHistorico` e vínculos `UsoMidia` quando a chave editorial está ativa. O novo editor permite múltiplos marcos por ano, mudar ano, texto, ordem, mídia e estado; arquivar preserva o registro.
- APIs administrativas autenticadas e com mesma origem nas gravações: `/api/admin/configuracoes`, `/api/admin/projetos-pagina` e `/api/admin/historia`. Referências de mídia e limites de campos são validados; gravações de configurações e galeria são transacionais; as páginas públicas afetadas são revalidadas.
- A gravação converte o formato achatado servido ao formulário para o formato persistido de home. IDs determinísticos da migração (70 caracteres) são aceitos nas referências de mídia, contato, menu, galeria e história.

## Como a carga existente preenche as áreas

- Slides, logos, fundos e fotos já têm entradas `Midia` com caminho de origem. Os leitores usam essas referências para formar URLs do Storage; não é preciso subir imagens uma a uma.
- O importador já carrega `CanalContato`, `ItemMenu`, `SecaoHome`, `galeria:projetos`, `MarcoHistorico` e `UsoMidia`. A apresentação tipada da home usa defaults equivalentes ao conteúdo inventariado até que o painel salve os novos campos em chaves próprias de `ConfiguracaoSite`; as configurações genéricas legadas por arquivo permanecem preservadas.
- Edições da galeria de projetos mantêm IDs/chaves de fotos existentes e alteram seus vínculos de forma transacional. A imagem no Storage não é removida quando sai de uma galeria.
- A história importa imagens existentes por relações `UsoMidia`; editar um marco atualiza/remove o vínculo sem apagar o objeto. `anoLegado` é preservado para compatibilidade com a origem.

## Validação local

- `yarn tsc --noEmit` — aprovado após os ajustes descobertos em staging.
- ESLint nos arquivos alterados — aprovado após os ajustes descobertos em staging.
- `git diff --check` — aprovado após os ajustes descobertos em staging.
- Smoke reversível no staging: login e GETs de configurações, projetos, história e mídias aprovados; PUT de configurações, contatos, menu, agenda/rodapé e galeria aprovados; `/`, `/contato`, `/projetos` e `/sobre` refletiram os dados de teste.
- História: criação, edição, publicação, leitura pública, arquivamento e remoção do marco temporário aprovados.
- Uma imagem migrada respondeu HTTP 200 com `Content-Type: image/*`; nenhuma imagem foi enviada e a contagem de registros `Midia` permaneceu inalterada.
- O snapshot de configurações, contatos, menu, seções da home e galeria foi restaurado; o marco e o vínculo temporários foram removidos. A restauração ocorreu também nos caminhos de erro do smoke.
- Conferência somente de leitura posterior: 70 registros `Midia`, 27 fotos na galeria de projetos e nenhum marcador `E4Smoke` remanescente.
- Preview visual de `/`, `/contato`, `/projetos` e `/sobre` em 858×900: textos e imagens carregaram, sem quebra evidente de layout. Um viewport mobile estreito não foi testado.
- Não foi executada uma suíte automatizada.

## Pendências após o smoke

- Se for necessária validação responsiva mais ampla, conferir um viewport mobile estreito. O preview 858×900 não substitui essa medição.
- E0 continua dependendo da confirmação de que o manifesto corresponde à revisão publicada. E5 e E6 continuam pendentes.

Esta implementação não habilita a chave em produção, não altera o código da origem e não faz o corte descrito em E6.
