# Plano de UX/UI do painel administrativo

**Status:** implementado
**Branch:** `feature/reestrutura-painel-admin-ux-ui`
**Modo de uso:** Operar — a interface deve ajudar a administradora a concluir tarefas de publicação com clareza e consistência.

## Brief de design

- **Pessoa e contexto:** uma pessoa administradora entra no painel para criar, atualizar e publicar conteúdo do Coletivo À Margem. A tarefa principal é preparar o conteúdo e torná-lo público sem se perder entre áreas diferentes.
- **Resultado esperado:** localizar o tipo de conteúdo, preencher os campos necessários, enviar imagens quando aplicável e confirmar que a publicação foi concluída. O sucesso é percebido por feedback claro e pelo item aparecer na lista da área correspondente.
- **Direção:** evoluir a interface existente como uma área de trabalho de publicação, aplicando a identidade do site com o logotipo oficial, roxo `#412551` na estrutura, laranja `#F38901` nas ações, amarelo `#FECA55` nos destaques e vinho `#681A01` em detalhes. Usar tipografia sans-serif de leitura simples nas telas administrativas, com hierarquia baseada em tamanho e peso; evitar efeitos decorativos que concorram com o conteúdo. Priorizar padrões de interação conhecidos. No desktop, usar navegação persistente por área e uma região de trabalho focada; em telas estreitas, recolher a navegação em um seletor compacto. Não alterar o conteúdo público.
- **Escopo e limites:** reorganizar login, navegação, criação/edição e listagem das cinco áreas existentes: Agenda, Notícias, Livros, Projetos e Sobre. Preservar campos, dados, APIs, autenticação, upload, busca, paginação, edição, exclusão e o efeito atual de gravação imediata. Não criar rascunhos, agendamento, pré-visualização, novos papéis de acesso ou novos dados.
- **Estados e interações:** cobrir carregamento, primeiro acesso sem conteúdo, busca sem resultados, formulário inválido, envio de imagem, salvamento, falha de rede/API, sucesso, confirmação de exclusão, sessão expirada, foco e navegação por teclado. Em todas as áreas, manter os mesmos padrões de formulário, botões, avisos e ações.
- **Restrições:** manter as rotas e o modelo Next.js atual sempre que possível, adaptar a interface a desktop e celular, usar linguagem em português e atender contraste, foco visível, rótulos associados e alvos de toque adequados. A implementação deve verificar o efeito do layout global, que hoje também renderiza a navegação e o rodapé públicos em `/admin` e `/admin/login`.

## Diagnóstico do estado atual

- `/admin` renderiza cinco componentes de gestão em uma única coluna longa; cada área mistura formulário de criação, filtro, paginação, lista e edição.
- Os formulários de criação já cobrem Agenda, Notícias, Livros, Projetos e Sobre. Livros e Sobre também enviam imagens.
- Cada área mantém estados próprios e alguns padrões divergem, como tamanho da página, mensagens, botões, carregamento e confirmação de exclusão.
- Os formulários e as listas usam principalmente placeholders e estilos locais; isso dificulta comparar campos e ações entre tipos de conteúdo.
- O layout raiz inclui a barra de navegação e o rodapé do site público também nas rotas do painel e do login.
- O fluxo atual não tem estado de rascunho: criar ou atualizar grava o conteúdo diretamente. O planejamento preserva esse comportamento.

## Estrutura proposta

### 1. Entrada e sessão

- Apresentar uma tela de login focada, sem navegação pública concorrente.
- Associar rótulos aos campos, manter a ação de mostrar/ocultar senha acessível e dar feedback de envio, credenciais inválidas e falha de rede.
- Após autenticação, levar a pessoa diretamente à área de publicação; manter a ação de sair visível e identificável.

### 2. Navegação do painel

- Criar um cabeçalho administrativo com marca, título contextual e ação de sair.
- Exibir as cinco áreas como navegação persistente no desktop; no celular, usar navegação compacta que não ocupe a tela de conteúdo.
- Entrar em uma área sem perder a orientação: título, ação principal para criar conteúdo e acesso à lista já existente.
- Isolar o painel do menu e do rodapé públicos sem alterar as URLs das páginas ou endpoints.

### 3. Área de conteúdo

- Separar visualmente a criação/edição da consulta da lista, abrindo o formulário quando a pessoa escolhe criar ou editar.
- Manter as listas escaneáveis, com busca, paginação e ações de editar/excluir próximas ao item correspondente.
- Exibir estados vazios que orientem a primeira publicação e ofereçam a ação de criar naquele tipo de conteúdo.
- Usar o mesmo padrão de campos, hierarquia, validação, botões e mensagens em todas as áreas, preservando os campos específicos abaixo:

| Área | Dados atuais que devem ser preservados | Fluxo especial |
| --- | --- | --- |
| Agenda | Título, data, horário, local e cidade | Data e horário devem continuar explícitos na criação e edição |
| Notícias | Título, conteúdo e link | Texto longo deve ser confortável para escrever e revisar |
| Livros | Título, autor, descrição e imagem | Envio e indicação visual da imagem |
| Projetos | Data e descrição | Data deve continuar editável |
| Sobre | Ano, descrição e imagem | Envio e indicação visual da imagem |

## Sequência de implementação

1. **Estrutura administrativa:** separar visualmente as rotas administrativas dos elementos públicos do layout; definir cabeçalho, navegação responsiva, tipografia e cores para estados.
2. **Padrões de formulário e feedback:** definir rótulos, ajuda, validação, estados de envio, sucesso e erro; aplicar também à tela de login.
3. **Publicação por área:** migrar primeiro uma área representativa com texto e campos simples (Notícias), depois Agenda e Projetos, e por fim Livros e Sobre com upload de imagem.
4. **Listagem e manutenção:** uniformizar busca, paginação, edição, confirmação de exclusão, estado vazio e retorno à lista após salvar.
5. **Revisão responsiva e acessível:** verificar os fluxos completos em celular e desktop, teclado, foco, contraste, mensagens e overflow.

## Critérios de aceite

- A administradora consegue chegar a qualquer uma das cinco áreas e iniciar uma criação sem percorrer a página inteira.
- Criar e atualizar mantêm o comportamento atual de gravação direta; o conteúdo continua sendo publicado no mesmo momento do salvamento.
- Todos os campos, upload de imagem, busca, paginação, edição e exclusão continuam disponíveis.
- Login e painel deixam de exibir navegação/rodapé públicos como elementos concorrentes, sem mudar as rotas públicas ou administrativas.
- Todas as áreas mostram carregamento, vazio, sucesso e erro de maneira consistente; ações destrutivas continuam pedindo confirmação.
- Os fluxos podem ser concluídos por teclado, com foco visível, controles rotulados e layout utilizável em telas estreitas.
- Nenhuma alteração de banco, esquema de dados, API, autenticação ou permissões é necessária para entregar a reorganização.

## Premissas confirmadas

- “Publicar” significa gravar diretamente e tornar o conteúdo disponível no site, como ocorre hoje; não haverá etapa de rascunho ou aprovação.
- O objetivo é uma interface operacional mais organizada; a direção visual mantém sinais da marca, sem transformar o painel em uma extensão promocional do site público.

## Registro da execução

- O painel agora oferece navegação por categoria, cabeçalho próprio e formulários de criação que aparecem sob demanda; edição e exclusão permanecem disponíveis nas listas.
- Login, carregamento, busca sem resultados e listas vazias têm feedback acessível; menu e rodapé públicos não aparecem nas rotas administrativas.
- Campos, rotas, endpoints, autenticação, upload e gravação direta foram preservados.
- A marca foi aplicada ao cabeçalho e login com o logotipo oficial, paleta roxa e laranja e fontes de exibição apenas nos títulos; paginação, formulários e uploads também usam cores coerentes com a paleta.
- O painel amplia o espaço de trabalho até 1920 px e escala a navegação para viewports de 1280 e 1440 px; em 1920 px, mantém a hierarquia sem ampliar ainda mais os controles.
- O login segue a referência visual compartilhada, com composição proporcional e redução de largura, espaçamento e altura dos controles em 1920 px.
- O painel segue a referência da tela de Notícias com barra superior, navegação lateral roxa, título por área com ícone e listagens com separadores; o login usa fundo sólido e menos ornamentos.
- As listas administrativas permanecem em cache no cliente ao trocar de seção; cache é atualizado depois de criar, editar ou excluir e limpo ao sair ou entrar novamente.
- Os campos de imagem de Livros e Sobre exibem prévias proporcionais, orientações de formato e estado do envio; na edição, é possível manter a imagem atual ou substituí-la. As miniaturas das listas ficaram maiores e clicáveis, abrem uma visualização ampliada e mostram carregamento até a imagem aparecer; capas mantêm proporção em Livros e reduzem em telas 1920 px.
- Verificações deste ajuste: `yarn tsc --noEmit`, ESLint nos componentes de imagem alterados e `git diff --check` passaram.
- Testes automatizados do admin: 18 arquivos e 112 testes passaram; cobertura da fatia configurada ficou em 92,25% de instruções, 90,78% de branches, 96,33% de funções e 95,78% de linhas, com limite de 80% aplicado no comando `yarn test:coverage` e no gate da CI. A cobertura global do restante do site continua pendente no backlog.
- Verificações da reestruturação inicial: `yarn build`, `yarn tsc --noEmit`, `yarn lint` e `git diff --check`. O lint manteve apenas um aviso preexistente em `tailwind.config.ts`.
- Nesta revisão visual: `yarn tsc --noEmit` e `git diff --check` passaram; o build não foi repetido enquanto o servidor de desenvolvimento está em uso.
- A versão anterior do login foi inspecionada no navegador. A revisão atual aplica a referência enviada para o painel e simplifica a entrada administrativa.

## Referência de método

Planejamento guiado pelo comando `shape` e pelo modo Operate da skill [Impeccable](https://github.com/pbakaus/impeccable), adaptados ao código e ao escopo informados para este projeto.
