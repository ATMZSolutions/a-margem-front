import { createHash } from 'node:crypto';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const EXTENSOES_POR_MIME = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/gif': ['gif'], 'image/avif': ['avif'], 'image/svg+xml': ['svg'], 'image/vnd.microsoft.icon': ['ico'] };
const LIMITE_UPLOAD_PADRAO_BYTES = 6 * 1024 * 1024;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rotaObjeto(bucket, chave) {
  return `/object/${encodeURIComponent(bucket)}/${chave.split('/').map(encodeURIComponent).join('/')}`;
}

function validarConfiguracaoBucket({ bucket, maxFileSizeBytes, allowedMimeTypes }) {
  if (typeof bucket !== 'string' || !/^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Nome de bucket inválido');
  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes < 1) throw new Error('Limite de arquivo inválido');
  if (!Array.isArray(allowedMimeTypes) || !allowedMimeTypes.length || allowedMimeTypes.some((mime) => typeof mime !== 'string' || !/^image\/[a-z0-9.+-]+$/.test(mime))) throw new Error('Lista de MIME permitidos inválida');
}

function validarBucketExistente(encontrado, esperado) {
  if (!encontrado) throw new Error('Bucket não encontrado');
  if (encontrado.id !== esperado.bucket || encontrado.name !== esperado.bucket || encontrado.public !== true) throw new Error('Bucket existente não corresponde à configuração pública esperada');
  const limite = Number(encontrado.file_size_limit);
  if (!Number.isFinite(limite) || limite < esperado.maxFileSizeBytes) throw new Error('Limite do bucket existente é menor que o necessário');
  const mimes = Array.isArray(encontrado.allowed_mime_types) ? new Set(encontrado.allowed_mime_types) : null;
  if (!mimes || esperado.allowedMimeTypes.some((mime) => !mimes.has(mime))) throw new Error('MIME permitidos do bucket existente são insuficientes');
  return { id: encontrado.id, public: encontrado.public, fileSizeLimit: limite, allowedMimeTypes: [...mimes] };
}

export function criarAdaptadorStorage({ url, serviceKey, serviceRoleKey, fetchImpl = fetch, timeoutMs = 30000, tentativas = 3 }) {
  let base;
  try { base = new URL(url); } catch { throw new Error('SUPABASE_URL inválida'); }
  if (!['https:', 'http:'].includes(base.protocol) || base.pathname !== '/' || base.username || base.password || base.search || base.hash) throw new Error('SUPABASE_URL inválida');
  const chave = serviceKey ?? serviceRoleKey;
  const chaveSecretaNova = typeof chave === 'string' && chave.startsWith('sb_secret_');
  const chaveLegadaServiceRole = typeof chave === 'string' && chave.startsWith('eyJ');
  if (typeof chave !== 'string' || (!chaveSecretaNova && !chaveLegadaServiceRole) || chave.length < 16) throw new Error('Use a secret API key ou a chave service_role legada do Storage');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || !Number.isInteger(tentativas) || tentativas < 1 || tentativas > 5) throw new Error('Configuração de rede inválida');
  const origem = base.origin;
  const bucketsConfigurados = new Map();

  async function requisitar(caminho, opcoes = {}) {
    let ultimaFalha;
    for (let tentativa = 0; tentativa < tentativas; tentativa++) {
      const controlador = new AbortController();
      const timer = setTimeout(() => controlador.abort(), timeoutMs);
      try {
        const cabecalhosAutenticacao = { apikey: chave };
        // Secret API keys novas não são JWT: Supabase as rejeita como bearer token.
        if (!chaveSecretaNova) cabecalhosAutenticacao.authorization = `Bearer ${chave}`;
        const resposta = await fetchImpl(`${origem}/storage/v1${caminho}`, {
          ...opcoes,
          signal: controlador.signal,
          headers: {
            ...cabecalhosAutenticacao,
            ...opcoes.headers,
          },
        });
        if (resposta.status < 500 || tentativa === tentativas - 1) return resposta;
        await resposta.arrayBuffer();
        ultimaFalha = new Error(`Storage retornou HTTP ${resposta.status}`);
      } catch {
        ultimaFalha = new Error('Falha de rede ao acessar Storage');
        if (tentativa === tentativas - 1) throw ultimaFalha;
      } finally {
        clearTimeout(timer);
      }
      await esperar(150 * 2 ** tentativa);
    }
    throw ultimaFalha ?? new Error('Falha de rede ao acessar Storage');
  }

  async function listarBuckets() {
    const resposta = await requisitar('/bucket');
    if (!resposta.ok) throw new Error(`Não foi possível conferir buckets (HTTP ${resposta.status})`);
    let dados;
    try { dados = await resposta.json(); } catch { throw new Error('Resposta de buckets inválida'); }
    if (!Array.isArray(dados)) throw new Error('Resposta de buckets inválida');
    return dados;
  }

  async function conferirOuCriarBucket(configuracao, { allowCreate = false } = {}) {
    validarConfiguracaoBucket(configuracao);
    const buckets = await listarBuckets();
    const encontrado = buckets.find((item) => item.id === configuracao.bucket || item.name === configuracao.bucket);
    if (encontrado) {
      const verificado = validarBucketExistente(encontrado, configuracao);
      bucketsConfigurados.set(configuracao.bucket, configuracao);
      return verificado;
    }
    if (!allowCreate) throw new Error('Bucket ausente; criação exige autorização explícita do executor');
    const resposta = await requisitar('/bucket', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: configuracao.bucket, name: configuracao.bucket, public: true, file_size_limit: configuracao.maxFileSizeBytes, allowed_mime_types: configuracao.allowedMimeTypes }),
    });
    if (!resposta.ok) {
      await resposta.arrayBuffer();
      // Uma criação concorrente pode vencer a corrida; só aceitamos o bucket se sua configuração coincidir.
      const atualizado = (await listarBuckets()).find((item) => item.id === configuracao.bucket || item.name === configuracao.bucket);
      if (atualizado) {
        const verificado = validarBucketExistente(atualizado, configuracao);
        bucketsConfigurados.set(configuracao.bucket, configuracao);
        return verificado;
      }
      throw new Error(`Não foi possível criar o bucket (HTTP ${resposta.status})`);
    }
    await resposta.arrayBuffer();
    const criado = (await listarBuckets()).find((item) => item.id === configuracao.bucket || item.name === configuracao.bucket);
    const verificado = validarBucketExistente(criado, configuracao);
    bucketsConfigurados.set(configuracao.bucket, configuracao);
    return verificado;
  }

  async function baixarSeExiste(bucket, chave) {
    const resposta = await requisitar(rotaObjeto(bucket, chave));
    if (resposta.status === 404) { await resposta.arrayBuffer(); return null; }
    if (resposta.status === 400) {
      // Supabase Storage pode representar NoSuchKey como HTTP 400 com statusCode 404.
      // Só tratamos essa resposta estruturada como ausência; outros 400 continuam sendo erro.
      let erro;
      try { erro = await resposta.json(); } catch { erro = null; }
      if ((erro?.statusCode === '404' || erro?.statusCode === 404) && erro?.error === 'not_found' && erro?.code === 'NoSuchKey') return null;
      throw new Error('Não foi possível conferir objeto (HTTP 400)');
    }
    if (!resposta.ok) throw new Error(`Não foi possível conferir objeto (HTTP ${resposta.status})`);
    return Buffer.from(await resposta.arrayBuffer());
  }

  function conferirBytes(bytes, item) {
    if (bytes.length !== item.bytes || sha256(bytes) !== item.sha256) throw new Error(`Objeto existente diverge do manifesto: ${item.chave}`);
    return { chave: item.chave, bytes: bytes.length, sha256: item.sha256, estado: 'verificado' };
  }

  async function enviarEVerificar(item) {
    if (!Buffer.isBuffer(item.payload) || item.payload.length !== item.bytes || sha256(item.payload) !== item.sha256) throw new Error(`Payload inválido antes do upload: ${item.chave}`);
    if (item.bytes > LIMITE_UPLOAD_PADRAO_BYTES) throw new Error(`Arquivo acima de 6 MiB requer transporte TUS: ${item.chave}`);
    const bucket = bucketsConfigurados.get(item.bucket);
    const partesChave = /^originais\/([a-f0-9]{64})\.([a-z0-9]+)$/.exec(item.chave ?? '');
    const extensoes = EXTENSOES_POR_MIME[item.mime];
    if (!bucket || !Number.isSafeInteger(item.bytes) || item.bytes > bucket.maxFileSizeBytes || !extensoes?.includes(partesChave?.[2]) || partesChave[1] !== item.sha256 || !bucket.allowedMimeTypes.includes(item.mime)) throw new Error(`Payload fora da configuração verificada do bucket: ${item.chave}`);
    const existente = await baixarSeExiste(item.bucket, item.chave);
    if (existente) return { ...conferirBytes(existente, item), estado: 'existente-verificado' };

    const resposta = await requisitar(rotaObjeto(item.bucket, item.chave), {
      method: 'POST',
      headers: { 'content-type': item.mime, 'cache-control': 'max-age=31536000', 'x-upsert': 'false' },
      body: item.payload,
    });
    if (!resposta.ok) {
      await resposta.arrayBuffer();
      // Confere o destino em caso de colisão concorrente; não sobrescreve o objeto vencedor.
      const corrida = await baixarSeExiste(item.bucket, item.chave);
      if (corrida) return { ...conferirBytes(corrida, item), estado: 'existente-verificado' };
      throw new Error(`Upload de objeto falhou (HTTP ${resposta.status}): ${item.chave}`);
    }
    await resposta.arrayBuffer();
    const enviado = await baixarSeExiste(item.bucket, item.chave);
    if (!enviado) throw new Error(`Objeto não encontrado após upload: ${item.chave}`);
    return { ...conferirBytes(enviado, item), estado: 'enviado-verificado' };
  }

  function urlPublica(bucket, chave) {
    if (!bucketsConfigurados.has(bucket)) throw new Error('Bucket público ainda não foi conferido');
    return `${origem}/storage/v1/object/public/${encodeURIComponent(bucket)}/${chave.split('/').map(encodeURIComponent).join('/')}`;
  }

  return { conferirOuCriarBucket, enviarEVerificar, urlPublica };
}
