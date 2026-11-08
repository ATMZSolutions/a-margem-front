import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { loadEnvFile } from 'node:process';
import { prepararImportacao } from './preparacao.mjs';
import { executarImportacao } from './executor.mjs';
import { criarRepositorioPrisma } from './repositorio-prisma.mjs';
import { criarAdaptadorStorage } from './storage.mjs';
import { verificarManifesto } from './migracao.mjs';
import { validarCoberturaDoBucket } from './staging.mjs';
import { validarConfiguracaoImportacaoProducao } from './producao.mjs';

async function carregarEnvProducao(raiz) {
  try { loadEnvFile(path.join(raiz, '.env.producao.local')); } catch (erro) {
    if (erro.code === 'ENOENT') throw new Error('Crie .env.producao.local com a configuração local de produção');
    throw new Error('Falha ao carregar configuração local de produção');
  }
}

function caminhoManifestoSeguro(raiz, arquivo) {
  const caminho = path.resolve(raiz, arquivo);
  const relativo = path.relative(raiz, caminho);
  if (!relativo || relativo === '..' || relativo.startsWith(`..${path.sep}`) || path.isAbsolute(relativo)) throw new Error('O manifesto deve estar dentro do repositório');
  return caminho;
}

async function executar() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      ambiente: { type: 'string' },
      manifesto: { type: 'string' },
      'destino-ref': { type: 'string' },
      'confirmar-destino': { type: 'string' },
      'confirmar-manifesto': { type: 'string' },
      'confirmar-commit': { type: 'string' },
      topologia: { type: 'string' },
      'confirmar-topologia': { type: 'string' },
      'confirmar-bucket': { type: 'string' },
      aplicar: { type: 'boolean' },
      'criar-bucket': { type: 'boolean' },
    },
  });
  if (positionals.length) throw new Error('Este comando não aceita argumentos posicionais');
  if (values.ambiente !== 'producao' || values.aplicar !== true) throw new Error('Use somente com --ambiente producao --aplicar e confirmações explícitas');
  if (typeof values.manifesto !== 'string' || !values.manifesto) throw new Error('Informe --manifesto com snapshot do banco e fontes locais');

  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  await carregarEnvProducao(raiz);
  const caminho = caminhoManifestoSeguro(raiz, values.manifesto);
  const manifesto = JSON.parse(await readFile(caminho, 'utf8'));
  verificarManifesto(manifesto);
  if (manifesto.banco?.estado !== 'snapshot-somente-leitura' || !manifesto.banco.identidadeOrigemSha256) throw new Error('Gere o manifesto com snapshot somente leitura do banco de origem');
  const config = validarConfiguracaoImportacaoProducao(values, process.env, manifesto.banco.identidadeOrigemSha256, manifesto.sha256, manifesto.commit);
  const preparado = await prepararImportacao(manifesto, raiz, { bucket: config.bucketConfig.bucket });
  validarCoberturaDoBucket(config.bucketConfig, preparado.payloads);

  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } }, log: [] });
    await prisma.$connect();
    const repository = criarRepositorioPrisma(prisma);
    const storage = criarAdaptadorStorage({ url: config.supabaseUrl, serviceKey: config.serviceKey });
    const resultado = await executarImportacao(preparado, {
      repository,
      storage,
      ambiente: 'producao',
      confirmacaoProducao: true,
      destinoRef: config.destinoRef,
      topologia: config.topologia,
      manifestoSha256: manifesto.sha256,
      origemSha256: manifesto.banco.identidadeOrigemSha256,
      commitOrigem: manifesto.commit,
      bucketConfig: config.bucketConfig,
      allowCreateBucket: config.allowCreateBucket,
    });
    console.log(JSON.stringify({
      ambiente: 'producao',
      destinoRef: config.destinoRef,
      topologia: config.topologia,
      manifestoSha256: manifesto.sha256,
      ...resultado,
    }, null, 2));
  } catch (erro) {
    if (erro?.message?.startsWith('Execução exec_')) throw erro;
    throw new Error('Falha na importação de produção. Credenciais e detalhes do driver foram suprimidos; consulte o estado persistido antes de retomar.');
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

executar().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
