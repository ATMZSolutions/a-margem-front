import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import sharp from 'sharp';
import { adaptarConfiguracoes } from './adaptadores.mjs';

export const hash = (valor) => createHash('sha256').update(valor).digest('hex');

async function listar(raiz, diretorio) {
  const entradas = await readdir(path.join(raiz, diretorio), { withFileTypes: true });
  const listas = await Promise.all(entradas.sort((a, b) => a.name.localeCompare(b.name)).map(async (entrada) => {
    const relativo = path.posix.join(diretorio, entrada.name);
    if (entrada.isSymbolicLink()) throw new Error(`Link simbólico não permitido: ${relativo}`);
    return entrada.isDirectory() ? listar(raiz, relativo) : [relativo];
  }));
  return listas.flat();
}

// Avalia somente literais. Nunca executa módulos, chamadas ou componentes do site.
export function lerLiteral(no) {
  if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) return no.text;
  if (ts.isNumericLiteral(no)) return Number(no.text);
  if (no.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (no.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (no.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isParenthesizedExpression(no) || ts.isAsExpression(no) || ts.isSatisfiesExpression(no)) return lerLiteral(no.expression);
  if (ts.isArrayLiteralExpression(no)) return no.elements.map(lerLiteral);
  if (ts.isObjectLiteralExpression(no)) return Object.fromEntries(no.properties.map((propriedade) => {
    if (!ts.isPropertyAssignment(propriedade) || !('text' in propriedade.name)) throw new Error('Propriedade não literal');
    return [propriedade.name.text, lerLiteral(propriedade.initializer)];
  }));
  throw new Error(`Expressão não literal: ${ts.SyntaxKind[no.kind]}`);
}

export function extrairFonte(caminho, codigo) {
  const arvore = ts.createSourceFile(caminho, codigo, ts.ScriptTarget.Latest, true, caminho.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const variaveis = [];
  const textos = [];
  const adicionar = (no, valor, tipo) => textos.push({ tipo, valor, inicio: no.getStart(arvore), fim: no.end, linha: arvore.getLineAndCharacterOfPosition(no.getStart(arvore)).line + 1 });
  function visitar(no) {
    if (ts.isVariableDeclaration(no) && ts.isIdentifier(no.name) && no.initializer) {
      try { variaveis.push({ nome: no.name.text, valor: lerLiteral(no.initializer) }); } catch { /* Expressões dinâmicas são preservadas na fonte, não avaliadas. */ }
    }
    if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) adicionar(no, no.text, 'literal');
    if (ts.isJsxText(no) && no.text.trim()) adicionar(no, no.text, 'jsx');
    ts.forEachChild(no, visitar);
  }
  visitar(arvore);
  return { caminho, sha256: hash(codigo), variaveis, textos };
}

function slug(valor) {
  return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

export function normalizar(fontes) {
  const obter = (arquivo, nome) => {
    const valor = fontes.find((fonte) => fonte.caminho === arquivo)?.variaveis.find((item) => item.nome === nome)?.valor;
    if (!Array.isArray(valor)) throw new Error(`Fonte obrigatória ausente/não literal: ${arquivo}:${nome}`);
    return valor;
  };
  const conflitos = [];
  const perfis = obter('src/data/integrantes.ts', 'integrantes');
  const lista = obter('src/app/coletivo/page.tsx', 'integrantes');
  const integrantes = lista.map((item, ordem) => {
    const encontrados = perfis.filter((perfil) => perfil.id === item.id);
    if (encontrados.length !== 1 || encontrados[0].nome !== item.nome || encontrados[0].image !== item.image) conflitos.push(`Integrante divergente: ${item.id}`);
    return { chaveOrigem: `integrante:${item.id}`, ordem, ...encontrados[0] };
  });
  if (perfis.length !== lista.length) conflitos.push('Quantidade divergente de integrantes');
  const detalhes = obter('src/data/espetaculos.ts', 'shows');
  const espetaculos = obter('src/data/espetaculos.ts', 'espetaculosData').map((item, ordem) => {
    const encontrados = detalhes.filter((detalhe) => slug(detalhe.title) === slug(item.title));
    if (encontrados.length !== 1) conflitos.push(`Espetáculo divergente: ${item.title}`);
    return { chaveOrigem: `espetaculo:${slug(item.title)}`, slug: slug(item.title), ordem, ...encontrados[0], ...item };
  });
  if (espetaculos.length !== detalhes.length) conflitos.push('Quantidade divergente de espetáculos');
  const premios = obter('src/data/premios.ts', 'premios').map((item, ordem) => ({ ...item, ordem, chaveOrigem: `premio:${slug(item.title)}:${item.year}` }));
  const fotosProjetos = obter('src/data/projetos.ts', 'projectImgs').map((item, ordem) => ({ ...item, ordem, chaveOrigem: `galeria-projetos:${ordem}` }));
  for (const [nome, itens] of Object.entries({ integrantes, espetaculos, premios, fotosProjetos })) {
    if (new Set(itens.map((item) => item.chaveOrigem)).size !== itens.length) conflitos.push(`Chaves duplicadas: ${nome}`);
  }
  return { integrantes, espetaculos, premios, fotosProjetos, conflitos };
}

export async function inventariar(raiz) {
  const caminhos = (await listar(raiz, 'src')).filter((arquivo) => /\.(tsx?|css)$/.test(arquivo) && !/\.test\./.test(arquivo) && !arquivo.includes('/admin/') && !arquivo.includes('/api/'));
  caminhos.push('next.config.ts');
  const arquivosFonte = await Promise.all(caminhos.map(async (caminho) => ({ caminho, codigo: await readFile(path.join(raiz, caminho), 'utf8') })));
  const fontes = arquivosFonte.map(({ caminho, codigo }) => extrairFonte(caminho, codigo));
  const adaptados = adaptarConfiguracoes(arquivosFonte);
  const referencias = new Map();
  for (const fonte of fontes) {
    for (const texto of fonte.textos) {
      // Captura caminhos de mídia, inclusive url('/...') e strings com JSX.
      for (const correspondencia of texto.valor.matchAll(/\/[\w/.-]+\.(?:webp|png|jpe?g|svg|ico|gif|avif)\b/gi)) {
        const caminho = correspondencia[0];
        const usos = referencias.get(caminho) ?? [];
        usos.push({ fonte: fonte.caminho, linha: texto.linha });
        referencias.set(caminho, usos);
      }
    }
  }
  // CSS é inventariado como fonte integral: não é AST TypeScript.
  for (const arquivo of caminhos.filter((item) => item.endsWith('.css'))) {
    const codigo = await readFile(path.join(raiz, arquivo), 'utf8');
    for (const correspondencia of codigo.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g)) referencias.set(correspondencia[1], [...(referencias.get(correspondencia[1]) ?? []), { fonte: arquivo, linha: codigo.slice(0, correspondencia.index).split('\n').length }]);
  }
  const arquivos = await listar(raiz, 'public');
  arquivos.push('src/app/favicon.ico');
  const midias = [];
  for (const arquivo of arquivos) {
    const bytes = await readFile(path.join(raiz, arquivo));
    const url = arquivo.startsWith('public/') ? `/${arquivo.slice(7)}` : '/favicon.ico';
    let metadados;
    let erro;
    try { metadados = await sharp(bytes).metadata(); } catch { if (path.extname(arquivo) !== '.ico') erro = 'Formato não decodificado pelo sharp'; }
    midias.push({ arquivo, url, sha256: hash(bytes), bytes: bytes.length, formato: metadados?.format ?? (arquivo.endsWith('.ico') && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0 ? 'ico' : null), largura: metadados?.width, altura: metadados?.height, referencias: referencias.get(url) ?? [], ...(erro ? { erro } : {}) });
  }
  const presentes = new Set(midias.map((midia) => midia.url));
  // URLs antigas em redirects não são arquivos ausentes; são aliases a preservar.
  const aliases = [...referencias].filter(([url, usos]) => !presentes.has(url) && usos.every((uso) => uso.fonte === 'next.config.ts')).map(([url]) => url);
  const ausentes = [...referencias].filter(([url]) => !presentes.has(url) && !aliases.includes(url)).map(([url, usos]) => ({ url, usos }));
  const basico = normalizar(fontes);
  const conteudo = { ...basico, ...adaptados, conflitos: [...basico.conflitos, ...adaptados.conflitos] };
  const grupos = new Map();
  for (const midia of midias) grupos.set(midia.sha256, [...(grupos.get(midia.sha256) ?? []), midia.url]);
  const identificacao = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: raiz, encoding: 'utf8' }).trim(), arvoreAlterada: Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: raiz, encoding: 'utf8' }).trim()) };
  const dados = { versao: 1, ...identificacao, fontes, conteudo, midias, ausentes, aliases, duplicadas: [...grupos].filter(([, urls]) => urls.length > 1).map(([sha256, urls]) => ({ sha256, urls })), banco: { estado: 'nao-consultado', pendencias: ['Confirmar revisão publicada', 'Identificar origem e destino', 'Conferir schema e histórico Prisma', 'Exportar registros e blobs em snapshot consistente'] } };
  return { ...dados, sha256: hash(JSON.stringify(dados)) };
}
