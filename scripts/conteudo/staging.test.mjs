import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validarCoberturaDoBucket, validarConfiguracaoStaging } from './staging.mjs';

const ref = 'abcdefghijklmnopqrst';
const manifestoSha256 = 'a'.repeat(64);
const databaseUrl = `postgresql://postgres:senha-falsa@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
const hash = (valor) => createHash('sha256').update(valor).digest('hex');

function values(overrides = {}) {
  return {
    ambiente: 'staging',
    aplicar: true,
    manifesto: '.conteudo-migracao/inventario.json',
    'destino-ref': ref,
    'confirmar-destino': ref,
    'confirmar-manifesto': manifestoSha256,
    topologia: 'bancos-separados',
    'confirmar-topologia': 'bancos-separados',
    ...overrides,
  };
}

function environment(overrides = {}) {
  return {
    STAGING_IMPORT_ENABLED: 'true',
    STAGING_PROJECT_REF: ref,
    STAGING_DATABASE_URL: databaseUrl,
    STAGING_SUPABASE_URL: `https://${ref}.supabase.co`,
    STAGING_SUPABASE_SECRET_KEY: 'sb_secret_credencial-falsa-de-teste-privilegiada',
    STAGING_STORAGE_BUCKET: 'site-publico',
    STAGING_STORAGE_MAX_FILE_SIZE_BYTES: '3000000',
    STAGING_STORAGE_ALLOWED_MIME_TYPES: 'image/png, image/jpeg',
    STAGING_ORIGEM_DESTINO: 'bancos-separados',
    ...overrides,
  };
}

describe('travas da CLI exclusiva de staging', () => {
  it('aceita apenas ambiente staging, kill switch e confirmações de destino, topologia e manifesto', () => {
    const config = validarConfiguracaoStaging(values(), environment(), '0'.repeat(64), manifestoSha256);
    expect(config).toMatchObject({
      destinoRef: ref,
      topologia: 'bancos-separados',
      bucketConfig: { bucket: 'site-publico', maxFileSizeBytes: 3000000, allowedMimeTypes: ['image/jpeg', 'image/png'] },
      allowCreateBucket: false,
    });
  });

  it('bloqueia produção, ausência de aplicar, kill switch desligado e confirmações divergentes', () => {
    expect(() => validarConfiguracaoStaging(values({ ambiente: 'producao' }), environment(), '0'.repeat(64), manifestoSha256)).toThrow('somente --ambiente staging');
    expect(() => validarConfiguracaoStaging(values({ aplicar: false }), environment(), '0'.repeat(64), manifestoSha256)).toThrow('--aplicar');
    expect(() => validarConfiguracaoStaging(values(), environment({ STAGING_IMPORT_ENABLED: 'false' }), '0'.repeat(64), manifestoSha256)).toThrow('STAGING_IMPORT_ENABLED=true');
    expect(() => validarConfiguracaoStaging(values({ 'confirmar-destino': 'outro-projeto-ref-00' }), environment(), '0'.repeat(64), manifestoSha256)).toThrow('Confirme a mesma referência');
    expect(() => validarConfiguracaoStaging(values({ 'confirmar-manifesto': 'b'.repeat(64) }), environment(), '0'.repeat(64), manifestoSha256)).toThrow('hash exato do manifesto');
    expect(() => validarConfiguracaoStaging(values({ 'confirmar-topologia': 'mesmo-banco' }), environment(), '0'.repeat(64), manifestoSha256)).toThrow('Confirme a topologia');
  });

  it('verifica que URLs de API e banco pertencem à referência de projeto confirmada', () => {
    expect(() => validarConfiguracaoStaging(values(), environment({ STAGING_SUPABASE_URL: 'https://producao.supabase.co' }), '0'.repeat(64), manifestoSha256)).toThrow('não corresponde à referência');
    expect(() => validarConfiguracaoStaging(values(), environment({ STAGING_DATABASE_URL: 'postgresql://postgres:senha@db.outro-projeto-ref.supabase.co:5432/postgres?sslmode=require' }), '0'.repeat(64), manifestoSha256)).toThrow('não corresponde ao projeto');
    expect(() => validarConfiguracaoStaging(values(), environment({ STAGING_DATABASE_URL: 'postgresql://postgres:senha@db.acme.supabase.co:5432/postgres' }), '0'.repeat(64), manifestoSha256)).toThrow('com credenciais e SSL');
  });

  it('compara fingerprint do endpoint para impedir topologia declarada incorretamente', () => {
    const banco = new URL(databaseUrl);
    const fingerprintOrigem = hash(`${banco.host}${banco.pathname}`);
    const mesmaTopologia = values({ topologia: 'mesmo-banco', 'confirmar-topologia': 'mesmo-banco' });
    const mesmoAmbiente = environment({ STAGING_ORIGEM_DESTINO: 'mesmo-banco' });
    expect(validarConfiguracaoStaging(mesmaTopologia, mesmoAmbiente, fingerprintOrigem, manifestoSha256).topologia).toBe('mesmo-banco');
    expect(() => validarConfiguracaoStaging(mesmaTopologia, mesmoAmbiente, '0'.repeat(64), manifestoSha256)).toThrow('não corresponde à identidade');
    expect(() => validarConfiguracaoStaging(values(), environment(), fingerprintOrigem, manifestoSha256)).toThrow('coincide com a identidade');
  });

  it('exige tipos e tamanho de bucket suficientes antes de abrir conexões', () => {
    const config = validarConfiguracaoStaging(values(), environment(), '0'.repeat(64), manifestoSha256);
    expect(() => validarCoberturaDoBucket(config.bucketConfig, [{ mime: 'image/webp', bytes: 100 }])).toThrow('não cobre as mídias');
    expect(() => validarCoberturaDoBucket(config.bucketConfig, [{ mime: 'image/png', bytes: 4000000 }])).toThrow('não cobre as mídias');
    expect(() => validarCoberturaDoBucket({ ...config.bucketConfig, maxFileSizeBytes: 8 * 1024 * 1024 }, [{ mime: 'image/png', bytes: 6 * 1024 * 1024 + 1 }])).toThrow('TUS');
    expect(() => validarCoberturaDoBucket(config.bucketConfig, [{ mime: 'image/png', bytes: 10 }])).not.toThrow();
  });
});
