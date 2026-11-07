# Revisão complementar de segurança e erros

**Data:** 17/10/2026

**Escopo:** código e dependências no diretório de trabalho atual. O deploy da Vercel e o banco do Supabase não foram acessados; valores de `.env` não foram lidos.

## Resultado das verificações

- `yarn.cmd build`: concluiu. A compilação, a checagem de tipos e a geração das 31 rotas estáticas passaram. O build usou o `.env` local e não prova conectividade com o Supabase no deploy.
- `yarn.cmd lint`: 0 erros e 20 avisos, principalmente dependências de `useEffect` e código não utilizado no admin.
- `yarn.cmd npm audit --all`: nenhum advisory alto ou crítico. O único aviso foi moderado, por fim de suporte de `eslint@9.37.0` (dependência de desenvolvimento). [Política de suporte do ESLint](https://eslint.org/version-support/).
- Referências literais a imagens de `public/` verificadas: nenhum caminho inexistente encontrado. Isso não valida a renderização das imagens no navegador ou no deploy.

## Achados priorizados

### 1. Autorização administrativa concentrada no middleware — média

As rotas CRUD em `src/app/api/admin/{agenda,livros,noticias,projeto,sobre}/route.ts` executam consultas e gravações sem validar a sessão dentro do próprio handler. A autorização depende de `middleware.ts`. O middleware atual inclui essas rotas; não foi demonstrado um bypass. Uma mudança futura no matcher ou uma falha de execução do middleware deixaria os handlers sem uma segunda verificação.

**Correção:** criar um guard compartilhado que valide `a_token` nos handlers, antes de qualquer leitura ou escrita. Manter o middleware para redirecionamento e rejeição antecipada. O [guia oficial do Next.js](https://nextjs.org/docs/app/guides/authentication) recomenda verificar a autorização nos Route Handlers.

### 2. Proteção contra CSRF incompleta nas gravações do admin — média, condicional

`src/lib/adminInput.ts` aceita qualquer cabeçalho `Content-Type` que **contenha** `application/json`. Assim, `text/plain; charset=application/json` passa pela checagem, embora `text/plain` seja um tipo de requisição permitido sem preflight CORS. As rotas CRUD não verificam `Origin`; a rota de upload já faz essa checagem. Com uma sessão válida e controle de outra origem no mesmo site, uma requisição forjada pode chegar a um `POST` administrativo. `SameSite=Lax` não bloqueia requisições entre origens que pertençam ao mesmo site. Isso é um cenário condicional, não um ataque observado no deploy.

**Correção:** comparar exatamente o tipo MIME `application/json` antes dos parâmetros e verificar `Origin` nas operações de escrita. [Fetch Standard: cabeçalhos permitidos sem preflight](https://fetch.spec.whatwg.org/#cors-safelisted-request-header).

### 3. Limitação de login reinicia antes do bloqueio de uma hora — média

Em `src/app/api/admin/auth/route.ts`, `getRateLimit()` cria um registro novo após 15 minutos de janela, mesmo quando `blockedUntil` ainda está no futuro. Por isso, o bloqueio definido como uma hora após 15 tentativas pode terminar em aproximadamente 15 minutos. O `Map` também é local à instância da função; instâncias diferentes não compartilham contadores.

**Correção:** preservar registros enquanto `blockedUntil > now` e usar um limitador compartilhado ou a [limitação de requisições da Vercel](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) para proteção consistente no deploy.

### 4. Páginas públicas dependem da conexão com o banco em cada requisição — média para disponibilidade

`/agenda`, `/noticias`, `/projetos`, `/sobre` e `/indicacoes` consultam o Prisma durante a renderização no servidor. Se `DATABASE_URL` estiver ausente, incorreta ou o Supabase indisponível, a página inteira falha; isso também pode fazer imagens dessas páginas parecerem ausentes. O build bem-sucedido não exercita essas consultas dinâmicas. A captura da Vercel enviada na conversa marcava `DATABASE_URL` como “Needs Attention”; o significado exato do aviso e o estado atual da variável não foram verificados. O usuário informou que adicionou `JWT_SECRET`, mas seu valor e ambientes não foram inspecionados.

**Correção:** validar as variáveis no ambiente de produção, testar as páginas com o banco real e escolher a URL de conexão apropriada para o ambiente de execução. [Supabase: Prisma e modos de conexão](https://supabase.com/docs/guides/database/prisma).

### 5. Imagens do banco podem ficar desatualizadas após edição — baixa

`src/app/api/image/[type]/[id]/route.ts` responde com `Cache-Control: public, max-age=3600, s-maxage=3600`, mas a URL pública da imagem não muda quando seu conteúdo é editado. Navegadores ou caches podem mostrar a versão anterior por até uma hora. A interface do admin usa um parâmetro de tempo, mas as páginas públicas usam a URL estável.

**Correção:** versionar a URL quando a imagem mudar ou ajustar a estratégia de cache.

### 6. Instruções antigas do admin continuam versionadas — baixa

`ADMIN_README.md` ainda descreve credenciais padrão, Basic Auth e SQLite. O código atual exige `ADMIN_USER`, `ADMIN_PASS`, `JWT_SECRET` e PostgreSQL. O documento pode levar a uma configuração incorreta e mantém a antiga credencial visível no histórico. `ADMIN_CREDENTIALS.md` foi removido do diretório de trabalho, mas continua no histórico Git.

**Correção:** atualizar ou remover `ADMIN_README.md` e rotacionar qualquer credencial antiga que tenha sido usada.

### 7. Projetos podem abrir em um ano vazio — baixa

Em `src/app/projetos/ProjetosClient.tsx`, a redução que escolhe o ano inicial começa no ano corrente. Se não houver projetos nesse ano, a página abre com “Nenhum projeto encontrado”, apesar de haver projetos em anos anteriores.

**Correção:** iniciar a seleção pelo ano mais recente presente nos dados; usar o ano corrente somente quando a lista estiver vazia.

## Ordem sugerida

1. Revalidar `DATABASE_URL` e as páginas dinâmicas no deploy; o usuário informou que já adicionou `JWT_SECRET`.
2. Adicionar verificação de sessão dentro das APIs administrativas e fechar a checagem de `Content-Type`/`Origin`.
3. Corrigir o bloqueio temporal do login e configurar limitação compartilhada na hospedagem.
4. Atualizar `ADMIN_README.md`, o ano inicial de projetos e a política de cache das imagens.

Esta revisão é estática, complementada por build, lint e audit de dependências. Não houve teste de navegação, carga, banco remoto ou tentativa de exploração no ambiente publicado.
