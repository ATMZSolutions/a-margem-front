import { createHash } from 'node:crypto';
import { decidirImportacao } from './migracao.mjs';
import { hashRegistro } from './hashes.mjs';

const VERSAO_IMPORTADOR = 1;
const sha256 = (valor) => createHash('sha256').update(valor).digest('hex');

export { hashRegistro };

function chaveRegistro(modelo, registro) {
  if (registro.chaveOrigem) return `${modelo}:${registro.chaveOrigem}`;
  if (modelo === 'Midia') return `Midia:sha256:${registro.sha256}`;
  if (modelo === 'ConfiguracaoSite') return `ConfiguracaoSite:${registro.chave}`;
  if (modelo === 'PaginaSite') return `PaginaSite:${registro.caminho}`;
  if (modelo === 'SecaoHome') return `SecaoHome:${registro.chave}`;
  if (modelo === 'AliasURL') return `AliasURL:${registro.origem}`;
  if (registro.id) return `${modelo}:id:${registro.id}`;
  throw new Error(`Registro sem chave de origem: ${modelo}`);
}

function registrosDoPlano(documentos, legados) {
  const ordem = [
    'Midia', 'ConfiguracaoSite', 'CanalContato', 'ItemMenu', 'AliasURL', 'PaginaSite', 'SecaoHome', 'MarcoHistorico',
    'Integrante', 'Espetaculo', 'Premio', 'SecaoEspetaculo', 'Galeria', 'FotoGaleria', 'UsoMidia',
  ];
  const origem = {
    Midia: documentos.midias,
    ConfiguracaoSite: documentos.configuracoes,
    CanalContato: documentos.canaisContato,
    ItemMenu: documentos.itensMenu,
    AliasURL: documentos.aliases,
    PaginaSite: documentos.paginasSite,
    SecaoHome: documentos.secoesHome,
    MarcoHistorico: documentos.marcosHistoricos,
    Integrante: documentos.integrantes,
    Espetaculo: documentos.espetaculos,
    Premio: documentos.premios,
    SecaoEspetaculo: documentos.secoesEspetaculo,
    Galeria: documentos.galerias,
    FotoGaleria: documentos.fotosGaleria,
    UsoMidia: documentos.usosMidia,
  };
  const projetados = ordem.flatMap((modelo) => {
    const registros = origem[modelo] ?? [];
    if (!Array.isArray(registros)) throw new Error(`Coleção inválida no plano: ${modelo}`);
    return registros.map((registro) => ({ modelo, registro, chaveOrigem: chaveRegistro(modelo, registro), hashFonte: hashRegistro(registro) }));
  });
  return [
    ...projetados,
    ...legados.map((registro) => ({ modelo: registro.tabela, registro, chaveOrigem: `${registro.tabela}:${registro.chaveOrigem}`, hashFonte: registro.hashFonte })),
  ];
}

function exigirContrato(repository, storage) {
  for (const metodo of [
    'verificarPermissoes', 'iniciarOuRetomarExecucao', 'atualizarEstadoExecucao', 'obterItem', 'gravarItem', 'ajustarSequenciasLegadas',
    'obterUltimoItemVerificado', 'buscarDestino', 'gravarDestino',
  ]) {
    if (typeof repository?.[metodo] !== 'function') throw new Error(`Repositório de importação incompleto: ${metodo}`);
  }
  if (typeof storage?.conferirOuCriarBucket !== 'function' || typeof storage?.enviarEVerificar !== 'function') throw new Error('Adaptador Storage incompleto');
}

function validarEntrada(preparado, contexto) {
  const producaoConfirmada = contexto.ambiente === 'producao' && contexto.confirmacaoProducao === true;
  if (contexto.ambiente !== 'staging' && !producaoConfirmada) throw new Error('Executor habilitado para staging; produção exige confirmação explícita do executor dedicado');
  if (typeof contexto.destinoRef !== 'string' || !/^[A-Za-z0-9_-]{3,64}$/.test(contexto.destinoRef)) throw new Error('Identificador explícito do projeto de destino obrigatório');
  if (!['mesmo-banco', 'bancos-separados'].includes(contexto.topologia)) throw new Error('Topologia explícita obrigatória: mesmo-banco ou bancos-separados');
  for (const nome of ['manifestoSha256', 'origemSha256']) if (!/^[a-f0-9]{64}$/.test(contexto[nome] ?? '')) throw new Error(`${nome} inválido`);
  if (typeof contexto.commitOrigem !== 'string' || !/^[a-f0-9]{7,64}$/.test(contexto.commitOrigem)) throw new Error('Commit de origem inválido');
  if (!preparado?.documentos || !Array.isArray(preparado.payloads) || !Array.isArray(preparado.registrosLegados)) throw new Error('Preparação da importação inválida');
  if (!contexto.bucketConfig || contexto.bucketConfig.bucket !== preparado.resumo.bucket) throw new Error('Bucket explícito não corresponde ao plano');
  const mimes = new Set(contexto.bucketConfig.allowedMimeTypes ?? []);
  const limite = contexto.bucketConfig.maxFileSizeBytes;
  if (!Number.isSafeInteger(limite) || preparado.payloads.some((item) => item.bytes > limite || !mimes.has(item.mime))) throw new Error('Bucket não cobre formatos/tamanhos do plano');
}

function falhaDeConflito(chave) {
  const erro = new Error(`Destino alterado desde a última importação: ${chave}`);
  erro.code = 'CONFLITO_DESTINO';
  return erro;
}

function validarMarcadorImportado(marcador, chave) {
  if (!marcador) return;
  if (!/^[a-f0-9]{64}$/.test(marcador.hashFonte ?? '') || !/^[a-f0-9]{64}$/.test(marcador.hashDestinoImportado ?? '')) {
    throw new Error(`Marcador de importação inválido: ${chave}`);
  }
}

export async function executarImportacao(preparado, contexto) {
  validarEntrada(preparado, contexto);
  exigirContrato(contexto.repository, contexto.storage);
  const { repository, storage } = contexto;
  const acesso = await repository.verificarPermissoes();
  if (!acesso?.apto) throw new Error('Pré-verificação do destino não autorizou gravações');
  const destinoSha256 = sha256(contexto.destinoRef);
  const execucaoId = `exec_${sha256(`${contexto.ambiente}:${contexto.destinoRef}:${contexto.manifestoSha256}:${VERSAO_IMPORTADOR}`).slice(0, 48)}`;
  const execucao = {
    id: execucaoId,
    ambiente: contexto.ambiente,
    origemSha256: contexto.origemSha256,
    destinoSha256,
    manifestoSha256: contexto.manifestoSha256,
    versaoImportador: VERSAO_IMPORTADOR,
    commitOrigem: contexto.commitOrigem,
    estado: 'PENDENTE',
  };
  const retomada = await repository.iniciarOuRetomarExecucao(execucao);
  for (const campo of ['ambiente', 'origemSha256', 'destinoSha256', 'manifestoSha256', 'versaoImportador', 'commitOrigem']) {
    if (retomada[campo] !== execucao[campo]) throw new Error('Execução existente não corresponde ao manifesto/destino');
  }

  try {
    await storage.conferirOuCriarBucket(contexto.bucketConfig, { allowCreate: contexto.allowCreateBucket === true });
  } catch (erro) {
    await repository.atualizarEstadoExecucao(execucaoId, 'ERRO');
    throw new Error(`Execução ${execucaoId} não pôde confirmar o bucket de destino.`, { cause: erro });
  }
  const payloadPorHash = new Map(preparado.payloads.map((item) => [item.sha256, item]));
  const registros = registrosDoPlano(preparado.documentos, preparado.registrosLegados);
  const conclusao = { verificados: 0, criados: 0, atualizados: 0, ignorados: 0 };

  for (const item of registros) {
    const chaveItem = item.chaveOrigem;
    let estadoItem = await repository.obterItem(execucaoId, chaveItem);
    const salvarEstado = async (estado, adicionais = {}) => {
      const destinoId = adicionais.destinoId ?? estadoItem?.destinoId ?? null;
      estadoItem = {
        id: `item_${sha256(`${execucaoId}:${chaveItem}`).slice(0, 48)}`,
        execucaoId,
        chaveOrigem: chaveItem,
        dominio: item.modelo,
        destinoId: destinoId == null ? null : String(destinoId),
        hashFonte: item.hashFonte,
        hashDestinoImportado: adicionais.hashDestinoImportado ?? estadoItem?.hashDestinoImportado ?? null,
        estado,
        erroCodigo: adicionais.erroCodigo ?? null,
      };
      await repository.gravarItem(estadoItem);
    };

    try {
      if (!estadoItem) await salvarEstado('PENDENTE');
      if (item.modelo === 'Midia') {
        const payload = payloadPorHash.get(item.registro.sha256);
        if (!payload) throw new Error(`Payload de mídia ausente: ${item.registro.sha256}`);
        await storage.enviarEVerificar(payload);
        await salvarEstado('ENVIADO');
      }

      const marcador = await repository.obterUltimoItemVerificado(destinoSha256, chaveItem);
      validarMarcadorImportado(marcador, chaveItem);
      const destino = await repository.buscarDestino(item.modelo, item.chaveOrigem, item.registro);
      let operacao;

      // Reconhece a gravação feita antes de uma interrupção, sem duplicá-la.
      if (destino?.hash === item.hashFonte) operacao = 'ignorar';
      else if (!marcador && !destino) operacao = 'criar';
      else if (!marcador || !destino) throw falhaDeConflito(chaveItem);
      else {
        operacao = decidirImportacao(item.hashFonte, {
          hashFonteImportada: marcador.hashFonte,
          hashDestinoImportado: marcador.hashDestinoImportado,
          hashDestinoAtual: destino.hash,
        });
        if (operacao === 'conflito') throw falhaDeConflito(chaveItem);
      }

      let gravado = destino;
      if (operacao === 'criar' || operacao === 'atualizar') {
        await salvarEstado('VINCULADO', { destinoId: destino?.id ?? estadoItem?.destinoId ?? null });
        gravado = await repository.gravarDestino(item.modelo, item.chaveOrigem, item.registro, operacao, {
          hashDestinoEsperado: destino?.hash ?? null,
          hashFonteEsperado: item.hashFonte,
        });
      }
      if (!gravado || gravado.hash !== item.hashFonte) throw new Error(`Hash do destino diverge após persistência: ${chaveItem}`);
      await salvarEstado('VERIFICADO', { destinoId: gravado.id, hashDestinoImportado: gravado.hash });
      conclusao.verificados++;
      conclusao[operacao === 'atualizar' ? 'atualizados' : operacao === 'criar' ? 'criados' : 'ignorados']++;
    } catch (erro) {
      const estadoFalha = erro.code === 'CONFLITO_DESTINO' ? 'CONFLITO' : 'ERRO';
      await salvarEstado(estadoFalha, { erroCodigo: estadoFalha === 'CONFLITO' ? 'CONFLITO_DESTINO' : 'ERRO_IMPORTACAO' });
      await repository.atualizarEstadoExecucao(execucaoId, estadoFalha);
      throw new Error(`Execução ${execucaoId} interrompida em ${chaveItem}; estado ${estadoFalha}.`, { cause: erro });
    }
  }

  if (contexto.topologia === 'bancos-separados') {
    try {
      await repository.ajustarSequenciasLegadas({ confirmarDestinoDiferente: true });
    } catch (erro) {
      await repository.atualizarEstadoExecucao(execucaoId, 'ERRO');
      throw new Error(`Execução ${execucaoId} falhou ao ajustar sequences após a cópia dos IDs legados.`, { cause: erro });
    }
  }
  await repository.atualizarEstadoExecucao(execucaoId, 'VERIFICADO');
  return { execucaoId, ...conclusao, sequenciasAjustadas: contexto.topologia === 'bancos-separados', gravacoesRemotas: 'delegadas-aos-adaptadores-injetados' };
}
