# Plano de execução: site administrável e migração automática para Supabase

Plano criado em **07/11/2026**, na `main`, a partir do código em `c05ce1b` e do [catálogo C01–C15](catalogo-conteudo-administravel.md). Inventário local, snapshot somente leitura, projeção de DTOs, validação de mídias, adaptador Storage, orquestrador, adaptador Prisma e comando protegido de staging foram preparados e ensaiados; detalhes no [inventário](../execucao/inventario-conteudo-2026-11-07.md), [ensaio do Storage](../execucao/adaptador-storage-local-2026-11-07.md), [orquestrador](../execucao/orquestrador-importacao-local-2026-11-08.md) e [adaptador Prisma](../execucao/adaptador-prisma-local-2026-11-08.md). O adaptador foi ensaiado em PGlite/PostgreSQL 18.6 e PostgreSQL 17.11 efêmeros com Prisma 6.17. Baseline, migração editorial, importação integral e a migração aditiva E5 para os cinco modelos legados foram aplicados ao staging isolado; os [relatórios de execução](../execucao/importacao-staging-conteudo-2026-11-08.md) e [E5](../execucao/integracao-editorial-e5-2026-11-08.md) registram hashes, contagens, repetição idempotente e limites restantes.

Schema e histórico foram [reconciliados por consulta ao catálogo](../execucao/reconciliacao-baseline-2026-11-07.md): baseline `0_base_legada` preparado e quatro scripts antigos arquivados, sem alterar seus bytes. A cadeia SQL e os fluxos reais da CLI foram validados em PostgreSQL 17.11 isolado, para a origem observada em 17.6. RLS legado foi preservado e previsto para as tabelas novas. O baseline foi registrado no staging vazio pelo `migrate deploy`; a origem e produção não foram alteradas.

## Status atual das etapas (08/11/2026)

- **E0 — Parcial:** inventário, snapshot somente leitura e projeção local estão prontos; a identidade do projeto staging e a topologia `bancos-separados` foram confirmadas. Falta confirmar se o snapshot de origem corresponde à revisão publicada.
- **E1 — Concluída em staging:** as duas migrações foram aplicadas ao banco vazio, preflight aprovado nas 22 tabelas e o bucket público foi criado/verificado com os limites esperados.
- **E2 — Concluída para o manifesto confirmado:** 326 itens verificados, 70 objetos conferidos, cinco tabelas legadas conciliadas e uma segunda execução integral produziu 326 ignorados, sem novas linhas.
- **E3 — Concluída em staging:** leitores, sitemap, APIs e áreas administrativas de integrantes, espetáculos e prêmios consultam as mesmas entidades quando `CONTEUDO_EDITORIAL_SUPABASE_ATIVO=true`. Smoke de CRUD, publicação, detalhes e sitemap aprovado; a limpeza confirmou zero registros temporários. A mídia de referência já existia e não foi duplicada. Evidências no [relatório E3](../execucao/integracao-editorial-e3-2026-11-08.md).
- **E4 — Smoke funcional e preview visual concluídos em staging/local em 08/11/2026:** home, agenda em destaque, contatos, menu, identidade/SEO global, projetos e história tiveram leitura, gravação temporária, leitura pública e restauração aprovadas. Uma mídia migrada respondeu HTTP 200; páginas públicas foram conferidas em 858×900 sem quebra evidente. Um viewport mobile estreito não foi medido. Evidências e limites no [relatório E4](../execucao/integracao-editorial-e4-2026-11-08.md).
- **E5 — Em andamento:** a `dev` acrescentou publicação/ordem/SEO aos cinco modelos legados, o módulo transversal de SEO e aparência/textos e uma primeira biblioteca de mídia com referências e candidatos a órfãos. A migração `20261108030000_publicacao_ordem_seo_legado` foi aplicada ao staging; as 93 linhas legadas permaneceram publicadas com ordem inicial sequencial. Schema, TypeScript, ESLint focado, cadeia SQL isolada, smoke reversível de API/páginas/sitemap e smoke visual/funcional da biblioteca passaram. Treze rotas públicas (com exemplos dos detalhes dinâmicos) passaram pela revisão mobile em 390×844 e verificação de renderização/overflow em 1280×900; a largura da foto na ficha de integrante foi corrigida. O painel ainda precisa da revisão responsiva dos editores restantes; uma inspeção rápida encontrou saturação temporária do pool de staging (`pool_size: 15`), sem gravação de dados. Também faltam auditoria de textos fixos e rotina de retenção/reconciliação de órfãos; consulte o [relatório E5](../execucao/integracao-editorial-e5-2026-11-08.md).

E0 continua pendente até confirmar que o snapshot corresponde à revisão publicada. E5 está em execução; o próximo trabalho é revisar visualmente os editores restantes, revisar strings fixas remanescentes e definir/implementar a retenção e reconciliação de órfãos. A implementação pública está atrás de uma chave reversível; nenhum corte em produção nem alteração da origem foi feito.

## Resultado esperado e decisões de arquitetura

Todo o conteúdo atual deve chegar ao painel preenchido: textos, contatos, integrantes, espetáculos, prêmios, galerias, identidade e configurações. A importação lerá os arquivos do projeto e o banco de origem automaticamente. Não haverá recadastro de textos ou upload individual de imagens.

- **Supabase PostgreSQL + Prisma:** entidades editoriais, configurações, relações, estados de publicação e metadados de mídia.
- **Supabase Storage:** arquivos de imagem; banco guarda bucket, chave e metadados, em vez de novos blobs/base64.
- **Next.js no servidor:** mantém a autenticação administrativa existente e valida as gravações antes de acessar banco/Storage. Não é necessário migrar o login para Supabase Auth para executar este plano.
- **Configuração estruturada:** entidades relacionais para conteúdo repetível; configurações tipadas para home, páginas, navegação e identidade. Evitar um campo JSON irrestrito que permita gravar configurações inválidas ou HTML/CSS executável.
- **Migração gradual:** adicionar estruturas, importar, verificar, trocar leitores/escritores e só depois retirar estruturas antigas. Preservar dados e URLs durante a transição.

Para arquivos já públicos do site, o staging usa um bucket de leitura pública e escrita somente pelo servidor autorizado; criação e configuração foram verificadas em 08/11/2026. Produção ainda precisa de configuração própria. Um bucket público torna seus arquivos acessíveis pela URL; não serve para guardar mídia confidencial de rascunhos. Se houver esse requisito, usar bucket privado separado, com acesso autenticado e publicação por cópia para o bucket público. A documentação oficial descreve [visibilidade e limites dos buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) e [controle de acesso ao Storage](https://supabase.com/docs/guides/storage/security/access-control).

## Etapas e dependências

| Etapa | Entrega | Depende de | Condição de saída |
| --- | --- | --- | --- |
| E0 | Inventário automatizado e verificação do ambiente | — | Snapshot das fontes, manifesto, lacunas e banco de origem/destino identificados |
| E1 | Schema aditivo, mídia e infraestrutura de importação | E0 | Migrações ensaiadas, bucket configurado por script e importador com simulação |
| E2 | Importação integral em staging | E1 | Textos e arquivos reconciliados; repetir importação não duplica nem sobrescreve edição |
| E3 | Módulos novos: integrantes, espetáculos e prêmios | E2 | CRUD e páginas públicas usam as mesmas entidades |
| E4 | Home, contatos, navegação, identidade e projetos completos | E2 | Conteúdo/configurações existentes editáveis e consumidos publicamente |
| E5 | Aparência, textos, SEO, publicação e ordem | E3 e E4 | C01–C15 atendidos, URLs e sitemap coerentes |
| E6 | Ensaio de corte e migração de produção | E5 | Relatório sem divergências bloqueantes e versão nova validada |
| E7 | Encerramento e limpeza | E6 + período de observação | Fontes antigas retiradas somente após aceite e prazo de retenção |

O plano começou na `main`; por orientação posterior do responsável, a continuação das implementações ocorre na `dev`. Usar commits pequenos por entrega para permitir reversão e identificar a versão de cada importação. Branch de staging/ambiente de teste não é requisito de fluxo Git; um banco/bucket isolado para ensaio é.

## E0 — Inventário e origem dos dados

1. Gerar um manifesto a partir de um checkout identificado por commit, sem alterar o código durante a extração. Registrar commit, versão do importador, data e hash de cada fonte.
2. Confirmar qual versão está publicada. Se o deploy não corresponder ao checkout, extrair os arquivos da revisão publicada antes de importar; usar o HTML público apenas como verificação visual, pois não contém necessariamente todos os dados e imagens dos carrosséis.
3. Identificar o banco que efetivamente atende o site e o projeto Supabase de destino. O repositório declara PostgreSQL, mas isso não comprova o estado de produção. Não usar `prisma/dev.db` como origem presumida.
4. Se origem e destino já forem o mesmo Supabase, preservar Agenda, Noticia, Livro, Projeto e Sobre e executar apenas expansão/importação de conteúdo estático e extração dos blobs. Se forem bancos distintos, copiar automaticamente os cinco conjuntos, com IDs, datas e relações, e ajustar sequências dos IDs após a carga.
5. Gerar relatório de imagens existentes, bytes, MIME real, dimensões, hashes, referências, arquivos ausentes, referências externas e arquivos não utilizados. O número esperado vem desse relatório, nunca de uma estimativa fixa.
6. Conferir `_prisma_migrations` e schema real. A migração histórica `20251013173351_add_image_blobs` apaga e recria as colunas `imagem`: não reaplicar sobre dados vivos nem usar reset. Resolver divergências/baseline após comparar schema e histórico; em produção, aplicar somente migrações novas revisadas com `prisma migrate deploy`.

As conexões de runtime e migração devem ser escolhidas conforme a infraestrutura. Validar conexão direta ou pooler de sessão para operações administrativas, conforme [Prisma no Supabase](https://supabase.com/docs/guides/database/prisma) e [modos de conexão](https://supabase.com/docs/guides/database/connecting-to-postgres). O projeto usa Prisma 6; adaptar a configuração a essa versão, sem copiar configuração de Prisma 7 implicitamente.

### Mapeamento automático das fontes

| Fonte atual | Destino proposto | Regra de extração |
| --- | --- | --- |
| `src/data/integrantes.ts` + array de `coletivo/page.tsx` | Integrante | Fonte detalhada fornece perfil; lista fornece ordem. Conciliar por `id`, verificar nome/foto e interromper em divergência sem regra explícita. |
| `shows` e `espetaculosData`, em `src/data/espetaculos.ts` | Espetaculo, SecaoEspetaculo e fotos | Unir pelo slug atual do título; preservar lançamento/capa da lista e seções/galeria/cor dos detalhes. |
| `src/data/premios.ts` | Premio | Preservar título, evento, ano, descrição, imagem e ordem; registrar URL antiga. |
| `src/data/projetos.ts` | Galeria de projetos | Importar `projectImgs` com imagem, data, descrição e ordem; não criar marcos de trajetória duplicados com base nessas fotos. |
| `home/Main.tsx`, `home/Sobre.tsx` e `app/page.tsx` | Home e suas seções/slides/CTAs | Extrair arrays de imagens, parágrafo, títulos, links, arte e ordem de seções. |
| `home/Contato.tsx` e `contato/page.tsx` | CanalContato + configuração da página | Unificar canais iguais por tipo/URL normalizada; comparar valores duplicados e preservar divergências no relatório. |
| `Sidebar.tsx`, `Footer.tsx`, layouts, clientes públicos e `globals.css` | Menu, configurações, tema e textos tipados | Extrair valores literais e tokens visuais mapeados por chave estável; registrar origem de cada campo. |
| Metadados estáticos/derivados e URLs atuais | ConfiguracaoSEO e aliases | Preservar defaults e regras derivadas; guardar override somente quando necessário. |
| Banco: Agenda, Noticia, Livro, Projeto, Sobre | Mesmas entidades, com novos campos aditivos | Preservar registros existentes; usar origem/tabela/chave para rastreio, sem recriar registros no mesmo banco. |
| `Livro.imagem` e `Sobre.imagem` | Midia + Storage + vínculo na entidade | Ler bytes diretamente do banco; manter blob até validação e encerramento. |
| Imagens referenciadas em `public/` e favicon em `src/app/` | Midia + Storage | Resolver caminho local, verificar conteúdo e importar automaticamente. |

Implementar extratores TypeScript: importar módulos de dados puros e usar AST (API do TypeScript) para literais de TSX, sem executar componentes React e sem tentar extrair tudo com regex. Valores pequenos embutidos podem ser mapeados por adaptadores versionados; isso é programação da migração, não recadastro pelo administrador. Preservar quebras de linha, acentos e descrições sem reescrita automática. Não separar crédito/local de legendas livres por suposição: manter a legenda original e preencher campos específicos somente quando a extração for inequívoca.

## E1 — Modelo de dados e infraestrutura

### Estruturas propostas

| Estrutura | Campos/relações essenciais |
| --- | --- |
| Midia | ID, bucket, chave única, hash do arquivo, MIME, bytes, dimensões quando aplicáveis, nome original, origem e datas |
| Vínculo de mídia | Entidade/galeria, mídia, ordem, texto alternativo, legenda, crédito e data editorial; alt e legenda pertencem ao uso, pois o mesmo arquivo pode ter contextos diferentes |
| Integrante | ID, slug único estável, nome, foto, ficha técnica, biografia, ordem, publicação |
| Espetaculo + SecaoEspetaculo | ID, slug, título, lançamento, capa, tema; seções com título, texto e ordem; galeria vinculada |
| Premio | ID, slug, ano, evento, descrição, foto, ordem e publicação; unicidade compatível com URL por slug/ano |
| ConfiguracaoSite, Pagina, SecaoHome, ItemMenu e CanalContato | Chaves tipadas, textos, CTAs, tema, ordem, visibilidade e relações de mídia; versões/esquemas para validar JSON delimitado |
| Entidades atuais | Acrescentar publicação/ordem quando aplicável, campos SEO e referências de mídia sem remover os campos atuais |
| AliasURL | Caminho antigo único, destino, status de redirecionamento; impedir ciclos e destinos inválidos |
| ExecucaoImportacao e ItemImportacao | Execução, versão/commit, chave de origem, hash da fonte, hash/versão importada, destino, status, erro e timestamps |

Para Sobre, adotar ID próprio e ano como campo não único para permitir mais de um marco por ano. A nova referência de mídia usa o ID; manter o endpoint antigo por ano apontando para o registro legado explicitamente mapeado. Não escolher arbitrariamente um dos novos registros se houver múltiplos no ano. Ajustar formulário/API em conjunto.

Criar biblioteca compartilhada de configuração, carregamento de conteúdo público e upload. Configurar Next Image para o hostname/path exato do bucket e revisar metadados, favicon e imagens CSS que não passam pelo componente Image.

### Configuração operacional

- Variáveis propostas: `SUPABASE_URL`, chave privilegiada de Storage somente no servidor, `SUPABASE_STORAGE_BUCKET`, conexão Prisma de runtime/migração e, quando diferente, conexão de leitura da origem. Nunca usar prefixo `NEXT_PUBLIC_` para segredos.
- Um comando de provisionamento cria/verifica o bucket e seus limites. Prisma continua responsável pelo schema da aplicação; gerenciar bucket/objetos pela API de Storage, sem inserir arquivos diretamente nas tabelas internas do Storage.
- A sessão atual do admin não é uma sessão Supabase Auth. Por isso, gravações em Storage passam pelo backend autenticado, sem presumir que uma policy `authenticated` reconheça esse cookie.
- Limites para novos uploads preservam as validações existentes; o importador deve inventariar arquivos legados maiores ou de outros tipos e ter tratamento explícito, sem descartá-los silenciosamente.

## E2 — Importador de conteúdo e imagens

### Interface disponível

Inventário e simulação local estão disponíveis. A execução protegida de staging usa um comando separado; ela não aplica schema e exige um destino já preparado. Exemplo para quando projeto, topologia, manifesto e configuração local estiverem confirmados:

```sh
yarn conteudo:inventariar --ambiente local --ler-banco --usar-banco-atual
yarn conteudo:migrar --ambiente local --dry-run --manifesto .conteudo-migracao/inventario.json
yarn conteudo:migrar:staging --ambiente staging --aplicar --manifesto .conteudo-migracao/inventario.json --destino-ref <project-ref> --confirmar-destino <project-ref> --topologia bancos-separados --confirmar-topologia bancos-separados --confirmar-manifesto <sha256-do-manifesto>
```

O destino deve ser explícito e conferido pelo identificador do projeto, não apenas pelo nome “staging”. O exemplo de staging exige `.env.staging.local` ou `.env.staging` fora do Git e pode criar o bucket somente com a opção adicional `--criar-bucket`. Não aceita `--dry-run`: a CLI separada é de aplicação e só deve ser usada depois das confirmações. `verificar` não tem entrypoint separado; a própria execução compara cada objeto e registro. A retomada usa o mesmo manifesto, destino e versão do importador, que produzem um ID determinístico de execução. Veja os guardrails em [`docs/execucao/cli-staging-protegida-2026-11-08.md`](../execucao/cli-staging-protegida-2026-11-08.md) e os comandos locais em [`scripts/conteudo/README.md`](../../scripts/conteudo/README.md).

### Pipeline de importação

1. **Snapshot:** gerar exportação consistente do conteúdo do banco e manifesto do checkout. Registrar a relação entre ambos. Em staging, permitir leitura da origem sem escrita.
2. **Normalização:** montar documentos intermediários por domínio, IDs de origem estáveis e relações ainda não resolvidas. Validar slugs, campos obrigatórios, URLs, datas e referências. Fotos com data sem fuso são datas editoriais: preservar o dia informado, sem conversão implícita que desloque a data. Eventos preservam o instante/fuso existentes.
3. **Arquivos:** ler cada caminho usado pelo conteúdo em `public/`, o favicon e os blobs do banco. Deduplicar por SHA-256 dos bytes, mantendo vínculos separados para diferentes usos/legendas. Inventariar todo `public/`, mas importar como conteúdo ativo somente arquivos referenciados; arquivos sem uso entram em relatório para eventual arquivamento.
4. **Upload:** usar chave imutável, por exemplo `originais/<sha256>.<ext>`, com MIME detectado e extensão coerente. Preservar bytes originais na primeira carga. Para SVG/ICO, validar o formato e aplicar fluxo próprio: não encaminhar tudo ao atual conversor raster. SVG legado deve ser validado; uploads futuros exigem sanitização ou restrição a formatos raster. Derivadas otimizadas são opcionais, vinculadas ao original e com hashes próprios.
5. **Verificação física:** se o objeto já existir, verificar conteúdo/hash; não presumir igualdade apenas pelo nome. Após enviar, baixar e conferir bytes/hash. Retry limitado com espera progressiva, concorrência baixa e registro por objeto; falha mantém execução retomável.
6. **Persistência:** após confirmação do objeto, criar/conciliar Midia e referências em transações curtas por entidade, preservando a ordem original. PostgreSQL e Storage não participam da mesma transação: upload pendente/órfão deve ser rastreado e reconciliado, sem remover objetos compartilhados.
7. **Carga editorial:** importar textos/configurações, aplicar os mapeamentos, gerar aliases de URLs antigas e marcar o conteúdo atualmente visível como publicado. O importador não publica automaticamente futuros arquivos sem uso ou conteúdo novo encontrado fora do snapshot aprovado.
8. **Reconciliação:** comparar origem/destino e emitir relatório final. Somente execuções verificadas habilitam a troca dos leitores públicos.

### Reexecução sem duplicação ou perda de edições

- Chave única de origem: domínio + identificador legado; para fotos de galeria, chave por posição/identificador no snapshot versionado, nunca só a legenda. Também guardar o hash para detectar alterações de arquivo.
- Estados por item: pendente, enviado, vinculado, verificado, erro ou conflito. Reexecutar retoma o último estado seguro.
- Item já importado e sem mudança: ignorar. Fonte alterada e destino ainda igual à última versão importada: permitir atualização registrada. Destino alterado no painel após importação: sinalizar conflito e não sobrescrever automaticamente.
- Na primeira carga de entidades já existentes, não usar título como único critério de identidade. Conciliar pelo ID de origem; colisões de slug geram bloqueio e relatório.
- Repetir a mesma execução deve gerar **zero novas entidades e zero novos objetos**. Uma tentativa com falha entre upload e commit deve convergir ao mesmo resultado.
- Não transformar ausências em exclusões automáticas. Limpeza é uma etapa separada após validação.

Arquivos ausentes, corruptos ou referências externas não acessíveis bloqueiam o respectivo item. Se uma imagem existir somente no deploy, um coletor pode baixar automaticamente a URL pública previamente inventariada, verificando domínio e registrando origem/hash; usar isso apenas como recuperação. Se o original não estiver em nenhuma fonte, registrar a perda: não inventar imagem substituta. Confirmar diferenças entre revisão publicada e repositório antes do corte.

## E3–E5 — Implementação dos módulos e leitores

1. **Mídia e configurações comuns (C03, C09, C10, C15):** CRUD de mídia com seleção/reuso, prévia, remoção de vínculo e referências em uso; contatos únicos; navegação e identidade/rodapé consumidos na home e demais páginas.
2. **Integrantes (C05):** formulário de perfil, foto, ordem e publicação; substituir os dois arrays por consultas à mesma entidade; adaptar rota, metadados e geração de parâmetros.
3. **Espetáculos (C06):** formulário principal, editor de seções ordenadas e galeria; unificar lista/detalhe/sitemap; preservar slugs atuais.
4. **Prêmios (C07):** CRUD com foto, ano e evento; preservar caminhos existentes e aliases nas edições.
5. **Home e projetos (C01, C02, C04, C08):** editor das quatro seções existentes, slides, arte, texto, CTAs, contatos e destaque de agenda; editor de introdução/galeria de projetos; limites de anos derivados dos registros; atualizar história para múltiplos marcos.
6. **Transversais (C11–C14):** temas com opções validadas, textos de interface, SEO, rascunho/publicação, ordem e visibilidade por página/seção. Manter defaults em caso de configuração opcional ausente, sem esconder falhas de migração.
7. **Imagens antigas do banco:** mudar novos uploads para Storage e novos vínculos; adaptar Livro/Sobre. Durante compatibilidade, leitor prefere mídia nova verificada e recorre ao blob antigo. Endpoint legado `/api/image/...` continua respondendo imagem ou redirecionando para arquivo confirmado.
8. **Cache e rotas:** novos registros publicados devem aparecer sem rebuild manual. Invalidar conteúdo afetado após gravação, manter chaves imutáveis de mídia e testar o cache do Next/Image, CDN e metadados. Sitemap consulta conteúdo publicado, não arrays. Home, listas e detalhes respeitam a mesma regra de publicação.

Não depender de uma dupla escrita incompleta. Antes da carga final, a versão de transição precisa ler os dois formatos e escrever de modo compatível com a nova estrutura, ou manter as gravações pausadas até concluir o corte. Após uso de mídia nova, rollback deve apontar para essa versão compatível, não para uma versão que só entende blobs.

## E6 — Runbook de corte para produção

1. Concluir ensaio integral em staging com cópia controlada da origem; comparar páginas e imagens antes/depois. Não executar scripts de escrita contra produção durante o ensaio.
2. Registrar versão do código, schema, manifesto e destino. Fazer backup consistente do banco e cópia/manifesto dos arquivos originais; testar restauração em ambiente isolado. Backup do banco não substitui backup dos objetos do Storage.
3. Publicar versão de transição compatível com estruturas antigas/novas. Aplicar apenas migrações aditivas revisadas, sem reset ou remoção de blobs.
4. Provisionar bucket por script e executar pré-carga de arquivos imutáveis. Manter os leitores antigos ativos. Assegurar que nenhum novo conteúdo seja publicado por importação antes do corte.
5. Pausar gravações administrativas pelo tempo da carga final; o site público continua lendo. Fazer snapshot final e importar registros/arquivos novos desde o ensaio, validando o estado atual, em vez de reaplicar um dump antigo por cima de edições recentes.
6. Rodar verificador de produção: contagens, hashes, relações, conteúdo textual, URLs antigas, metadados e sitemap. Erros de referência/arquivo ou conflito bloqueiam o corte.
7. Habilitar leitores novos por configuração reversível, primeiro mídia/conteúdo verificados, depois módulos completos. Invalidar caches afetados e executar smoke test público/admin.
8. Liberar gravações no novo fluxo, verificar upload/edição/publicação e observar logs de imagem ausente, erro de banco, erro de Storage e rotas 404.
9. Guardar relatório por execução e registrar no backlog a evidência do ambiente/data. Sugerir retenção mínima de 30 dias para blobs, fontes e backups, ajustável antes do corte.

### Reversão

- Antes de liberar gravações novas: reativar leitores antigos e manter estruturas/objetos importados para investigação; não remover banco/bucket inteiro.
- Depois de liberar gravações novas: usar a versão de transição, que entende referências de Storage e dados legados. Preservar edições feitas após o corte; não restaurar backup antigo por cima delas indiscriminadamente.
- Se houver necessidade de desfazer itens de uma execução, considerar somente registros criados por ela, ainda não editados e sem referências posteriores. Objetos compartilhados não podem ser apagados com base apenas no ID da execução.
- Falhas entre Storage e banco são tratadas por reconciliação. A rotina de órfãos oferece primeiro relatório e só exclui após retenção e verificação de ausência de referências/execuções em andamento.

## E7 — Validação e encerramento

| Verificação | Evidência exigida |
| --- | --- |
| Integridade editorial | Todas as entidades de origem mapeadas; igualdade de textos/quebras de linha, datas e ordem; diferenças justificadas |
| Integridade de mídia | Todos os arquivos referenciados presentes e com hashes de origem/destino iguais; derivadas identificadas separadamente |
| Idempotência | Segunda execução sem novas linhas/objetos e teste de retomada após interrupção |
| Preservação de edição | Alteração feita no painel entre execuções gera conflito em vez de sobrescrita |
| URLs | Rotas antigas de integrantes/espetáculos/prêmios e imagens válidas; redirecionamentos antigos de JPG/SVG no `next.config.ts` preservados sem ciclos |
| Admin e publicação | CRUD, mídia, ordem, rascunho/publicado, remoção de imagem e visibilidade funcionando nos módulos |
| Público e SEO | Todas as rotas do catálogo conferidas em mobile/desktop; detalhes novos sem rebuild, canonical, imagem social e sitemap coerentes |
| Recuperação | Rollback ensaiado e restauração de backup testada; versão de transição disponível |

Cobrir com testes de importação: deduplicação por bytes, conflito de slug, datas editoriais, SVG/ICO, arquivo ausente, blob inválido, upload interrompido, falha de transação, repetição e edição posterior no admin. Cobrir os fluxos públicos/administrativos críticos com testes de integração/ponta a ponta. Executar lint, testes e build compatíveis com a entrega; build sozinho não comprova acesso ao Supabase.

Somente após observação e aceite: remover arrays e cópias de conteúdo do código, retirar arquivos públicos substituídos mantendo aliases necessários, remover fallback e por último eliminar blobs/colunas obsoletas em migração específica. Manter relatório do inventário, mapeamento de origem e histórico de execuções.

## Checklist executável

- [ ] E0: confirmar revisão publicada e bancos, gerar inventário/manifesto e conferir histórico Prisma.
- [x] E1: implementar schema aditivo, camada de mídia, provisionamento e CLI com simulação; concluída em staging em 08/11/2026.
- [x] E2: importar fontes estáticas e banco em staging; verificar arquivos, textos e repetição; concluída para o manifesto registrado em 08/11/2026.
- [x] E3: integrantes, espetáculos e prêmios integrados ao painel e leitores; smoke de CRUD/SEO/publicação aprovado em staging.
- [x] E4: entregar home, contatos, menu, identidade, projetos e história; smoke funcional aprovado e preview 858×900 conferido. Viewport mobile estreito não medido.
- [ ] E5: concluir aparência, textos, publicação, ordem, SEO, cache e C15 em todas as áreas (primeira entrega em andamento; ver relatório E5).
- [ ] E6: ensaiar backup/reversão, importar delta final e efetuar corte verificado.
- [ ] E7: registrar aceite de C01–C15, observar e remover estruturas antigas após retenção.

A operação depende apenas de acesso configurado ao projeto Supabase e às fontes reais. O trabalho de transferência, deduplicação, associação e conferência deve ser automatizado; decisões sobre conteúdo conflitante ou irrecuperável aparecem em relatório de exceções, sem exigir recadastrar todo o site.
