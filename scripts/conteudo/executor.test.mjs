import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { executarImportacao, hashRegistro } from './executor.mjs';

const hash = (valor) => createHash('sha256').update(valor).digest('hex');
const bucketConfig = { bucket: 'site-publico', maxFileSizeBytes: 1024, allowedMimeTypes: ['image/png'] };

function preparado(texto = 'texto inicial') {
  const bytes = Buffer.from('payload de imagem');
  const digest = hash(bytes);
  const midia = {
    id: `midia_${digest}`,
    bucket: bucketConfig.bucket,
    chave: `originais/${digest}.png`,
    sha256: digest,
    mime: 'image/png',
    bytes: bytes.length,
    largura: 1,
    altura: 1,
  };
  return {
    documentos: {
      midias: [midia],
      configuracoes: [{ chave: 'pagina:home', versao: 1, dados: { texto } }],
    },
    registrosLegados: [],
    payloads: [{ ...midia, payload: bytes }],
    resumo: { bucket: bucketConfig.bucket },
  };
}

function criarAdaptadoresFalsos({ falharUmaGravacao = false, idDestinoNumerico = false } = {}) {
  const execucoes = new Map();
  const itens = new Map();
  const destinos = new Map();
  const ultimosVerificados = new Map();
  const objetosStorage = new Map();
  const chamadasStorage = { conferirBucket: 0, upload: 0 };
  let sequenciasAjustadas = 0;
  let falhaPendente = falharUmaGravacao;
  const chaveDestino = (modelo, origem) => `${modelo}:${origem}`;
  const repository = {
    async verificarPermissoes() { return { apto: true }; },
    async iniciarOuRetomarExecucao(execucao) {
      if (!execucoes.has(execucao.id)) execucoes.set(execucao.id, { ...execucao });
      return execucoes.get(execucao.id);
    },
    async atualizarEstadoExecucao(id, estado) {
      execucoes.set(id, { ...execucoes.get(id), estado });
    },
    async ajustarSequenciasLegadas({ confirmarDestinoDiferente }) {
      if (!confirmarDestinoDiferente) throw new Error('confirmação ausente');
      sequenciasAjustadas++;
      return [];
    },
    async obterItem(execucaoId, chaveOrigem) {
      return itens.get(`${execucaoId}:${chaveOrigem}`) ?? null;
    },
    async gravarItem(item) {
      itens.set(`${item.execucaoId}:${item.chaveOrigem}`, { ...item });
      if (item.estado === 'VERIFICADO') {
        const execucao = execucoes.get(item.execucaoId);
        ultimosVerificados.set(`${execucao.destinoSha256}:${item.chaveOrigem}`, {
          hashFonte: item.hashFonte,
          hashDestinoImportado: item.hashDestinoImportado,
          destinoId: item.destinoId,
        });
      }
    },
    async obterUltimoItemVerificado(destinoSha256, chaveOrigem) {
      return ultimosVerificados.get(`${destinoSha256}:${chaveOrigem}`) ?? null;
    },
    async buscarDestino(modelo, chaveOrigem) {
      return destinos.get(chaveDestino(modelo, chaveOrigem)) ?? null;
    },
    async gravarDestino(modelo, chaveOrigem, registro, operacao) {
      if (falhaPendente && modelo === 'ConfiguracaoSite') {
        falhaPendente = false;
        throw new Error('falha simulada antes da persistência');
      }
      const chave = chaveDestino(modelo, chaveOrigem);
      const atual = destinos.get(chave);
      const gravado = {
        id: idDestinoNumerico && modelo === 'Agenda' ? 1 : registro.id ?? atual?.id ?? `id-${chave}`,
        hash: modelo === 'Agenda' ? registro.hashFonte : hashRegistro(registro),
        registro: structuredClone(registro),
        operacao,
      };
      destinos.set(chave, gravado);
      return gravado;
    },
  };
  const storage = {
    async conferirOuCriarBucket(config, { allowCreate }) {
      chamadasStorage.conferirBucket++;
      if (config.bucket !== bucketConfig.bucket || !allowCreate) throw new Error('configuração falsa inesperada');
      return { id: config.bucket, public: true };
    },
    async enviarEVerificar(item) {
      const chave = `${item.bucket}:${item.chave}`;
      const existente = objetosStorage.get(chave);
      if (existente && hash(existente) !== item.sha256) throw new Error('objeto falso divergente');
      if (!existente) {
        objetosStorage.set(chave, Buffer.from(item.payload));
        chamadasStorage.upload++;
      }
      return { estado: existente ? 'existente-verificado' : 'enviado-verificado', sha256: item.sha256 };
    },
  };
  return { repository, storage, execucoes, itens, destinos, objetosStorage, chamadasStorage, get sequenciasAjustadas() { return sequenciasAjustadas; } };
}

function contexto(adaptadores, manifestoSha256) {
  return {
    ambiente: 'staging',
    destinoRef: 'projeto-staging-123',
    topologia: 'mesmo-banco',
    manifestoSha256,
    origemSha256: 'a'.repeat(64),
    commitOrigem: 'abcdef1234567',
    bucketConfig,
    allowCreateBucket: true,
    ...adaptadores,
  };
}

describe('orquestrador de importação isolado', () => {
  it('cria e verifica itens, e uma repetição idêntica reaproveita banco e Storage', async () => {
    const adaptadores = criarAdaptadoresFalsos();
    const plano = preparado();
    const ctx = contexto(adaptadores, '1'.repeat(64));

    const primeira = await executarImportacao(plano, ctx);
    expect(primeira).toMatchObject({ verificados: 2, criados: 2, ignorados: 0, gravacoesRemotas: 'delegadas-aos-adaptadores-injetados' });
    const segunda = await executarImportacao(plano, ctx);
    expect(segunda).toMatchObject({ verificados: 2, criados: 0, ignorados: 2 });
    expect(adaptadores.chamadasStorage.upload).toBe(1);
    expect([...adaptadores.execucoes.values()][0].estado).toBe('VERIFICADO');
  });

  it('atualiza conteúdo novo somente quando o destino ainda corresponde à importação anterior', async () => {
    const adaptadores = criarAdaptadoresFalsos();
    await executarImportacao(preparado('versão 1'), contexto(adaptadores, '2'.repeat(64)));

    const resultado = await executarImportacao(preparado('versão 2'), contexto(adaptadores, '3'.repeat(64)));
    expect(resultado).toMatchObject({ verificados: 2, atualizados: 1, ignorados: 1 });
    const destino = adaptadores.destinos.get('ConfiguracaoSite:ConfiguracaoSite:pagina:home');
    expect(destino.registro.dados.texto).toBe('versão 2');
    expect(destino.operacao).toBe('atualizar');
  });

  it('marca conflito se alguém editou o destino depois da importação anterior', async () => {
    const adaptadores = criarAdaptadoresFalsos();
    await executarImportacao(preparado('versão 1'), contexto(adaptadores, '4'.repeat(64)));
    const chave = 'ConfiguracaoSite:ConfiguracaoSite:pagina:home';
    const destinoAnterior = adaptadores.destinos.get(chave);
    adaptadores.destinos.set(chave, { ...destinoAnterior, hash: 'f'.repeat(64), registro: { dados: { texto: 'edição externa' } } });

    await expect(executarImportacao(preparado('versão 2'), contexto(adaptadores, '5'.repeat(64))))
      .rejects.toThrow(/estado CONFLITO/);
    expect(adaptadores.destinos.get(chave).registro.dados.texto).toBe('edição externa');
    expect([...adaptadores.execucoes.values()].at(-1).estado).toBe('CONFLITO');
  });

  it('retoma após falha entre upload e gravação, sem reenviar bytes', async () => {
    const adaptadores = criarAdaptadoresFalsos({ falharUmaGravacao: true });
    const plano = preparado();
    const ctx = contexto(adaptadores, '6'.repeat(64));

    await expect(executarImportacao(plano, ctx)).rejects.toThrow(/estado ERRO/);
    expect(adaptadores.chamadasStorage.upload).toBe(1);
    const retomada = await executarImportacao(plano, ctx);
    expect(retomada).toMatchObject({ verificados: 2, criados: 1, ignorados: 1 });
    expect(adaptadores.chamadasStorage.upload).toBe(1);
    expect([...adaptadores.execucoes.values()][0].estado).toBe('VERIFICADO');
  });

  it('armazena identificadores legados numéricos como texto no marcador de importação', async () => {
    const adaptadores = criarAdaptadoresFalsos({ idDestinoNumerico: true });
    const plano = preparado();
    plano.registrosLegados = [{
      tabela: 'Agenda', chaveOrigem: 'banco:Agenda:1', chavePrimaria: 1,
      dados: { id: 1 }, hashFonte: 'b'.repeat(64),
    }];

    const resultado = await executarImportacao(plano, contexto(adaptadores, '8'.repeat(64)));
    const itemAgenda = [...adaptadores.itens.values()].find((item) => item.chaveOrigem === 'Agenda:banco:Agenda:1');

    expect(resultado.verificados).toBe(3);
    expect(itemAgenda).toMatchObject({ estado: 'VERIFICADO', destinoId: '1' });
  });

  it('recusa outros ambientes antes de consultar os adaptadores', async () => {
    const adaptadores = criarAdaptadoresFalsos();
    await expect(executarImportacao(preparado(), { ...contexto(adaptadores, '7'.repeat(64)), ambiente: 'producao' }))
      .rejects.toThrow('somente para staging');
    expect(adaptadores.chamadasStorage.conferirBucket).toBe(0);
    expect(adaptadores.execucoes.size).toBe(0);
  });
});
