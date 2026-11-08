import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validarConfiguracaoImportacaoProducao, validarConfiguracaoMigracaoProducao } from './producao.mjs';

const ref = 'ekbgtafcgsjaeahuxojy';
const manifestoSha256 = 'a'.repeat(64);
const commit = 'c05ce1b791569f4c577571f7cef236708b64f3aa';
const databaseUrl = `postgresql://postgres.${ref}:senha-falsa@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`;
const origemSha256 = createHash('sha256').update(`aws-1-us-east-2.pooler.supabase.com:5432/postgres`).digest('hex');

function values(overrides = {}) {
  return {
    ambiente: 'producao',
    operacao: 'check',
    aplicar: true,
    manifesto: '.conteudo-migracao/inventario-e0-confirmado.json',
    'destino-ref': ref,
    'confirmar-destino': ref,
    'confirmar-manifesto': manifestoSha256,
    'confirmar-commit': commit,
    topologia: 'mesmo-banco',
    'confirmar-topologia': 'mesmo-banco',
    'criar-bucket': true,
    'confirmar-bucket': 'site-publico',
    ...overrides,
  };
}

function environment(overrides = {}) {
  return {
    PRODUCAO_IMPORT_ENABLED: 'true',
    PRODUCAO_MIGRATIONS_ENABLED: 'true',
    PRODUCAO_PROJECT_REF: ref,
    PRODUCAO_DATABASE_URL: databaseUrl,
    PRODUCAO_SUPABASE_URL: `https://${ref}.supabase.co`,
    PRODUCAO_SUPABASE_SECRET_KEY: 'sb_secret_credencial-falsa-de-teste',
    PRODUCAO_STORAGE_BUCKET: 'site-publico',
    PRODUCAO_STORAGE_MAX_FILE_SIZE_BYTES: '5242880',
    PRODUCAO_STORAGE_ALLOWED_MIME_TYPES: 'image/png,image/jpeg',
    PRODUCAO_ORIGEM_DESTINO: 'mesmo-banco',
    ...overrides,
  };
}

describe('travas da operação de produção', () => {
  it('aceita apenas o banco confirmado, mesma topologia e bucket explicitamente confirmado', () => {
    const config = validarConfiguracaoImportacaoProducao(values(), environment(), origemSha256, manifestoSha256, commit);
    expect(config).toMatchObject({
      destinoRef: ref,
      topologia: 'mesmo-banco',
      bucketConfig: { bucket: 'site-publico', maxFileSizeBytes: 5242880, allowedMimeTypes: ['image/jpeg', 'image/png'] },
      allowCreateBucket: true,
    });
  });

  it('bloqueia sem kill switch, hash do manifesto, commit e confirmações exatas', () => {
    expect(() => validarConfiguracaoImportacaoProducao(values(), environment({ PRODUCAO_IMPORT_ENABLED: 'false' }), origemSha256, manifestoSha256, commit)).toThrow('PRODUCAO_IMPORT_ENABLED=true');
    expect(() => validarConfiguracaoImportacaoProducao(values({ 'confirmar-manifesto': 'b'.repeat(64) }), environment(), origemSha256, manifestoSha256, commit)).toThrow('hash exato');
    expect(() => validarConfiguracaoImportacaoProducao(values({ 'confirmar-commit': 'abcdef1234567' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('commit exato');
    expect(() => validarConfiguracaoImportacaoProducao(values({ 'confirmar-destino': 'outra-referencia-00' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('referência de produção');
    expect(() => validarConfiguracaoImportacaoProducao(values({ 'confirmar-topologia': 'bancos-separados' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('topologia mesmo-banco');
    expect(() => validarConfiguracaoImportacaoProducao(values({ 'confirmar-bucket': 'outro-bucket' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('criação/verificação do bucket');
  });

  it('recusa endpoints diferentes, transaction pooler, falta de TLS e identidade divergente', () => {
    expect(() => validarConfiguracaoImportacaoProducao(values(), environment({ PRODUCAO_DATABASE_URL: databaseUrl.replace(ref, 'outrareferencia123456') }), origemSha256, manifestoSha256, commit)).toThrow('session pooler');
    expect(() => validarConfiguracaoImportacaoProducao(values(), environment({ PRODUCAO_DATABASE_URL: databaseUrl.replace(':5432/', ':6543/') }), origemSha256, manifestoSha256, commit)).toThrow('session pooler');
    expect(() => validarConfiguracaoImportacaoProducao(values(), environment({ PRODUCAO_DATABASE_URL: databaseUrl.replace('?sslmode=require', '') }), origemSha256, manifestoSha256, commit)).toThrow('TLS');
    expect(() => validarConfiguracaoImportacaoProducao(values(), environment(), '0'.repeat(64), manifestoSha256, commit)).toThrow('identidade da origem');
  });

  it('permite status/check sem escrita e exige autorização local para baseline/deploy', () => {
    const check = validarConfiguracaoMigracaoProducao(values({ operacao: 'check', aplicar: false }), environment(), origemSha256, manifestoSha256, commit);
    expect(check.operacao).toBe('check');
    const preflight = validarConfiguracaoMigracaoProducao(values({ operacao: 'preflight', aplicar: false }), environment(), origemSha256, manifestoSha256, commit);
    expect(preflight.operacao).toBe('preflight');
    expect(() => validarConfiguracaoMigracaoProducao(values({ operacao: 'preflight' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('--aplicar só é permitido');
    expect(() => validarConfiguracaoMigracaoProducao(values({ operacao: 'baseline', aplicar: false, 'confirmar-baseline': '0_base_legada' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('PRODUCAO_MIGRATIONS_ENABLED=true');
    const baseline = validarConfiguracaoMigracaoProducao(values({ operacao: 'baseline', 'confirmar-baseline': '0_base_legada' }), environment(), origemSha256, manifestoSha256, commit);
    expect(baseline.operacao).toBe('baseline');
    expect(() => validarConfiguracaoMigracaoProducao(values({ operacao: 'deploy', 'confirmar-deploy': 'producao:outra-ref' }), environment(), origemSha256, manifestoSha256, commit)).toThrow('Confirmação explícita');
  });
});
