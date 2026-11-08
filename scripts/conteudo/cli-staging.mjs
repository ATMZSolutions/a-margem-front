import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { loadEnvFile } from 'node:process';
import { prepararImportacao } from './preparacao.mjs';
import { executarImportacao } from './executor.mjs';
import { criarRepositorioPrisma } from './repositorio-prisma.mjs';
import { criarAdaptadorStorage } from './storage.mjs';
import { validarCoberturaDoBucket, validarConfiguracaoStaging } from './staging.mjs';

async function carregarEnvStaging(raiz) {
  for (const nome of ['.env.staging.local', '.env.staging']) {
    try { loadEnvFile(path.join(raiz, nome)); } catch (erro) {
      if (erro.code !== 'ENOENT') throw new Error('Falha ao carregar configuração local de staging');
    }
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
      topologia: { type: 'string' },
      'confirmar-topologia': { type: 'string' },
      aplicar: { type: 'boolean' },
      'criar-bucket': { type: 'boolean' },
    },
  });
  if (positionals.length) throw new Error('Este comando não aceita argumentos posicionais');
  if (values.ambiente !== 'staging' || values.aplicar !== true) throw new Error('Use somente com --ambiente staging --aplicar e confirmações explícitas');
  if (typeof values.manifesto !== 'string' || !values.manifesto) throw new Error('Informe --manifesto com snapshot do banco e fontes locais');

  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  await carregarEnvStaging(raiz);
  const caminho = caminhoManifestoSeguro(raiz, values.manifesto);
  const manifesto = JSON.parse(await readFile(caminho, 'utf8'));
  if (manifesto.banco?.estado !== 'snapshot-somente-leitura' || !manifesto.banco.identidadeOrigemSha256) throw new Error('Gere o manifesto com snapshot somente leitura do banco de origem');
  const config = validarConfiguracaoStaging(values, process.env, manifesto.banco.identidadeOrigemSha256, manifesto.sha256);
  const preparado = await prepararImportacao(manifesto, raiz, { bucket: config.bucketConfig.bucket });
  validarCoberturaDoBucket(config.bucketConfig, preparado.payloads);
  if (!/^[a-f0-9]{7,64}$/.test(manifesto.commit ?? '')) throw new Error('O manifesto não contém commit de origem válido');

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
      ambiente: 'staging',
      destinoRef: config.destinoRef,
      topologia: config.topologia,
      manifestoSha256: manifesto.sha256,
      origemSha256: manifesto.banco.identidadeOrigemSha256,
      commitOrigem: manifesto.commit,
      bucketConfig: config.bucketConfig,
      allowCreateBucket: config.allowCreateBucket,
    });
    console.log(JSON.stringify({
      ambiente: 'staging',
      destinoRef: config.destinoRef,
      topologia: config.topologia,
      manifestoSha256: manifesto.sha256,
      ...resultado,
    }, null, 2));
  } catch (erro) {
    if (erro?.message?.startsWith('Execução exec_')) throw erro;
    throw new Error('Falha na importação de staging. Credenciais e detalhes do driver foram suprimidos; consulte o estado persistido da execução antes de retomar.');
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

executar().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
