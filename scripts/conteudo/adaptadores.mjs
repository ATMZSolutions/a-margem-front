import ts from 'typescript';
import { lerLiteral } from './inventario.mjs';

const TIPOS_CANAIS = { WhatsAppOutlined: 'whatsapp', Mail: 'email', Instagram: 'instagram', TikTokOutlined: 'tiktok' };
const limparTexto = (texto) => texto.replace(/\s+/g, ' ').trim();

export function adaptarConfiguracoes(arquivos) {
  const contatos = new Map();
  const configuracoes = [];
  const menus = [];
  const aliases = [];
  const conflitos = [];
  for (const { caminho, codigo } of arquivos) {
    const arvore = ts.createSourceFile(caminho, codigo, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const constantes = new Map();
    const nos = [];
    function coletar(no) { nos.push(no); ts.forEachChild(no, coletar); }
    coletar(arvore);
    for (const no of nos) if (ts.isVariableDeclaration(no) && ts.isIdentifier(no.name) && no.initializer) constantes.set(no.name.text, no.initializer);
    function valor(no, pilha = new Set()) {
      if (ts.isIdentifier(no) && constantes.has(no.text)) {
        if (pilha.has(no.text)) throw new Error('Referência circular');
        return valor(constantes.get(no.text), new Set([...pilha, no.text]));
      }
      if (ts.isObjectLiteralExpression(no)) return Object.fromEntries(no.properties.map((prop) => {
        if (!ts.isPropertyAssignment(prop) || !('text' in prop.name)) throw new Error('Objeto dinâmico');
        return [prop.name.text, valor(prop.initializer, pilha)];
      }));
      if (ts.isArrayLiteralExpression(no)) return no.elements.map((item) => valor(item, pilha));
      if (ts.isNewExpression(no) && no.expression.getText(arvore) === 'URL' && no.arguments?.length === 1) return valor(no.arguments[0], pilha);
      return lerLiteral(no);
    }
    function atributo(abertura, nome) {
      const prop = abertura.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.getText(arvore) === nome);
      if (!prop) return undefined;
      if (!prop.initializer) return true;
      return valor(ts.isJsxExpression(prop.initializer) ? prop.initializer.expression : prop.initializer);
    }
    const avaliar = (funcao) => { try { return funcao(); } catch { return undefined; } };
    const campos = [];
    for (const no of nos) {
      if (ts.isVariableDeclaration(no) && no.name.getText(arvore) === 'contacts') {
        if (!no.initializer || !ts.isArrayLiteralExpression(no.initializer)) throw new Error(`Contatos não literais: ${caminho}`);
        no.initializer.elements.forEach((item, ordem) => {
          if (!ts.isObjectLiteralExpression(item)) throw new Error('Contato inválido');
          const propriedades = Object.fromEntries(item.properties.map((prop) => {
            if (!ts.isPropertyAssignment(prop)) throw new Error('Contato dinâmico');
            return [prop.name.getText(arvore), prop.initializer];
          }));
          const icone = propriedades.icon;
          if (!icone || !ts.isJsxSelfClosingElement(icone)) throw new Error('Ícone de contato não suportado');
          const tipo = TIPOS_CANAIS[icone.tagName.getText(arvore)];
          if (!tipo) throw new Error('Tipo de contato desconhecido');
          const rotulo = valor(propriedades.text);
          const url = new URL(valor(propriedades.link));
          if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error('Protocolo de contato inválido');
          const normalizada = url.toString();
          const anterior = contatos.get(tipo);
          if (anterior && (anterior.url !== normalizada || anterior.rotulo !== rotulo || anterior.ordem !== ordem)) conflitos.push(`Contato divergente: ${tipo} em ${caminho}`);
          else if (anterior) anterior.fontes.push(caminho);
          else contatos.set(tipo, { chaveOrigem: `contato:${tipo}`, tipo, rotulo, url: normalizada, ordem, ativo: true, fontes: [caminho] });
        });
      }
      if (ts.isVariableDeclaration(no) && no.name.getText(arvore) === 'menuItems') {
        valor(no.initializer).forEach((item, ordem) => menus.push({ chaveOrigem: `menu:${item.href}`, rotulo: item.label, destino: item.href, ordem, ativo: true }));
      }
      if (ts.isVariableDeclaration(no) && no.name.getText(arvore) === 'metadata') campos.push({ chave: 'seo', valor: valor(no.initializer) });
      if (ts.isJsxElement(no)) {
        const tag = no.openingElement.tagName.getText(arvore);
        if (/^(h[1-6]|p|span|a|button|motion\.h[1-6]|motion\.button|Typography\.(Paragraph|Title))$/.test(tag) || (caminho.endsWith('/Footer.tsx') && tag === 'div')) {
          const apenasTexto = no.children.every((filho) => ts.isJsxText(filho) || (ts.isJsxExpression(filho) && (!filho.expression || ts.isStringLiteral(filho.expression))) || (ts.isJsxSelfClosingElement(filho) && filho.tagName.getText(arvore) === 'br'));
          if (apenasTexto) {
            const texto = limparTexto(no.children.map((filho) => ts.isJsxText(filho) ? filho.text : ts.isJsxExpression(filho) ? filho.expression?.text ?? '' : ' ').join(''));
            if (texto) campos.push({ chave: `texto:${campos.length}`, tag, valor: texto });
          }
        }
      }
      if (ts.isJsxOpeningElement(no) || ts.isJsxSelfClosingElement(no)) {
        const propriedades = {};
        for (const nome of ['src', 'alt', 'href', 'label', 'color', 'bgColor', 'bgImage', 'topButton', 'style', 'images']) {
          const resultado = avaliar(() => atributo(no, nome));
          if (resultado !== undefined) propriedades[nome] = resultado;
        }
        if (Object.keys(propriedades).length) campos.push({ chave: `elemento:${campos.length}`, tag: no.tagName.getText(arvore), valor: propriedades });
      }
      // Parametrizações literais (limites, cores, temporizações) conservam origem sem executar callbacks.
      if (ts.isBindingElement(no) && no.initializer) {
        const padrao = avaliar(() => valor(no.initializer));
        if (padrao !== undefined) campos.push({ chave: `padrao:${no.name.getText(arvore)}`, valor: padrao });
      }
      if (ts.isCallExpression(no) && no.expression.getText(arvore) === 'router.push') {
        const destino = avaliar(() => valor(no.arguments[0]));
        if (typeof destino === 'string') campos.push({ chave: `destino:${campos.length}`, valor: destino });
      }
      if (ts.isCallExpression(no) && ts.isPropertyAccessExpression(no.expression) && no.expression.name.text === 'slice') {
        const limites = avaliar(() => no.arguments.map((item) => valor(item)));
        if (limites) campos.push({ chave: `limites:${campos.length}`, valor: limites });
      }
      if (ts.isCallExpression(no) && ['setInterval', 'setTimeout'].includes(no.expression.getText(arvore))) {
        const tempo = avaliar(() => valor(no.arguments[1]));
        if (typeof tempo === 'number') campos.push({ chave: `tempo:${campos.length}`, tipo: no.expression.getText(arvore), valor: tempo });
      }
    }
    // Captura a composição da home sem tentar avaliar JSX.
    if (caminho === 'src/app/page.tsx') {
      const secoes = nos.filter((no) => ts.isPropertyAssignment(no) && no.name.getText(arvore) === 'component').map((no) => {
        if (!ts.isJsxSelfClosingElement(no.initializer)) throw new Error('Seção da home não suportada');
        return no.initializer.tagName.getText(arvore);
      });
      campos.push({ chave: 'ordem-secoes', valor: secoes });
    }
    const classes = [...new Set(nos.filter((no) => ts.isJsxAttribute(no) && no.name.getText(arvore) === 'className').map((no) => avaliar(() => valor(no.initializer))).filter((item) => typeof item === 'string'))];
    if (classes.length) campos.push({ chave: 'classes-apresentacao', valor: classes });
    if (caminho.endsWith('.css')) campos.push({ chave: 'css-legado', valor: codigo });
    if (campos.length) configuracoes.push({ chaveOrigem: `configuracao:${caminho}`, chave: caminho, versao: 1, campos });
    if (caminho === 'next.config.ts') {
      // Adaptador versionado para a regra Array.from atual: valida forma antes de expandir.
      const fontes = nos.filter((no) => ts.isPropertyAssignment(no) && no.name.getText(arvore) === 'source' && ts.isObjectLiteralExpression(no.parent) && no.parent.properties.some((prop) => ts.isPropertyAssignment(prop) && prop.name.getText(arvore) === 'destination'));
      const destinos = nos.filter((no) => ts.isPropertyAssignment(no) && no.name.getText(arvore) === 'destination');
      const origemDinamica = fontes.find((no) => ts.isTemplateExpression(no.initializer));
      const destinoDinamico = destinos.find((no) => ts.isTemplateExpression(no.initializer));
      if (origemDinamica || destinoDinamico) {
        const comprimento = nos.find((no) => ts.isPropertyAssignment(no) && no.name.getText(arvore) === 'length');
        if (origemDinamica?.initializer.getText(arvore) !== '`/home/img${index + 1}.jpg`' || destinoDinamico?.initializer.getText(arvore) !== '`/home/img${index + 1}.webp`' || !comprimento || valor(comprimento.initializer) !== 9) throw new Error('Regra dinâmica de redirects mudou; revisar adaptador');
        for (let indice = 1; indice <= 9; indice++) aliases.push({ chaveOrigem: `alias:/home/img${indice}.jpg`, origem: `/home/img${indice}.jpg`, destino: `/home/img${indice}.webp`, permanente: true });
      }
      for (const origem of fontes.filter((no) => ts.isStringLiteral(no.initializer))) {
        const objeto = valor(origem.parent);
        aliases.push({ chaveOrigem: `alias:${objeto.source}`, origem: objeto.source, destino: objeto.destination, permanente: objeto.permanent });
      }
    }
  }
  if (contatos.size !== 4 || [...contatos.values()].some((item) => item.fontes.length !== 2)) conflitos.push('Fontes obrigatórias dos quatro contatos incompletas');
  return { contatos: [...contatos.values()], configuracoes, menus, aliasesConfigurados: aliases, conflitos };
}
