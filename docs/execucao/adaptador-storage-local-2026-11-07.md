# Adaptador Storage: implementação e validação em staging

Entrega em **07/11/2026**, na `main`, com execução remota complementar em 08/11. Prepara a camada de Storage para a importação automatizada. Os testes unitários usam `fetch` falso; depois, a CLI protegida criou o bucket isolado e importou os objetos, conferindo novamente tamanho e SHA-256.

## Comportamento implementado

- Confere buckets pela API Storage e exige visibilidade pública, tamanho suficiente e lista explícita de MIME permitidos.
- Criação só é aceita quando o chamador passa `allowCreate: true`. Bucket existente incompatível é bloqueado; o adaptador não altera nem exclui buckets.
- Valida hash/tamanho do payload, MIME, extensão e chave `originais/<sha256>.<ext>` antes de qualquer requisição de objeto.
- Faz GET antes do upload, envia com `x-upsert: false` e baixa novamente após o envio para comparar os bytes. Se o objeto já existir, só reutiliza quando o hash/tamanho forem idênticos. Uma colisão divergente vira erro.
- Usa caminhos imutáveis com cache longo, tentativas limitadas para falhas de rede/servidor e não registra a credencial em erros.
- Bloqueia arquivos acima de 6 MiB até existir suporte a TUS. No snapshot atual, o maior candidato tem **2.460.275 bytes**, então os 71 arquivos/blob candidatos ficam abaixo desse limiar; após deduplicação são 70 objetos.
- Não tem operação de exclusão. A atualização abaixo registra a integração protegida posterior ao executor e à CLI separada de staging.

O guia do Supabase documenta `upsert: false` como padrão para não sobrescrever objetos e recomenda evitar sobrescrita em caminhos existentes; o guia de bucket permite limitar MIME e tamanho ([upload padrão](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [criação de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets)). Para arquivos acima de 6 MiB, o Supabase recomenda TUS retomável; esse caminho continua pendente.

## Validação

`storage.test.mjs` passou **7 testes** usando respostas e objetos em memória: criação explícita, validação de configuração, upload sem sobrescrita, reuso idêntico, divergência de hash, resposta estruturada `NoSuchKey`, bloqueio de arquivo grande e headers das duas gerações de chave. Nenhuma credencial real foi carregada pelo teste.

## Atualização de 08/11/2026

O adaptador agora aceita a secret API key `sb_secret_` por `apikey` sem `Authorization: Bearer`; mantém compatibilidade com o JWT legado `service_role`, que usa ambos os headers. A documentação atual do Supabase descreve a substituição gradual das chaves antigas e alerta que secret keys novas não devem ser tratadas como JWT ([API keys](https://supabase.com/docs/guides/getting-started/api-keys), [migração para as novas chaves](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)).

O adaptador foi ligado ao comando protegido de staging com kill switch e confirmações explícitas. Na primeira tentativa de importação, a API respondeu HTTP 400 para um objeto inexistente com JSON `statusCode: 404`, `error: not_found` e `code: NoSuchKey`; a implementação anterior só reconhecia HTTP 404. O adaptador passou a aceitar essa combinação estruturada, mantendo outros HTTP 400 como erro. O teste correspondente foi aprovado.

Na execução de 08/11, a CLI criou e verificou o bucket; os 70 objetos somando 19.030.280 bytes foram conferidos por hash e tamanho. A segunda execução integral reutilizou todos eles. Ver [resultado da importação em staging](importacao-staging-conteudo-2026-11-08.md).
