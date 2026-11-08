# Reconciliação e retenção de mídia C15 — 08/11/2026

## Escopo

Registrar quando uma mídia sem referências passa a cumprir a retenção mínima, após conferir novamente as referências e o objeto de Storage. O fluxo não remove registros nem arquivos.

## Schema e aplicação

A migração aditiva `20261108040000_retencao_midia_sem_vinculo` acrescenta `Midia.semVinculoDesde` (`TIMESTAMPTZ`) e um índice para consulta. Foi aplicada somente ao projeto staging isolado com `yarn migrate:staging --ambiente staging --aplicar`. O wrapper valida referência do projeto, topologia separada, host PostgreSQL, SSL e URL Supabase; não usa `DATABASE_URL` como fallback. A verificação posterior com `yarn migrate:staging --ambiente staging --status` informou que todas as migrações estavam aplicadas.

## Rotina de reconciliação

O botão **Reconciliar referências e Storage** na Biblioteca de mídia chama `POST /api/admin/midias/reconciliar`, protegido pela autorização de escrita do painel. A rotina:

1. lê o inventário atual e as referências já mapeadas para relações editoriais, registros de uso e configurações JSON;
2. confere o bucket sem criá-lo ou alterar sua configuração;
3. baixa cada objeto candidato e compara bytes e SHA-256 com `Midia`;
4. em transação `Serializable`, inicia a data para objetos válidos sem referências relacionais, mantém a data já iniciada, ou limpa a data se a mídia voltou a ter vínculo ou se o objeto está ausente/divergente.

O adaptador não tem função de exclusão. Após o prazo mínimo de 30 dias, qualquer futura implementação de remoção ainda precisará consultar novamente referências e estado do objeto imediatamente antes da ação; esta etapa não autoriza remoção automática.

## Resultado observado no staging

Antes da execução, o catálogo tinha **70 mídias**, **68 com referências detectadas**, **79 referências** e **2 candidatas sem vínculo**. A execução retornou:

| Resultado | Quantidade |
| --- | ---: |
| Novas retenções iniciadas | 2 |
| Retenções mantidas | 0 |
| Datas corrigidas/limpas | 0 |
| Objetos conferidos com tamanho e hash válidos | 2 |
| Objetos ausentes | 0 |
| Objetos divergentes | 0 |
| Arquivos excluídos | 0 |

As duas mídias permanecem no catálogo e no Storage, agora com data de início de retenção. Não foi feita alteração em produção ou no banco de origem.

## Validações de implementação

- `yarn tsc --noEmit` — aprovado.
- `yarn prisma validate` — aprovado.
- `node --check scripts/migrar-schema-staging.mjs` e `node --check scripts/conteudo/storage.mjs` — aprovados.
- `prisma migrate status` no staging — cadeia atualizada, sem migrações pendentes.
- `git diff --check` — aprovado.

O histórico operacional não contém credenciais nem hashes completos dos objetos. Para reexecutar a conferência após uma mudança, use `yarn dev:staging`, entre na Biblioteca de mídia e acione o botão de reconciliação.
