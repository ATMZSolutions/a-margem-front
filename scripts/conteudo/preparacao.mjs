import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { verificarManifesto } from './migracao.mjs';
import { hashRegistroLegado } from './hashes.mjs';

const hash = (valor) => createHash('sha256').update(valor).digest('hex');
const idEstavel = (tipo, chave) => `${tipo}_${hash(`${tipo}:${chave}`)}`;
const EXTENSOES = { jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', avif: 'avif', svg: 'svg', ico: 'ico' };
const MIMES = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/vnd.microsoft.icon' };
const MIME_EQUIVALENTES = { 'image/jpg': 'image/jpeg', 'image/pjpeg': 'image/jpeg', 'image/x-icon': 'image/vnd.microsoft.icon', 'image/ico': 'image/vnd.microsoft.icon', 'image/vnd.microsoft.icon': 'image/vnd.microsoft.icon' };

function detectarFormato(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return 'gif';
  if (bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp') {
    const marcas = [bytes.toString('ascii', 8, 12), ...Array.from({ length: Math.floor((bytes.length - 16) / 4) }, (_, indice) => bytes.toString('ascii', 16 + indice * 4, 20 + indice * 4))];
    if (marcas.some((marca) => ['avif', 'avis'].includes(marca))) return 'avif';
  }
  if (bytes.length >= 22 && bytes.readUInt16LE(0) === 0 && bytes.readUInt16LE(2) === 1) {
    const quantidade = bytes.readUInt16LE(4);
    if (quantidade > 0 && 6 + quantidade * 16 <= bytes.length) {
      for (let indice = 0; indice < quantidade; indice++) {
        const entrada = 6 + indice * 16;
        const tamanho = bytes.readUInt32LE(entrada + 8);
        const offset = bytes.readUInt32LE(entrada + 12);
        if (tamanho === 0 || offset < 6 + quantidade * 16 || offset + tamanho > bytes.length) return null;
      }
      return 'ico';
    }
  }
  const svg = validarSvg(bytes);
  return svg ? 'svg' : null;
}

function validarSvg(bytes) {
  let texto;
  try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, ''); } catch { return false; }
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(texto)) return false;
  if (/<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|iframe|object|embed)\b|\bon[a-z]{2,}\s*=|javascript\s*:|@import|expression\s*\(/i.test(texto)) return false;
  for (const match of texto.matchAll(/\b(?:xlink:)?(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const destino = (match[1] ?? match[2] ?? '').trim();
    if (destino && !referenciaSvgSegura(destino)) return false;
  }
  for (const match of texto.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)) {
    const destino = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (destino && !referenciaSvgSegura(destino)) return false;
  }
  return true;
}

function referenciaSvgSegura(destino) {
  if (destino.startsWith('#')) return true;
  const dataUri = /^data:image\/(jpeg|png|webp|gif|avif);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(destino);
  if (!dataUri) return false;
  const bytes = Buffer.from(dataUri[2], 'base64');
  return bytes.length > 0 && bytes.toString('base64') === dataUri[2] && detectarFormato(bytes) === dataUri[1].toLowerCase();
}

function mimeDeclarado(mime) {
  const normalizado = String(mime ?? '').split(';', 1)[0].trim().toLowerCase();
  return MIME_EQUIVALENTES[normalizado] ?? normalizado;
}

async function validarImagem(bytes, esperado, mimeOriginal) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new Error('Arquivo vazio ou inválido');
  const formato = detectarFormato(bytes);
  if (!formato || formato !== esperado) throw new Error('Conteúdo não corresponde ao formato inventariado');
  if (mimeOriginal && mimeDeclarado(mimeOriginal) !== MIMES[formato]) throw new Error('MIME declarado diverge do conteúdo detectado');
  let largura;
  let altura;
  if (formato === 'ico') {
    const primeiro = 6;
    largura = bytes[primeiro] || 256;
    altura = bytes[primeiro + 1] || 256;
  } else {
    const imagem = sharp(bytes, { failOn: 'error', limitInputPixels: 100_000_000, animated: true });
    const metadados = await imagem.metadata();
    const formatoSharp = metadados.format === 'jpg' ? 'jpeg' : metadados.format;
    if (formatoSharp !== formato) throw new Error('Decodificador diverge do formato detectado');
    if (!metadados.width || !metadados.height) throw new Error('Dimensões não reconhecidas');
    if (formato !== 'svg') await imagem.stats();
    largura = metadados.width;
    altura = metadados.height;
  }
  return { formato, mime: MIMES[formato], largura, altura };
}

async function caminhoLocalSeguro(raiz, arquivo) {
  if (typeof arquivo !== 'string' || path.isAbsolute(arquivo)) throw new Error('Caminho local de mídia inválido');
  const raizReal = await realpath(raiz);
  const caminho = path.resolve(raizReal, arquivo);
  const real = await realpath(caminho);
  const relativo = path.relative(raizReal, real);
  if (!relativo || relativo.startsWith(`..${path.sep}`) || relativo === '..' || path.isAbsolute(relativo) || real !== caminho) throw new Error('Caminho de mídia fora da raiz ou alterado');
  const estado = await lstat(real);
  if (!estado.isFile() || estado.isSymbolicLink()) throw new Error('Mídia local não é arquivo regular');
  return real;
}

function lerBlobBase64(midia) {
  if (typeof midia.base64 !== 'string' || midia.base64.length === 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(midia.base64)) throw new Error('Blob não contém base64 canônico');
  const bytes = Buffer.from(midia.base64, 'base64');
  if (bytes.toString('base64') !== midia.base64) throw new Error('Blob base64 não é canônico');
  if (bytes.length !== midia.bytes || hash(bytes) !== midia.sha256) throw new Error('Tamanho ou SHA-256 do blob diverge do snapshot');
  return bytes;
}

async function validarMidias(manifesto, raiz, bucket) {
  if (typeof bucket !== 'string' || !/^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Nome de bucket inválido');
  const locais = manifesto.midias.filter((item) => item.referencias.length || item.url === '/favicon.ico');
  const fontes = [];
  for (const item of locais) {
    const arquivo = await caminhoLocalSeguro(raiz, item.arquivo);
    const bytes = await readFile(arquivo);
    if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) throw new Error(`Arquivo mudou desde o inventário: ${item.url}`);
    fontes.push({ chave: item.url, nomeOriginal: path.basename(item.arquivo), bytes, esperado: item.formato, sha256: item.sha256, mimeOriginal: null, larguraInventario: item.largura, alturaInventario: item.altura });
  }
  for (const item of manifesto.banco?.midias ?? []) {
    const bytes = lerBlobBase64(item);
    const mime = mimeDeclarado(item.mimeDeclarado);
    const declarado = Object.entries(MIMES).find(([, valor]) => valor === mime)?.[0];
    if (!declarado) throw new Error(`MIME de blob não suportado: ${item.chaveOrigem}`);
    const formato = detectarFormato(bytes);
    if (!formato) throw new Error(`Conteúdo de blob não reconhecido: ${item.chaveOrigem}`);
    if (formato !== declarado) throw new Error(`MIME declarado diverge do conteúdo detectado: ${item.chaveOrigem}`);
    fontes.push({ chave: item.chaveOrigem, nomeOriginal: `${item.tabela}-${item.registro}.${EXTENSOES[formato]}`, bytes, esperado: formato, sha256: item.sha256, mimeOriginal: item.mimeDeclarado, larguraInventario: null, alturaInventario: null });
  }

  const porHash = new Map();
  const porOrigem = new Map();
  for (const fonte of fontes) {
    let validacao;
    try { validacao = await validarImagem(fonte.bytes, fonte.esperado, fonte.mimeOriginal); } catch (erro) {
      throw new Error(`Mídia inválida (${fonte.chave}): ${erro.message}`);
    }
    if (fonte.larguraInventario != null && (fonte.larguraInventario !== validacao.largura || fonte.alturaInventario !== validacao.altura)) throw new Error(`Dimensões mudaram desde o inventário: ${fonte.chave}`);
    let midia = porHash.get(fonte.sha256);
    if (midia && (midia.mime !== validacao.mime || midia.bytes !== fonte.bytes.length)) throw new Error(`Hash compartilhado com metadados divergentes: ${fonte.sha256}`);
    if (!midia) {
      midia = {
        id: idEstavel('midia', fonte.sha256),
        bucket,
        chave: `originais/${fonte.sha256}.${EXTENSOES[validacao.formato]}`,
        sha256: fonte.sha256,
        mime: validacao.mime,
        bytes: fonte.bytes.length,
        largura: validacao.largura,
        altura: validacao.altura,
        nomeOriginal: fonte.nomeOriginal,
        origem: fonte.chave,
        payload: fonte.bytes,
      };
      porHash.set(fonte.sha256, midia);
    }
    if (!midia.origens) midia.origens = [];
    midia.origens.push(fonte.chave);
    porOrigem.set(fonte.chave, midia);
  }
  return { midias: [...porHash.values()], porOrigem };
}

function caminhoDeImagem(url, midias) {
  if (typeof url !== 'string' || !url.startsWith('/')) throw new Error('Referência de mídia local inválida');
  const midia = midias.porOrigem.get(url);
  if (!midia) throw new Error(`Referência de mídia não inventariada: ${url}`);
  return midia;
}

function validarUnicidade(registros, seletor, descricao) {
  const vistos = new Set();
  for (const registro of registros) {
    const chave = seletor(registro);
    if (vistos.has(chave)) throw new Error(`Chave duplicada no mapeamento: ${descricao}`);
    vistos.add(chave);
  }
}

function mapearDocumentos(manifesto, midias) {
  const documentos = {
    midias: midias.midias.map((item) => { const registro = { ...item }; delete registro.payload; delete registro.origens; return registro; }),
    usosMidia: [], configuracoes: [], canaisContato: [], itensMenu: [], aliases: [],
    integrantes: [], espetaculos: [], secoesEspetaculo: [], premios: [], galerias: [], fotosGaleria: [],
    paginasSite: [], secoesHome: [], marcosHistoricos: [],
  };
  const uso = ({ chaveOrigem, midia, dominio, registro, campo, ordem = 0, legenda = null, dataEditorial = null }) => documentos.usosMidia.push({ id: idEstavel('uso', chaveOrigem), chaveOrigem, midiaId: midia.id, dominio, registro: String(registro), campo, ordem, textoAlternativo: '', legenda, credito: null, dataEditorial });

  for (const config of manifesto.conteudo.configuracoes) {
    if (config.chave.endsWith('.css')) continue;
    documentos.configuracoes.push({ chave: config.chave, versao: config.versao, dados: { campos: config.campos } });
  }
  for (const canal of manifesto.conteudo.contatos) documentos.canaisContato.push({ id: idEstavel('contato', canal.chaveOrigem), chaveOrigem: canal.chaveOrigem, tipo: canal.tipo, rotulo: canal.rotulo, url: canal.url, ordem: canal.ordem, ativo: canal.ativo });
  for (const item of manifesto.conteudo.menus) documentos.itensMenu.push({ id: idEstavel('menu', item.chaveOrigem), chaveOrigem: item.chaveOrigem, rotulo: item.rotulo, destino: item.destino, ordem: item.ordem, ativo: item.ativo });
  for (const alias of manifesto.conteudo.aliasesConfigurados) documentos.aliases.push({ origem: alias.origem, destino: alias.destino, permanente: alias.permanente });

  const configsPorCaminho = new Map(manifesto.conteudo.configuracoes.map((config) => [config.chave, config]));
  const arquivosPagina = manifesto.fontes.map((fonte) => fonte.caminho).filter((arquivo) => /^src\/app\/(?:.*\/)?page\.tsx$/.test(arquivo));
  for (const arquivo of arquivosPagina) {
    const diretorio = path.posix.dirname(arquivo);
    const relativo = diretorio === 'src/app' ? '' : diretorio.slice('src/app/'.length);
    const caminho = relativo ? `/${relativo}` : '/';
    const configs = manifesto.conteudo.configuracoes
      .filter((config) => path.posix.dirname(config.chave) === diretorio && !config.chave.endsWith('.css'))
      .sort((a, b) => a.chave.localeCompare(b.chave));
    const seo = configs.find((config) => config.chave === arquivo)?.campos.find((campo) => campo.chave === 'seo')?.valor ?? null;
    documentos.paginasSite.push({
      id: idEstavel('pagina', caminho),
      caminho,
      versao: 1,
      configuracao: { fontes: configs.map(({ chave, versao, campos }) => ({ chave, versao, campos })) },
      estado: 'PUBLICADO',
      seo,
    });
  }

  const ordemHome = configsPorCaminho.get('src/app/page.tsx')?.campos.find((campo) => campo.chave === 'ordem-secoes')?.valor;
  const fontesSecaoHome = { Main: 'src/components/home/Main.tsx', AgendaHome: 'src/components/home/Agenda.tsx', Sobre: 'src/components/home/Sobre.tsx', Contato: 'src/components/home/Contato.tsx' };
  if (manifesto.fontes.some((fonte) => fonte.caminho === 'src/app/page.tsx')) {
    if (!Array.isArray(ordemHome)) throw new Error('Composição da home ausente ou não literal');
    for (const [ordem, tipo] of ordemHome.entries()) {
      const fonte = fontesSecaoHome[tipo];
      const config = fonte ? configsPorCaminho.get(fonte) : null;
      if (!config) throw new Error(`Configuração da seção da home ausente: ${tipo}`);
      const chave = `home:${tipo.toLowerCase()}`;
      documentos.secoesHome.push({ id: idEstavel('secao-home', chave), chave, tipo, ordem, ativa: true, versao: config.versao, configuracao: { fonte: config.chave, campos: config.campos } });
    }
  }

  const sobre = manifesto.banco?.registros?.Sobre ?? [];
  for (const [ordem, registro] of sobre.entries()) documentos.marcosHistoricos.push({
    id: idEstavel('marco', registro.chaveOrigem),
    chaveOrigem: registro.chaveOrigem,
    ano: registro.ano,
    descricao: registro.descricao,
    anoLegado: registro.ano,
    ordem,
    estado: 'PUBLICADO',
  });

  for (const integrante of manifesto.conteudo.integrantes) {
    const midia = caminhoDeImagem(integrante.image, midias);
    const id = idEstavel('integrante', integrante.chaveOrigem);
    documentos.integrantes.push({ id, chaveOrigem: integrante.chaveOrigem, slug: integrante.id, nome: integrante.nome, fichaTecnica: integrante.fichaTecnica, biografia: integrante.biografia, fotoId: midia.id, ordem: integrante.ordem, estado: 'PUBLICADO', seo: null });
    uso({ chaveOrigem: `${integrante.chaveOrigem}:foto`, midia, dominio: 'Integrante', registro: integrante.id, campo: 'foto', ordem: integrante.ordem });
  }

  for (const espetaculo of manifesto.conteudo.espetaculos) {
    const id = idEstavel('espetaculo', espetaculo.chaveOrigem);
    const capa = caminhoDeImagem(espetaculo.img, midias);
    documentos.espetaculos.push({ id, chaveOrigem: espetaculo.chaveOrigem, slug: espetaculo.slug, titulo: espetaculo.title, lancamento: espetaculo.release, estreia: espetaculo.opening || null, localEstreia: espetaculo.local || null, corFundo: espetaculo.bgColor || null, capaId: capa.id, ordem: espetaculo.ordem, estado: 'PUBLICADO', seo: null });
    uso({ chaveOrigem: `${espetaculo.chaveOrigem}:capa`, midia: capa, dominio: 'Espetaculo', registro: espetaculo.slug, campo: 'capa', ordem: espetaculo.ordem });
    for (const [ordem, secao] of espetaculo.sections.entries()) documentos.secoesEspetaculo.push({ id: idEstavel('secao', `${espetaculo.chaveOrigem}:${ordem}`), espetaculoId: id, titulo: secao.subtitle, texto: secao.description, ordem });
    if (espetaculo.imgs.length) {
      const chaveGaleria = `galeria:${espetaculo.chaveOrigem}`;
      const galeriaId = idEstavel('galeria', chaveGaleria);
      documentos.galerias.push({ id: galeriaId, chaveOrigem: chaveGaleria, titulo: espetaculo.title, espetaculoId: id });
      for (const [ordem, foto] of espetaculo.imgs.entries()) {
        const midia = caminhoDeImagem(foto.img, midias);
        const chaveOrigem = `${chaveGaleria}:foto:${ordem}`;
        documentos.fotosGaleria.push({ id: idEstavel('foto', chaveOrigem), chaveOrigem, galeriaId, midiaId: midia.id, ordem, textoAlternativo: '', legenda: foto.descricao ?? '', credito: null, dataEditorial: foto.data || null });
      }
    }
  }

  for (const premio of manifesto.conteudo.premios) {
    const slug = premio.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    const midia = caminhoDeImagem(premio.img, midias);
    documentos.premios.push({ id: idEstavel('premio', premio.chaveOrigem), chaveOrigem: premio.chaveOrigem, slug, titulo: premio.title, ano: premio.year, evento: premio.evento, descricao: premio.description, fotoId: midia.id, ordem: premio.ordem, estado: 'PUBLICADO', seo: null });
    uso({ chaveOrigem: `${premio.chaveOrigem}:foto`, midia, dominio: 'Premio', registro: `${slug}/${premio.year}`, campo: 'foto', ordem: premio.ordem });
  }

  if (manifesto.conteudo.fotosProjetos.length) {
    const chaveGaleria = 'galeria:projetos';
    const galeriaId = idEstavel('galeria', chaveGaleria);
    documentos.galerias.push({ id: galeriaId, chaveOrigem: chaveGaleria, titulo: null, espetaculoId: null });
    for (const foto of manifesto.conteudo.fotosProjetos) {
      const midia = caminhoDeImagem(foto.img, midias);
      const chaveOrigem = foto.chaveOrigem;
      documentos.fotosGaleria.push({ id: idEstavel('foto', chaveOrigem), chaveOrigem, galeriaId, midiaId: midia.id, ordem: foto.ordem, textoAlternativo: '', legenda: foto.descricao ?? '', credito: null, dataEditorial: foto.data || null });
    }
  }

  for (const midiaFonte of manifesto.banco?.midias ?? []) {
    const midia = midias.porOrigem.get(midiaFonte.chaveOrigem);
    if (!midia) throw new Error(`Blob sem objeto de destino: ${midiaFonte.chaveOrigem}`);
    if (midiaFonte.tabela === 'Sobre') {
      const marco = documentos.marcosHistoricos.find((item) => item.anoLegado === midiaFonte.registro);
      if (!marco) throw new Error(`Blob Sobre sem marco histórico mapeado: ${midiaFonte.chaveOrigem}`);
      uso({ chaveOrigem: `${midiaFonte.chaveOrigem}:legado`, midia, dominio: 'Sobre', registro: midiaFonte.registro, campo: 'imagem' });
      uso({ chaveOrigem: midiaFonte.chaveOrigem, midia, dominio: 'MarcoHistorico', registro: marco.id, campo: 'imagem' });
    } else uso({ chaveOrigem: midiaFonte.chaveOrigem, midia, dominio: midiaFonte.tabela, registro: midiaFonte.registro, campo: 'imagem' });
  }

  validarUnicidade(documentos.integrantes, (item) => item.slug, 'slug de integrante');
  validarUnicidade(documentos.espetaculos, (item) => item.slug, 'slug de espetáculo');
  validarUnicidade(documentos.premios, (item) => `${item.slug}:${item.ano}`, 'slug/ano de prêmio');
  validarUnicidade(documentos.canaisContato, (item) => item.chaveOrigem, 'origem de contato');
  validarUnicidade(documentos.itensMenu, (item) => item.chaveOrigem, 'origem de menu');
  validarUnicidade(documentos.configuracoes, (item) => item.chave, 'chave de configuração');
  validarUnicidade(documentos.paginasSite, (item) => item.caminho, 'caminho de página');
  validarUnicidade(documentos.secoesHome, (item) => item.chave, 'chave de seção da home');
  validarUnicidade(documentos.marcosHistoricos, (item) => item.chaveOrigem, 'origem de marco histórico');
  validarUnicidade(documentos.marcosHistoricos, (item) => item.anoLegado, 'ano legado de marco histórico');
  validarUnicidade(documentos.aliases, (item) => item.origem, 'origem de alias');
  validarUnicidade(documentos.secoesEspetaculo, (item) => `${item.espetaculoId}:${item.ordem}`, 'seção/ordem de espetáculo');
  validarUnicidade(documentos.galerias, (item) => item.chaveOrigem, 'origem de galeria');
  validarUnicidade(documentos.fotosGaleria, (item) => item.chaveOrigem, 'origem de foto');
  validarUnicidade(documentos.fotosGaleria, (item) => `${item.galeriaId}:${item.ordem}`, 'galeria/ordem de foto');
  validarUnicidade(documentos.usosMidia, (item) => item.chaveOrigem, 'origem de uso de mídia');
  for (const documento of documentos.configuracoes) {
    const serializado = JSON.stringify(documento.dados);
    if (serializado === undefined) throw new Error(`Configuração não serializável: ${documento.chave}`);
  }
  return documentos;
}

function mapearRegistrosLegados(manifesto, midias) {
  const registros = [];
  for (const [tabela, linhas] of Object.entries(manifesto.banco?.registros ?? {})) {
    for (const linha of linhas) {
      const { chaveOrigem, imagemSha256, ...dados } = linha;
      const chavePrimaria = tabela === 'Sobre' ? linha.ano : linha.id;
      if (tabela === 'Livro' || tabela === 'Sobre') {
        const midia = imagemSha256 ? midias.porOrigem.get(`${chaveOrigem}:imagem`) : null;
        if (imagemSha256 && (!midia || midia.sha256 !== imagemSha256)) throw new Error(`Imagem legada sem bytes verificados: ${chaveOrigem}`);
        dados.imagem = midia?.payload ?? null;
      }
      registros.push({
        tabela,
        chaveOrigem,
        chavePrimaria,
        hashFonte: hashRegistroLegado(tabela, chaveOrigem, dados),
        hashSnapshot: hash(JSON.stringify(linha)),
        imagemSha256: imagemSha256 ?? null,
        dados,
      });
    }
  }
  return registros;
}

export async function prepararImportacao(manifesto, raiz, { bucket = 'site-publico' } = {}) {
  verificarManifesto(manifesto);
  const midias = await validarMidias(manifesto, raiz, bucket);
  const documentos = mapearDocumentos(manifesto, midias);
  const registrosLegados = mapearRegistrosLegados(manifesto, midias);
  const payloads = midias.midias.map(({ payload, origens, ...dados }) => ({ ...dados, origens, payload }));
  const hashDocumentos = hash(JSON.stringify({
    documentos,
    registrosLegados: registrosLegados.map(({ tabela, chaveOrigem, chavePrimaria, hashFonte, hashSnapshot }) => ({ tabela, chaveOrigem, chavePrimaria, hashFonte, hashSnapshot })),
  }));
  return {
    documentos,
    registrosLegados,
    payloads,
    resumo: {
      bucket,
      midiasUnicas: payloads.length,
      bytesDeMidia: payloads.reduce((total, item) => total + item.bytes, 0),
      modelos: Object.fromEntries(Object.entries(documentos).map(([modelo, registros]) => [modelo, registros.length])),
      configuracoesCssLegadoExcluidas: manifesto.conteudo.configuracoes.filter((config) => config.chave.endsWith('.css')).length,
      registrosLegadosPreservados: Object.fromEntries(Object.entries(manifesto.banco?.registros ?? {}).map(([tabela, registros]) => [tabela, registros.length])),
      hashDocumentos,
      gravacoesRemotas: 0,
    },
  };
}
