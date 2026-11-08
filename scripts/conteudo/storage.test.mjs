import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { criarAdaptadorStorage } from './storage.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const configuracao = { bucket: 'site-publico', maxFileSizeBytes: 1024, allowedMimeTypes: ['image/png'] };

function servidorFalso({ corrupcaoAposUpload = false, ausenciaStorageSupabase = false } = {}) {
  const buckets = [];
  const objetos = new Map();
  const chamadas = [];
  const fetchImpl = async (input, opcoes = {}) => {
    const url = new URL(input);
    const rota = url.pathname.slice('/storage/v1'.length);
    chamadas.push({ rota, method: opcoes.method ?? 'GET', headers: opcoes.headers ?? {} });
    if (rota === '/bucket' && (opcoes.method ?? 'GET') === 'GET') return Response.json(buckets);
    if (rota === '/bucket' && opcoes.method === 'POST') {
      const dados = JSON.parse(opcoes.body);
      buckets.push({ ...dados, file_size_limit: dados.file_size_limit, allowed_mime_types: dados.allowed_mime_types });
      return Response.json({ name: dados.name });
    }
    if (rota.startsWith('/object/')) {
      const [bucket, ...partes] = rota.slice('/object/'.length).split('/');
      const chave = partes.map((parte) => decodeURIComponent(parte)).join('/');
      const objeto = `${decodeURIComponent(bucket)}/${chave}`;
      if ((opcoes.method ?? 'GET') === 'GET') {
        const bytes = objetos.get(objeto);
        if (bytes) return new Response(bytes);
        if (ausenciaStorageSupabase) return Response.json({ statusCode: '404', error: 'not_found', message: 'Object not found', code: 'NoSuchKey' }, { status: 400 });
        return new Response('ausente', { status: 404 });
      }
      if (opcoes.method === 'POST') {
        if (opcoes.headers['x-upsert'] !== 'false') return new Response('upsert deve permanecer falso', { status: 400 });
        const bytes = Buffer.from(opcoes.body);
        objetos.set(objeto, corrupcaoAposUpload ? Buffer.from('outros bytes') : bytes);
        return Response.json({ Key: chave });
      }
    }
    return new Response('rota inesperada', { status: 404 });
  };
  return { fetchImpl, buckets, objetos, chamadas };
}

function novoAdaptador(servidor) {
  return criarAdaptadorStorage({ url: 'https://projeto-exemplo.supabase.co', serviceRoleKey: 'eyJhbGciOiJmYWtlLXNlcnZpY2Vfcm9sZQ', fetchImpl: servidor.fetchImpl });
}

describe('adaptador Supabase Storage isolado', () => {
  it('não cria bucket ausente sem opção explícita e valida limites/tipos do bucket', async () => {
    const servidor = servidorFalso();
    const storage = novoAdaptador(servidor);

    await expect(storage.conferirOuCriarBucket(configuracao)).rejects.toThrow('criação exige autorização explícita');
    expect(servidor.chamadas).toHaveLength(1);
    expect(servidor.chamadas[0].headers.authorization).toBe('Bearer eyJhbGciOiJmYWtlLXNlcnZpY2Vfcm9sZQ');
    const payload = Buffer.from('png fixture');
    const digest = sha256(payload);
    await expect(storage.enviarEVerificar({ bucket: configuracao.bucket, chave: `originais/${digest}.png`, sha256: digest, mime: 'image/png', bytes: payload.length, payload })).rejects.toThrow('Payload fora da configuração verificada');

    const resultado = await storage.conferirOuCriarBucket(configuracao, { allowCreate: true });
    expect(resultado).toMatchObject({ id: 'site-publico', public: true, fileSizeLimit: 1024, allowedMimeTypes: ['image/png'] });
    expect(servidor.chamadas.filter((item) => item.method === 'POST')).toHaveLength(1);

    servidor.buckets[0].public = false;
    await expect(storage.conferirOuCriarBucket(configuracao)).rejects.toThrow('não corresponde à configuração pública esperada');
  });

  it('usa a secret API key nova somente no header apikey, sem tratá-la como JWT', async () => {
    const servidor = servidorFalso();
    const storage = criarAdaptadorStorage({
      url: 'https://projeto-exemplo.supabase.co',
      serviceKey: 'sb_secret_chave-falsa-privilegiada-para-teste',
      fetchImpl: servidor.fetchImpl,
    });
    await storage.conferirOuCriarBucket(configuracao, { allowCreate: true });

    expect(servidor.chamadas[0].headers.apikey).toBe('sb_secret_chave-falsa-privilegiada-para-teste');
    expect(servidor.chamadas[0].headers.authorization).toBeUndefined();
  });

  it('faz upload sem sobrescrita, baixa para conferir bytes e reutiliza objeto igual', async () => {
    const servidor = servidorFalso();
    const storage = novoAdaptador(servidor);
    await storage.conferirOuCriarBucket(configuracao, { allowCreate: true });
    const payload = Buffer.from('conteudo de teste de png');
    const digest = sha256(payload);
    const item = { bucket: 'site-publico', chave: `originais/${digest}.png`, sha256: digest, mime: 'image/png', bytes: payload.length, payload };

    expect(await storage.enviarEVerificar(item)).toMatchObject({ estado: 'enviado-verificado', sha256: digest, bytes: payload.length });
    expect(await storage.enviarEVerificar(item)).toMatchObject({ estado: 'existente-verificado', sha256: digest, bytes: payload.length });
    const uploads = servidor.chamadas.filter((chamada) => chamada.method === 'POST' && chamada.rota.startsWith('/object/'));
    expect(uploads).toHaveLength(1);
    expect(uploads[0].headers['x-upsert']).toBe('false');
    expect(storage.urlPublica(item.bucket, item.chave)).toBe(`https://projeto-exemplo.supabase.co/storage/v1/object/public/site-publico/${item.chave}`);
  });

  it('trata a resposta estruturada NoSuchKey do Supabase como objeto ausente', async () => {
    const servidor = servidorFalso({ ausenciaStorageSupabase: true });
    const storage = novoAdaptador(servidor);
    await storage.conferirOuCriarBucket(configuracao, { allowCreate: true });
    const payload = Buffer.from('png fixture');
    const digest = sha256(payload);
    const item = { bucket: 'site-publico', chave: `originais/${digest}.png`, sha256: digest, mime: 'image/png', bytes: payload.length, payload };

    expect(await storage.enviarEVerificar(item)).toMatchObject({ estado: 'enviado-verificado', sha256: digest, bytes: payload.length });
    expect(servidor.chamadas.filter((chamada) => chamada.method === 'POST' && chamada.rota.startsWith('/object/'))).toHaveLength(1);
  });

  it('bloqueia payload alterado, chave que não corresponde ao hash e objetos remotos divergentes', async () => {
    const servidor = servidorFalso();
    const storage = novoAdaptador(servidor);
    await storage.conferirOuCriarBucket(configuracao, { allowCreate: true });
    const payload = Buffer.from('png fixture');
    const digest = sha256(payload);
    const item = { bucket: 'site-publico', chave: `originais/${digest}.png`, sha256: digest, mime: 'image/png', bytes: payload.length, payload };

    await expect(storage.enviarEVerificar({ ...item, sha256: '0'.repeat(64) })).rejects.toThrow('Payload inválido antes do upload');
    await expect(storage.enviarEVerificar({ ...item, chave: `originais/${'0'.repeat(64)}.png` })).rejects.toThrow('Payload fora da configuração verificada');

    servidor.objetos.set(`${item.bucket}/${item.chave}`, Buffer.from('versao divergente'));
    await expect(storage.enviarEVerificar(item)).rejects.toThrow('Objeto existente diverge do manifesto');
  });

  it('confere o download imediatamente após o upload e acusa bytes corrompidos', async () => {
    const servidor = servidorFalso({ corrupcaoAposUpload: true });
    const storage = novoAdaptador(servidor);
    await storage.conferirOuCriarBucket(configuracao, { allowCreate: true });
    const payload = Buffer.from('png fixture');
    const digest = sha256(payload);
    await expect(storage.enviarEVerificar({ bucket: 'site-publico', chave: `originais/${digest}.png`, sha256: digest, mime: 'image/png', bytes: payload.length, payload })).rejects.toThrow('Objeto existente diverge do manifesto');
  });

  it('exige transporte retomável para arquivos acima do limite do upload padrão', async () => {
    const servidor = servidorFalso();
    const storage = novoAdaptador(servidor);
    const payload = Buffer.alloc(6 * 1024 * 1024 + 1);
    const digest = sha256(payload);
    await expect(storage.enviarEVerificar({ bucket: 'site-publico', chave: `originais/${digest}.png`, sha256: digest, mime: 'image/png', bytes: payload.length, payload })).rejects.toThrow('requer transporte TUS');
    expect(servidor.chamadas).toHaveLength(0);
  });
});
