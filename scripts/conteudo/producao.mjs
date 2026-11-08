import { createHash } from 'node:crypto';

const BUCKET_REGEX = /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/;
const MIME_REGEX = /^image\/[a-z0-9.+-]+$/;
const REF_REGEX = /^[a-z0-9]{20}$/;
const sha256 = (valor) => createHash('sha256').update(valor).digest('hex');

function exigirManifesto(valores, manifestoSha256, commitOrigem) {
  if (valores.ambiente !== 'producao' || valores.aplicar !== true || valores['dry-run'] === true) {
    throw new Error('A execução exige --ambiente producao --aplicar e não aceita dry-run');
  }
  if (!valores.manifesto) throw new Error('Informe --manifesto com o snapshot confirmado');
  if (!/^[a-f0-9]{64}$/.test(manifestoSha256 ?? '') || valores['confirmar-manifesto'] !== manifestoSha256) {
    throw new Error('Confirme o hash exato do manifesto com --confirmar-manifesto');
  }
  if (!/^[a-f0-9]{7,64}$/.test(commitOrigem ?? '') || valores['confirmar-commit'] !== commitOrigem) {
    throw new Error('Confirme o commit exato do manifesto com --confirmar-commit');
  }
}

export function validarConexaoProducao(ambiente, origemSha256) {
  const destinoRef = ambiente.PRODUCAO_PROJECT_REF?.trim();
  if (!REF_REGEX.test(destinoRef ?? '')) throw new Error('PRODUCAO_PROJECT_REF inválida');
  if (ambiente.PRODUCAO_ORIGEM_DESTINO !== 'mesmo-banco') throw new Error('PRODUCAO_ORIGEM_DESTINO deve confirmar mesmo-banco');
  if (!/^[a-f0-9]{64}$/.test(origemSha256 ?? '')) throw new Error('Snapshot não registra identidade verificável da origem');

  let supabase;
  let banco;
  try {
    supabase = new URL(ambiente.PRODUCAO_SUPABASE_URL ?? '');
    banco = new URL(ambiente.PRODUCAO_DATABASE_URL ?? '');
  } catch {
    throw new Error('PRODUCAO_SUPABASE_URL ou PRODUCAO_DATABASE_URL ausente/inválida');
  }
  if (supabase.protocol !== 'https:' || supabase.hostname !== `${destinoRef}.supabase.co` || supabase.pathname !== '/' || supabase.search || supabase.hash) {
    throw new Error('PRODUCAO_SUPABASE_URL não corresponde à referência confirmada');
  }
  if (!['postgres:', 'postgresql:'].includes(banco.protocol) || !banco.username || !banco.password || !['require', 'verify-ca', 'verify-full'].includes(banco.searchParams.get('sslmode'))) {
    throw new Error('PRODUCAO_DATABASE_URL deve ser PostgreSQL com credenciais e TLS');
  }

  const usuario = decodeURIComponent(banco.username);
  const porta = banco.port || '5432';
  const hostDireto = banco.hostname === `db.${destinoRef}.supabase.co` && porta === '5432';
  const hostPooler = banco.hostname.endsWith('.pooler.supabase.com') && usuario === `postgres.${destinoRef}` && porta === '5432';
  if (!hostDireto && !hostPooler) throw new Error('PRODUCAO_DATABASE_URL deve apontar ao projeto confirmado por conexão direta ou session pooler na porta 5432');
  if (!['postgres', 'postgresql'].includes(banco.pathname.slice(1))) throw new Error('PRODUCAO_DATABASE_URL deve selecionar o banco postgres');

  const identidadeDestino = sha256(`${banco.host}${banco.pathname}`);
  if (identidadeDestino !== origemSha256) throw new Error('PRODUCAO_DATABASE_URL não corresponde à identidade da origem confirmada');
  return { destinoRef, databaseUrl: banco.toString(), supabaseUrl: supabase.origin, topologia: 'mesmo-banco' };
}

export function validarConfiguracaoImportacaoProducao(valores, ambiente, origemSha256, manifestoSha256, commitOrigem) {
  exigirManifesto(valores, manifestoSha256, commitOrigem);
  if (ambiente.PRODUCAO_IMPORT_ENABLED !== 'true') throw new Error('PRODUCAO_IMPORT_ENABLED=true é obrigatório como trava local');

  const conexao = validarConexaoProducao(ambiente, origemSha256);
  if (valores['destino-ref'] !== conexao.destinoRef || valores['confirmar-destino'] !== conexao.destinoRef) {
    throw new Error('Confirme a mesma referência de produção em --destino-ref e --confirmar-destino');
  }
  if (valores.topologia !== 'mesmo-banco' || valores['confirmar-topologia'] !== 'mesmo-banco') {
    throw new Error('Confirme a topologia mesmo-banco em --topologia e --confirmar-topologia');
  }
  const bucket = ambiente.PRODUCAO_STORAGE_BUCKET;
  if (!BUCKET_REGEX.test(bucket ?? '')) throw new Error('PRODUCAO_STORAGE_BUCKET inválido');
  if (valores['criar-bucket'] !== true || valores['confirmar-bucket'] !== bucket) {
    throw new Error('Confirme a criação/verificação do bucket com --criar-bucket e --confirmar-bucket');
  }
  const maxFileSizeBytes = Number(ambiente.PRODUCAO_STORAGE_MAX_FILE_SIZE_BYTES);
  const allowedMimeTypes = [...new Set((ambiente.PRODUCAO_STORAGE_ALLOWED_MIME_TYPES ?? '').split(',').map((mime) => mime.trim()).filter(Boolean))].sort();
  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes < 1) throw new Error('PRODUCAO_STORAGE_MAX_FILE_SIZE_BYTES inválido');
  if (!allowedMimeTypes.length || allowedMimeTypes.some((mime) => !MIME_REGEX.test(mime))) throw new Error('PRODUCAO_STORAGE_ALLOWED_MIME_TYPES inválido');
  const serviceKey = ambiente.PRODUCAO_SUPABASE_SECRET_KEY?.trim() || ambiente.PRODUCAO_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (typeof serviceKey !== 'string' || !(serviceKey.startsWith('sb_secret_') || serviceKey.startsWith('eyJ')) || serviceKey.length < 16) {
    throw new Error('PRODUCAO_SUPABASE_SECRET_KEY (ou service_role legada) ausente/inválida');
  }
  return {
    ...conexao,
    serviceKey,
    bucketConfig: { bucket, maxFileSizeBytes, allowedMimeTypes },
    allowCreateBucket: true,
  };
}

export function validarConfiguracaoMigracaoProducao(valores, ambiente, origemSha256, manifestoSha256, commitOrigem) {
  const operacoes = ['check', 'preflight', 'status', 'baseline', 'deploy'].filter((op) => valores.operacao === op);
  if (operacoes.length !== 1) throw new Error('Escolha uma operação: --operacao check|preflight|status|baseline|deploy');
  if (!valores.manifesto) throw new Error('Informe --manifesto com o snapshot confirmado');
  if (!/^[a-f0-9]{64}$/.test(manifestoSha256 ?? '') || valores['confirmar-manifesto'] !== manifestoSha256) {
    throw new Error('Confirme o hash exato do manifesto com --confirmar-manifesto');
  }
  if (valores['confirmar-commit'] !== commitOrigem || !/^[a-f0-9]{7,64}$/.test(commitOrigem ?? '')) {
    throw new Error('Confirme o commit exato do manifesto com --confirmar-commit');
  }
  const conexao = validarConexaoProducao(ambiente, origemSha256);
  if (valores.ambiente !== 'producao' || valores['destino-ref'] !== conexao.destinoRef || valores['confirmar-destino'] !== conexao.destinoRef) {
    throw new Error('Confirme ambiente producao e a mesma referência em --destino-ref e --confirmar-destino');
  }
  if (valores.topologia !== 'mesmo-banco' || valores['confirmar-topologia'] !== 'mesmo-banco') {
    throw new Error('Confirme a topologia mesmo-banco em --topologia e --confirmar-topologia');
  }
  const operacao = valores.operacao;
  if (['baseline', 'deploy'].includes(operacao)) {
    if (valores.aplicar !== true || ambiente.PRODUCAO_MIGRATIONS_ENABLED !== 'true') {
      throw new Error('Migrações exigem --aplicar e PRODUCAO_MIGRATIONS_ENABLED=true');
    }
    const confirmacao = operacao === 'baseline' ? valores['confirmar-baseline'] === '0_base_legada' : valores['confirmar-deploy'] === `producao:${conexao.destinoRef}`;
    if (!confirmacao) throw new Error(`Confirmação explícita ausente para a operação ${operacao}`);
  } else if (valores.aplicar === true) {
    throw new Error('--aplicar só é permitido para baseline ou deploy');
  }
  return { ...conexao, operacao };
}
