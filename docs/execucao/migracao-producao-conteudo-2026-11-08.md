# Baseline, schema e conteúdo em produção — 08/11/2026

Este relatório registra a primeira preparação de dados editoriais no projeto Supabase de produção. O snapshot foi lido do banco atual em modo somente leitura e a importação ocorreu no mesmo projeto; nenhum conteúdo legado existente foi sobrescrito.

## Identidade e pré-validação

- Projeto Supabase: `ekbgtafcgsjaeahuxojy`.
- Topologia confirmada: `mesmo-banco`.
- Checkout: `main`, commit `ef9e83f788a317dd45550672ce0d686500d46515`, árvore limpa.
- Manifesto privado de corte: `.conteudo-migracao/e6-corte-ef9e83f-2026-11-08/inventario.json` (ignorado pelo Git), SHA-256 `16c7efba92790917a5465adb864fa47051e307aab97cda7f0face7e4ba5a8e63`.
- O preflight confirmou a identidade do banco, cinco tabelas legadas, 25 colunas, ausência de histórico Prisma e igualdade exata entre o catálogo e `0_base_legada` (SHA-256 `0d592e6e82348f0ab001ce12df8305fb225da659f16369047c8e47ca7fcdb6c0`). Antes de registrar o baseline, não houve gravações.
- `yarn build` concluiu com sucesso. O dry-run local validou 61 objetos de mídia (17.498.114 bytes) e mapeou os dados legados sem conflitos.

## Baseline e migrações

O comando protegido registrou `0_base_legada` como aplicada, sem recriar as tabelas existentes. Em seguida, `migrate deploy` aplicou as três migrações aditivas versionadas:

1. `20261108020000_estrutura_conteudo_migracao`
2. `20261108030000_publicacao_ordem_seo_legado`
3. `20261108040000_retencao_midia_sem_vinculo`

A conferência posterior de `migrate status` retornou `Database schema is up to date!` para as quatro migrações locais.

## Importação e Storage

- Execução: `exec_9e501f5b1a29c9e938a3e26e44fc5d576affc9dd4707f144`.
- Estado final: `VERIFICADO`, 315 itens verificados.
- Resultado: 222 registros editoriais/configurações criados; 93 registros dos modelos legados reconhecidos como idênticos e ignorados; zero atualizações.
- Sequências legadas não foram alteradas, pois origem e destino são o mesmo banco.
- Bucket público `site-publico` criado e conferido com os limites e MIME types configurados localmente.
- Leitura final independente do Storage conferiu os 61 objetos e seus bytes/SHA-256: 17.498.114 bytes no total, zero divergências.

O importador guardou o estado por item e exige o mesmo manifesto/destino para retomada. O dump privado usado como proteção antes do corte está documentado em [preparação E6](preparacao-e6-backup-restauracao-2026-11-08.md); credenciais e bytes de mídia não fazem parte deste relatório.

## Publicação do código e ativação pública

O push da `main` não foi concluído neste host: `git push origin main` falhou porque o Git não conseguiu obter credenciais HTTPS (`could not read Username for 'https://github.com'`). A branch local permanece em `ef9e83f788a317dd45550672ce0d686500d46515`; o último `origin/main` observado permanece em `c05ce1b791569f4c577571f7cef236708b64f3aa`. O conector GitHub confirma permissão de escrita, mas não transporta os 35 commits locais com seus objetos e hashes. Nenhum deployment foi confirmado.

As travas locais de migração/importação foram fornecidas apenas no processo dos comandos e não foram habilitadas permanentemente. A configuração/runtime do site não foi alterada nem ativada. Depois de autenticar o Git neste host e publicar a `main`, ainda será necessário confirmar o deployment e configurar as variáveis de runtime do leitor editorial no provedor antes de ativar a leitura pública.
