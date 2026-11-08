# Preparação E6 — backup e restauração

Registro de **08/11/2026** na branch `dev`. Esta etapa prepara recuperação de conteúdo e identifica os itens necessários para um backup/restauração integral antes de qualquer corte em produção.

## Replay do snapshot de conteúdo

O manifesto local `.conteudo-migracao/inventario-e0-confirmado.json` foi criado em uma transação `REPEATABLE READ READ ONLY` na origem configurada. Ele corresponde ao commit informado para o deployment (`c05ce1b`) e contém os cinco conjuntos legados e seus blobs de imagem.

Para ensaiar a restauração, foi criado um banco efêmero PGlite/PostgreSQL 18.6, aplicado o baseline `0_base_legada` e reconstituídos os registros e blobs a partir do snapshot. Resultado:

| Tabela | Restaurados |
| --- | ---: |
| Agenda | 49 |
| Noticia | 15 |
| Livro | 2 |
| Projeto | 23 |
| Sobre | 4 |

Todos os campos não binários, incluindo timestamps textuais, coincidiram com o snapshot. Os seis blobs totalizaram **2.049.158 bytes** e seus tamanhos/SHA-256 coincidiram. O ensaio ocorreu somente em memória local; nenhuma gravação foi feita em Supabase.

Este replay demonstra que o snapshot lógico de conteúdo pode reconstituir as cinco tabelas e seus blobs. **Não é um backup físico/lógico integral do projeto Supabase**: não cobre schemas gerenciados, roles, configurações da plataforma nem objetos de buckets. Também não substitui um restore com PostgreSQL 17/Supabase compatível; o PGlite 18.6 foi usado somente para validar o payload do importador.

## Estado dos backups integrais

O ambiente atual não tem `pg_dump`, `pg_restore`, `psql`, Docker ou Supabase CLI. Ao abrir o Dashboard, a sessão redirecionou para a tela de login; não foi possível consultar backups gerenciados ou clonar o projeto. O staging já está preenchido e não deve ser usado como alvo para restaurar um backup por cima.

No Git, `main` continua em `c05ce1b`; `dev` está em `21c9ea5`, 24 commits à frente de `origin/dev`. Esta preparação não fez merge nem push. A promoção do código para `main` continua necessária antes do deploy/corte de produção.

O Supabase informa que backups de banco não incluem os bytes dos objetos da Storage API. Portanto, o ensaio restante precisa tratar banco e Storage separadamente: usar backup gerenciado ou dump lógico para PostgreSQL e exportar os objetos/metadata do bucket com um procedimento próprio. Ver [backups de banco](https://supabase.com/docs/guides/platform/backups), [backup/restore pela CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) e [download de objetos](https://supabase.com/docs/guides/storage/management/download-objects).

## Próximas ações de E6

1. Acessar o projeto Supabase de produção autenticado e verificar o backup diário/PITR disponível e a janela de recuperação; se preferível, produzir um dump lógico com ferramenta compatível com PostgreSQL 17.
2. Exportar os objetos e metadados de Storage separadamente, com SHA-256, bytes e chave original.
3. Restaurar banco e Storage em um projeto novo isolado ou ambiente compatível vazio. Não restaurar por cima do staging atual nem da produção.
4. Comparar catálogo/histórico, tabelas, contagens, conteúdo, sequências, hashes dos blobs e objetos de Storage. Registrar divergências e ajustar o runbook antes da carga final.
5. Só então promover `dev` para `main`, gerar o delta final, pausar gravações administrativas durante o corte e executar a implantação de produção com janela e plano de reversão aprovados.

Até esse ensaio, E6 permanece em preparação. O banco de origem e a produção não foram alterados.
