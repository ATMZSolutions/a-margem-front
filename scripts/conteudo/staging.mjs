import { createHash } from 'node:crypto';

const BUCKET_REGEX = /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/;
const MIME_REGEX = /^image\/[a-z0-9.+-]+$/;
const REF_REGEX = /^[a-z0-9]{20}$/;
const LIMITE_UPLOAD_PADRAO_BYTES = 6 * 1024 * 1024;
const sha256 = (valor) => createHash('sha256').update(valor).digest('hex');

export function validarConfiguracaoStaging(valores, ambiente, origemSha256, manifestoSha256) {
  if (valores.ambiente !== 'staging') throw new Error('O executor aceita somente --ambiente staging');
  if (valores.aplicar !== true) throw new Error('Para iniciar gravações, informe --aplicar explicitamente');
  if (valores['dry-run'] === true) throw new Error('Use a CLI comum para dry-run; este comando só executa staging com confirmação');
  if (!valores.manifesto) throw new Error('Informe --manifesto com snapshot do banco e fontes locais');
  if (!/^[a-f0-9]{64}$/.test(manifestoSha256 ?? '') || valores['confirmar-manifesto'] !== manifestoSha256) throw new Error('Confirme o hash exato do manifesto com --confirmar-manifesto');
  if (ambiente.STAGING_IMPORT_ENABLED !== 'true') throw new Error('STAGING_IMPORT_ENABLED=true é obrigatório como trava local');

  const destinoRef = valores['destino-ref'];
  if (!REF_REGEX.test(destinoRef ?? '')) throw new Error('Referência Supabase de staging inválida');
  if (ambiente.STAGING_PROJECT_REF !== destinoRef || valores['confirmar-destino'] !== destinoRef) throw new Error('Confirme a mesma referência em STAGING_PROJECT_REF e --confirmar-destino');
  const topologia = valores.topologia;
  if (!['mesmo-banco', 'bancos-separados'].includes(topologia) || ambiente.STAGING_ORIGEM_DESTINO !== topologia || valores['confirmar-topologia'] !== topologia) {
    throw new Error('Confirme a topologia em STAGING_ORIGEM_DESTINO, --topologia e --confirmar-topologia');
  }
  if (!/^[a-f0-9]{64}$/.test(origemSha256 ?? '')) throw new Error('Snapshot não registra identidade verificável do banco de origem');

  let supabase;
  let banco;
  try {
    supabase = new URL(ambiente.STAGING_SUPABASE_URL);
    banco = new URL(ambiente.STAGING_DATABASE_URL);
  } catch {
    throw new Error('STAGING_SUPABASE_URL ou STAGING_DATABASE_URL inválida');
  }
  if (supabase.protocol !== 'https:' || supabase.hostname !== `${destinoRef}.supabase.co` || supabase.pathname !== '/' || supabase.search || supabase.hash) {
    throw new Error('STAGING_SUPABASE_URL não corresponde à referência confirmada');
  }
  if (!['postgres:', 'postgresql:'].includes(banco.protocol) || !banco.username || !banco.password || !['require', 'verify-ca', 'verify-full'].includes(banco.searchParams.get('sslmode'))) {
    throw new Error('STAGING_DATABASE_URL deve ser PostgreSQL com credenciais e SSL');
  }
  const usuarioBanco = decodeURIComponent(banco.username);
  const hostDireto = banco.hostname === `db.${destinoRef}.supabase.co`;
  const hostPooler = banco.hostname.endsWith('.pooler.supabase.com') && usuarioBanco === `postgres.${destinoRef}`;
  if (!hostDireto && !hostPooler) throw new Error('STAGING_DATABASE_URL não corresponde ao projeto confirmado');

  const identidadeDestino = sha256(`${banco.host}${banco.pathname}`);
  if (topologia === 'mesmo-banco' && identidadeDestino !== origemSha256) throw new Error('A URL do destino não corresponde à identidade do banco de origem');
  if (topologia === 'bancos-separados' && identidadeDestino === origemSha256) throw new Error('A URL do destino coincide com a identidade do banco de origem');

  const bucket = ambiente.STAGING_STORAGE_BUCKET;
  const maxFileSizeBytes = Number(ambiente.STAGING_STORAGE_MAX_FILE_SIZE_BYTES);
  const allowedMimeTypes = [...new Set((ambiente.STAGING_STORAGE_ALLOWED_MIME_TYPES ?? '').split(',').map((mime) => mime.trim()).filter(Boolean))].sort();
  if (!BUCKET_REGEX.test(bucket ?? '')) throw new Error('STAGING_STORAGE_BUCKET inválido');
  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes < 1) throw new Error('STAGING_STORAGE_MAX_FILE_SIZE_BYTES inválido');
  if (!allowedMimeTypes.length || allowedMimeTypes.some((mime) => !MIME_REGEX.test(mime))) throw new Error('STAGING_STORAGE_ALLOWED_MIME_TYPES inválido');
  const serviceKey = ambiente.STAGING_SUPABASE_SECRET_KEY?.trim() || ambiente.STAGING_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secretKeyNova = typeof serviceKey === 'string' && serviceKey.startsWith('sb_secret_');
  const serviceRoleLegada = typeof serviceKey === 'string' && serviceKey.startsWith('eyJ');
  if (typeof serviceKey !== 'string' || (!secretKeyNova && !serviceRoleLegada) || serviceKey.length < 16) throw new Error('STAGING_SUPABASE_SECRET_KEY (ou service_role legada) ausente/inválida');

  return {
    destinoRef,
    topologia,
    databaseUrl: banco.toString(),
    supabaseUrl: supabase.origin,
    serviceKey,
    bucketConfig: { bucket, maxFileSizeBytes, allowedMimeTypes },
    allowCreateBucket: valores['criar-bucket'] === true,
  };
}

export function validarCoberturaDoBucket(configuracao, payloads) {
  if (!Array.isArray(payloads)) throw new Error('Payloads da preparação são inválidos');
  const mimes = new Set(configuracao.allowedMimeTypes);
  for (const payload of payloads) {
    if (!mimes.has(payload.mime) || payload.bytes > configuracao.maxFileSizeBytes) throw new Error('Configuração de bucket não cobre as mídias do manifesto');
    if (payload.bytes > LIMITE_UPLOAD_PADRAO_BYTES) throw new Error('Há mídia acima de 6 MiB; transporte retomável TUS ainda não está integrado');
  }
}
