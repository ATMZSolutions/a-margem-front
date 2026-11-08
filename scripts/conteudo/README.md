# Inventário, snapshot e estrutura da migração

A CLI extrai conteúdo do checkout, pode consultar explicitamente o PostgreSQL de origem em modo somente leitura e gera um plano offline. A simulação projeta DTOs para os modelos Prisma e valida arquivos/blobs locais. O executor com persistência/retomada, o adaptador Storage e uma CLI separada protegida para staging estão integrados. Em 08/11, o schema foi aplicado e a carga integral em staging foi repetida com sucesso; consulte o [relatório de importação](../../docs/execucao/importacao-staging-conteudo-2026-11-08.md).

```sh
# Apenas arquivos locais; não lê .env nem conecta ao banco
 yarn conteudo:inventariar --ambiente local

# Snapshot usando ORIGEM_DATABASE_URL
 yarn conteudo:inventariar --ambiente local --ler-banco

# Alternativa explícita: usar DATABASE_URL como origem
 yarn conteudo:inventariar --ambiente local --ler-banco --usar-banco-atual

# Planejamento offline a partir do manifesto, incluindo o snapshot quando presente
 yarn conteudo:migrar --ambiente local --dry-run --manifesto .conteudo-migracao/inventario.json
```

O modo `--ler-banco` carrega `.env.local` e `.env` sem imprimir os valores; variáveis já definidas no processo têm precedência. `ORIGEM_DATABASE_URL` não tem fallback automático para o banco da aplicação: `--usar-banco-atual` é necessário para escolher `DATABASE_URL`. Recomenda-se uma credencial de leitura para a origem. `--ambiente local` identifica a execução do inventário, não a localização do banco consultado. A CLI de staging usa outro entrypoint e só carrega `.env.staging.local`/`.env.staging`.

Use `--saida <diretorio>` para escolher onde salvar os relatórios. O padrão `.conteudo-migracao/` está ignorado no Git. O JSON com snapshot contém os textos e os bytes das imagens em base64: é um arquivo de dados, não deve ser versionado ou compartilhado como log. A CLI cria o diretório com modo 0700 e o JSON com modo 0600, ajustando também JSON existente. Os relatórios Markdown contêm somente resumos. Nenhuma opção `--apply` ou `--resume` está disponível.

## Arquivos gerados

- `inventario.json`/`.md`: commit/estado da árvore, hashes das fontes, textos/literais e posições, entidades normalizadas, mídia local com hashes/dimensões, ausentes/duplicatas e, se solicitado, snapshot do banco e conferência do histórico.
- `simulacao.json`/`.md`: entidades e chaves de origem, arquivos deduplicados, projeção por modelo, hash dos DTOs e bloqueios antes de qualquer execução remota. Não inclui conteúdo completo, base64 ou bytes de imagem.

O commit sozinho não identifica arquivos alterados: hashes do manifesto identificam o conteúdo efetivamente extraído. A versão inicial não comprova qual revisão está publicada.

## Adaptadores

- AST TypeScript sem executar componentes ou callbacks: integrantes, espetáculos, prêmios e fotos de projetos conciliados entre suas fontes.
- Quatro contatos conciliados entre home/página por tipo, URL, rótulo e ordem; divergências geram conflito.
- Dez itens de menu; dez aliases, incluindo a expansão controlada da regra de JPG para WebP. Alteração não suportada nessa regra bloqueia a extração em vez de produzir aliases incorretos.
- Configurações por fonte com versão: SEO estático (resolvendo `siteUrl`/`new URL` sem executá-los), textos, imagens/alt, CTAs, estilos/classes, defaults, limites de listas, temporizações e composição da home. CSS legado é preservado como origem de tokens a converter em opções do painel.

Cada configuração possui `chave` e `campos` versionados para o futuro mapeamento em `ConfiguracaoSite.dados`. Não são APIs para CSS/HTML livre nem componentes React serializados. Campos dinâmicos continuam usando as regras da aplicação; literais e fonte/hash preservam a evidência. Rótulos de elementos usam posições ordenadas no extrator: mudanças no código exigem regenerar/reconciliar o manifesto, não aplicar um snapshot antigo indiscriminadamente.

Referências de mídia estáticas e `url(...)` em CSS são inventariadas. A preparação local valida tamanho/hash dos arquivos, assinatura e decodificação raster, formato e MIME dos blobs, base64, dimensões e regras de SVG. SVG com script, handlers, referências externas ou conteúdo ativo é bloqueado; raster embutido só é aceito com MIME e assinatura coerentes. Os bytes permanecem originais e não há upload. Essa checagem deve ser repetida pelo executor antes de Storage.

## Projeção local para os modelos

`yarn conteudo:migrar --dry-run --manifesto <arquivo>` reabre os arquivos inventariados e produz DTOs somente em memória para `Midia`, `UsoMidia`, configurações/páginas/seções, contatos, menu, aliases, integrantes, espetáculos/seções, prêmios, galerias/fotos e marcos históricos. Os IDs e chaves de origem são determinísticos; as relações de mídia usam hashes de conteúdo. As cinco tabelas legadas são mapeadas com as chaves primárias preservadas para futura cópia quando a origem e o destino forem bancos diferentes. Timestamps são mantidos como texto, sem parse pelo fuso local.

O relatório grava apenas contagens, hash da projeção e bloqueios. A fonte `globals.css` não vai para configuração editável: deve ser convertida depois em opções de tema validadas. Classes e estilos extraídos de componentes também precisam ser consumidos por renderizadores com lista de valores permitidos.

## Adaptador Storage e comando protegido de staging

`storage.mjs` encapsula a API REST de buckets e objetos. Só aceita upload depois de verificar ou criar explicitamente um bucket público, com limite e MIME configurados. O bucket só é criado com `allowCreate: true`; buckets existentes com outra visibilidade, limite insuficiente ou tipos divergentes são bloqueados e nunca ajustados automaticamente.

O upload verifica SHA/tamanho local, usa caminho por hash e `x-upsert: false`, e baixa o objeto após envio para comparar novamente os bytes. Objeto existente é reutilizado apenas se SHA/tamanho coincidirem. Não há método de exclusão. A chave privilegiada fica somente no servidor; não carregar esse módulo em componentes cliente. Chaves `sb_secret_` novas são enviadas em `apikey`, sem `Authorization: Bearer`; JWT `service_role` legado mantém os dois headers. O Supabase documenta os novos formatos e a migração em [API keys](https://supabase.com/docs/guides/getting-started/api-keys) e [migração para as novas chaves](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys). A API também recomenda evitar sobrescrita e usar caminhos novos; o guia de uploads sugere TUS para arquivos acima de 6 MiB ([upload](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [criação de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets)).

No snapshot atual, o maior arquivo tem 2.460.275 bytes. O adaptador interrompe uploads padrão acima de 6 MiB e exige transporte retomável, ainda não implementado. Os testes unitários usam fetch falso. Em 08/11, a execução real no staging criou o bucket e verificou todos os 70 objetos; tamanho e SHA-256 conferiram nos 19.030.280 bytes.

## Snapshot do banco

`banco.mjs` força `default_transaction_read_only=on` na conexão e abre `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`; aplica timeouts locais e termina sempre em `ROLLBACK`. Faz somente SELECTs das cinco tabelas legadas, das colunas de `information_schema` e, quando presente, de `_prisma_migrations`.

Datas são selecionadas como texto do PostgreSQL para preservar timestamps sem fuso sem interpretação pelo fuso da máquina. IDs e chaves legadas são preservados. Blobs bytea têm bytes/hash/base64 e vínculo por registro; colunas ausentes ou imagem de tipo incompatível interrompem a leitura. Erros do driver não são impressos com parâmetros/credenciais. A identidade da conexão é registrada por hash do host/porta/banco, sem usuário/senha.

A CLI compara nomes/checksums e estado das migrações com os arquivos locais. Histórico ausente/vazio, arquivo remoto ausente localmente, checksum divergente ou migração incompleta são registrados para reconciliação. O leitor verifica as colunas necessárias à extração; não é uma comparação integral de índices, constraints, defaults, triggers ou políticas. A ausência de erro de SELECT não autoriza aplicar migrações.

## Schema local e staging

`prisma/schema.prisma` e a migração `20261108020000_estrutura_conteudo_migracao` acrescentam mídia/usos, configurações, contatos/menu, integrantes, espetáculos/seções, prêmios, galerias/fotos, páginas/home, marcos históricos, aliases e execuções/itens da importação. Os cinco modelos atuais e seus blobs permanecem intactos. Marcos históricos novos usam ID próprio e referência opcional ao ano legado, permitindo múltiplos marcos sem trocar agora a PK de Sobre.

A migração foi gerada por comparação local de datamodels. Depois da confirmação do banco staging vazio, `prisma migrate deploy` aplicou `0_base_legada` e `20261108020000_estrutura_conteudo_migracao` nesse destino. O preflight pós-migração confirmou as 22 tabelas, grants/RLS/sequences e checksums. A origem e produção não receberam migrações. **Não executar `migrate deploy`, `migrate dev`, `db push` ou reset contra a origem.** As colunas JSON são estrutura inicial versionada; validação das edições do painel e integração desses DTOs aos leitores/admin serão implementadas com os módulos.

## Reconciliação e baseline

```sh
yarn conteudo:reconciliar --usar-banco-atual
```

Sem `--usar-banco-atual`, o comando exige `ORIGEM_DATABASE_URL`. A consulta usa o mesmo transporte readonly do snapshot e termina com `ROLLBACK`. Inspeciona somente catálogos: colunas/defaults, constraints/índices, sequências, RLS/policies, triggers, proprietários, grants, permissões padrão e histórico Prisma. Não executa `migrate resolve`, deploy, shadow database ou SQL de criação.

Artefatos em `.conteudo-migracao/reconciliacao/`: catálogo JSON, baseline SQL, datamodel legado, resultado JSON e resumo Markdown. O comando compara o SQL observado com `prisma/migrations/0_base_legada/migration.sql`; divergências ou estruturas não suportadas bloqueiam a geração válida e retornam código 1. Arquivos de saída antigos são substituídos por marcadores de bloqueio em caso de incompatibilidade, para evitar usar um baseline gerado anteriormente.

A cadeia ativa foi reorganizada para baseline + migração editorial. Os quatro scripts originais estão em `prisma/historico-arquivado/`, com hashes preservados. `prisma/baseline/schema-legado.prisma` permite comparar o estado observado com o schema principal. O baseline inclui RLS; grants/roles da plataforma são conferidos após a aplicação. A migração editorial também prevê RLS nas 17 tabelas novas. A reorganização local não tocou a origem; a aplicação posterior no staging está registrada acima.

Diferenças, limitações e procedimento em [reconciliação e baseline](../../docs/execucao/reconciliacao-baseline-2026-11-07.md). A cadeia SQL e a CLI foram ensaiadas em PostgreSQL 17.11 isolado e o baseline/migração editorial foram aplicados no staging vazio; produção continua sem alteração.

## Comando separado de staging

O orquestrador e os adaptadores PostgreSQL/Prisma e Storage estão ligados ao comando `yarn conteudo:migrar:staging`. Ele exige `--aplicar`, manifesto/projeto/topologia confirmados e `STAGING_IMPORT_ENABLED=true`; lê apenas `.env.staging.local`/`.env.staging`, não usa `DATABASE_URL`, e não aplica migrações. Em 08/11, a CLI concluiu a carga no staging e sua repetição resultou em 326 itens ignorados. `--criar-bucket` cria o bucket se estiver ausente e depois segue com a importação completa; use-o somente quando ambos os efeitos estiverem autorizados. As travas e resultados estão em [CLI protegida](../../docs/execucao/cli-staging-protegida-2026-11-08.md) e [importação](../../docs/execucao/importacao-staging-conteudo-2026-11-08.md); os ensaios locais em [orquestrador](../../docs/execucao/orquestrador-importacao-local-2026-11-08.md) e [adaptador Prisma](../../docs/execucao/adaptador-prisma-local-2026-11-08.md).

## Próximas etapas

1. Confirmar se o manifesto representa exatamente a revisão publicada; atualizar o snapshot se a revisão publicada divergir.
2. Integrar entidades e configurações aos formulários do painel e aos leitores públicos (E3–E5), validando os fluxos completos contra o staging preenchido.
3. Planejar E6 separadamente: backup e restauração ensaiados, delta final e corte reversível em produção. O comando de staging não aplica schema.

Os resultados da projeção e do ensaio com o manifesto local estão em [validação dos DTOs e mídias](../../docs/execucao/projecao-dtos-midias-2026-11-07.md). O staging agora contém schema, conteúdo e objetos verificados para este manifesto. A origem e produção não foram alteradas.

Testes: `yarn test:run scripts/conteudo/`. Inventário, adaptadores, snapshot e planejamento integram o gate de cobertura do projeto. Os testes do banco usam cliente controlado; a consulta real realizada é registrada no relatório de execução, sem credenciais ou conteúdo sensível.
