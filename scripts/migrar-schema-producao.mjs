import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process, { loadEnvFile } from 'node:process';
import { readFile, readdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { conectarELerBanco, conferirHistorico } from './conteudo/banco.mjs';
import { lerCatalogoSomenteLeitura, prepararBaseline } from './conteudo/reconciliacao.mjs';
import { verificarManifesto } from './conteudo/migracao.mjs';
import { validarConfiguracaoMigracaoProducao } from './conteudo/producao.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function carregarEnvProducao() {
  try { loadEnvFile(path.join(raiz, '.env.producao.local')); } catch (erro) {
    if (erro.code === 'ENOENT') throw new Error('Crie .env.producao.local com a configuração local de produção');
    throw new Error('Falha ao carregar configuração local de produção');
  }
}

function caminhoManifestoSeguro(arquivo) {
  const caminho = path.resolve(raiz, arquivo);
  const relativo = path.relative(raiz, caminho);
  if (!relativo || relativo === '..' || relativo.startsWith(`..${path.sep}`) || path.isAbsolute(relativo)) throw new Error('O manifesto deve estar dentro do repositório');
  return caminho;
}

async function lerCatalogoProducao(databaseUrl, origemSha256) {
  const catalogo = await conectarELerBanco(databaseUrl, undefined, lerCatalogoSomenteLeitura);
  if (catalogo.identidadeOrigemSha256 !== origemSha256) throw new Error('O catálogo consultado não corresponde à identidade do manifesto');
  return catalogo;
}

async function conferirBaselineAtual(catalogo) {
  if (catalogo.historicoPresente) throw new Error('Histórico Prisma já existe; interrompa e reconcilie antes de registrar o baseline');
  const baseline = prepararBaseline(catalogo);
  if (baseline.problemas.length) throw new Error(`Baseline bloqueado: ${baseline.problemas.join('; ')}`);
  const versionado = await readFile(path.join(raiz, 'prisma/migrations/0_base_legada/migration.sql'), 'utf8');
  const normalizarFim = (sql) => sql.replace(/(?:\r?\n)+$/, '');
  if (normalizarFim(baseline.sql) !== normalizarFim(versionado)) throw new Error('Catálogo de produção diverge do baseline versionado');
  return baseline;
}

async function conferirHistoricoAtual(catalogo) {
  const diretorios = await readdir(path.join(raiz, 'prisma/migrations'), { withFileTypes: true });
  const locais = [];
  for (const diretorio of diretorios.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = await readFile(path.join(raiz, 'prisma/migrations', diretorio.name, 'migration.sql'), 'utf8');
    locais.push({ nome: diretorio.name, sha256: createHash('sha256').update(sql).digest('hex') });
  }
  const resultado = conferirHistorico(catalogo, locais);
  if (resultado.problemas.length) throw new Error(`Histórico Prisma bloqueado: ${resultado.problemas.join('; ')}`);
  const baseline = catalogo.migracoes.find((item) => item.migration_name === '0_base_legada');
  if (!baseline?.finished_at || baseline.rolled_back_at) throw new Error('Baseline 0_base_legada não está registrado como concluído');
}

function executarPrisma(operacao, databaseUrl) {
  const prismaCli = path.join(raiz, 'node_modules/prisma/build/index.js');
  const args = operacao === 'baseline'
    ? ['migrate', 'resolve', '--applied', '0_base_legada', '--schema', 'prisma/schema.prisma']
    : ['migrate', operacao === 'status' ? 'status' : 'deploy', '--schema', 'prisma/schema.prisma'];
  const comando = spawn(process.execPath, [prismaCli, ...args], {
    cwd: raiz,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) process.on(sinal, () => comando.kill(sinal));
  return new Promise((resolve, reject) => {
    comando.on('error', () => reject(new Error('Não foi possível iniciar a CLI Prisma')));
    comando.on('exit', (codigo, sinal) => {
      if (codigo === 0) resolve();
      else reject(new Error(sinal ? 'CLI Prisma interrompida' : `CLI Prisma encerrou com código ${codigo}`));
    });
  });
}

async function executar() {
  const { values, positionals } = parseArgs({
    options: {
      ambiente: { type: 'string' },
      operacao: { type: 'string' },
      manifesto: { type: 'string' },
      'destino-ref': { type: 'string' },
      'confirmar-destino': { type: 'string' },
      'confirmar-manifesto': { type: 'string' },
      'confirmar-commit': { type: 'string' },
      'confirmar-topologia': { type: 'string' },
      topologia: { type: 'string' },
      'confirmar-baseline': { type: 'string' },
      'confirmar-deploy': { type: 'string' },
      aplicar: { type: 'boolean' },
    },
  });
  if (positionals.length) throw new Error('Este comando não aceita argumentos posicionais');
  if (!values.manifesto) throw new Error('Informe --manifesto com o snapshot confirmado');
  await carregarEnvProducao();
  const manifesto = JSON.parse(await readFile(caminhoManifestoSeguro(values.manifesto), 'utf8'));
  verificarManifesto(manifesto);
  if (manifesto.banco?.estado !== 'snapshot-somente-leitura' || !manifesto.banco.identidadeOrigemSha256) throw new Error('O manifesto não contém snapshot somente leitura válido');
  const config = validarConfiguracaoMigracaoProducao(values, process.env, manifesto.banco.identidadeOrigemSha256, manifesto.sha256, manifesto.commit);

  if (config.operacao === 'check') {
    console.log(JSON.stringify({ ambiente: 'producao', destinoRef: config.destinoRef, topologia: config.topologia, manifestoSha256: manifesto.sha256, conectado: false, gravacoes: 0 }, null, 2));
    return;
  }
  if (config.operacao === 'preflight') {
    const catalogo = await lerCatalogoProducao(config.databaseUrl, manifesto.banco.identidadeOrigemSha256);
    const baseline = await conferirBaselineAtual(catalogo);
    console.log(JSON.stringify({
      ambiente: 'producao',
      destinoRef: config.destinoRef,
      manifestoSha256: manifesto.sha256,
      identidadeOrigemConfere: true,
      tabelasLegadas: catalogo.tabelas.filter((item) => ['Agenda', 'Livro', 'Noticia', 'Projeto', 'Sobre'].includes(item.tabela)).length,
      colunasLegadas: catalogo.colunas.filter((item) => ['Agenda', 'Livro', 'Noticia', 'Projeto', 'Sobre'].includes(item.tabela)).length,
      historicoPrismaPresente: catalogo.historicoPresente,
      hashBaseline: baseline.sha256,
      diferencaBaseline: false,
      gravacoes: 0,
    }, null, 2));
    return;
  }
  if (config.operacao === 'baseline') {
    const catalogo = await lerCatalogoProducao(config.databaseUrl, manifesto.banco.identidadeOrigemSha256);
    await conferirBaselineAtual(catalogo);
  } else if (config.operacao === 'deploy') {
    const catalogo = await lerCatalogoProducao(config.databaseUrl, manifesto.banco.identidadeOrigemSha256);
    await conferirHistoricoAtual(catalogo);
  }
  await executarPrisma(config.operacao, config.databaseUrl);
}

executar().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
