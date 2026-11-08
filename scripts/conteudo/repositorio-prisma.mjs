import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Prisma } from '@prisma/client';
import { hashRegistro, hashRegistroLegado } from './hashes.mjs';

const MODELOS = {
  Midia: { delegate: 'midia', campos: ['id', 'bucket', 'chave', 'sha256', 'mime', 'bytes', 'largura', 'altura', 'nomeOriginal', 'origem'], onde: (r) => ({ OR: [{ id: r.id }, { bucket: r.bucket, chave: r.chave }] }) },
  UsoMidia: { delegate: 'usoMidia', campos: ['id', 'chaveOrigem', 'midiaId', 'dominio', 'registro', 'campo', 'ordem', 'textoAlternativo', 'legenda', 'credito', 'dataEditorial'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }] }) },
  ConfiguracaoSite: { delegate: 'configuracaoSite', campos: ['chave', 'versao', 'dados'], onde: (r) => ({ chave: r.chave }) },
  CanalContato: { delegate: 'canalContato', campos: ['id', 'chaveOrigem', 'tipo', 'rotulo', 'url', 'ordem', 'ativo'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }] }) },
  ItemMenu: { delegate: 'itemMenu', campos: ['id', 'chaveOrigem', 'rotulo', 'destino', 'ordem', 'ativo'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }] }) },
  Integrante: { delegate: 'integrante', campos: ['id', 'chaveOrigem', 'slug', 'nome', 'fichaTecnica', 'biografia', 'fotoId', 'ordem', 'estado', 'seo'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }, { slug: r.slug }] }) },
  Espetaculo: { delegate: 'espetaculo', campos: ['id', 'chaveOrigem', 'slug', 'titulo', 'lancamento', 'estreia', 'localEstreia', 'corFundo', 'capaId', 'ordem', 'estado', 'seo'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }, { slug: r.slug }] }) },
  SecaoEspetaculo: { delegate: 'secaoEspetaculo', campos: ['id', 'espetaculoId', 'titulo', 'texto', 'ordem'], onde: (r) => ({ OR: [{ id: r.id }, { espetaculoId: r.espetaculoId, ordem: r.ordem }] }) },
  Premio: { delegate: 'premio', campos: ['id', 'chaveOrigem', 'slug', 'titulo', 'ano', 'evento', 'descricao', 'fotoId', 'ordem', 'estado', 'seo'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }, { AND: [{ slug: r.slug }, { ano: r.ano }] }] }) },
  Galeria: { delegate: 'galeria', campos: ['id', 'chaveOrigem', 'titulo', 'espetaculoId'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }] }) },
  FotoGaleria: { delegate: 'fotoGaleria', campos: ['id', 'chaveOrigem', 'galeriaId', 'midiaId', 'ordem', 'textoAlternativo', 'legenda', 'credito', 'dataEditorial'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }, { galeriaId: r.galeriaId, ordem: r.ordem }] }) },
  PaginaSite: { delegate: 'paginaSite', campos: ['id', 'caminho', 'versao', 'configuracao', 'estado', 'seo'], onde: (r) => ({ OR: [{ id: r.id }, { caminho: r.caminho }] }) },
  SecaoHome: { delegate: 'secaoHome', campos: ['id', 'chave', 'tipo', 'ordem', 'ativa', 'versao', 'configuracao'], onde: (r) => ({ OR: [{ id: r.id }, { chave: r.chave }] }) },
  MarcoHistorico: { delegate: 'marcoHistorico', campos: ['id', 'chaveOrigem', 'ano', 'descricao', 'anoLegado', 'ordem', 'estado'], onde: (r) => ({ OR: [{ id: r.id }, { chaveOrigem: r.chaveOrigem }, { anoLegado: r.anoLegado }] }) },
  AliasURL: { delegate: 'aliasURL', campos: ['origem', 'destino', 'permanente'], onde: (r) => ({ origem: r.origem }) },
};

const LEGADOS = {
  Agenda: {
    chave: 'id',
    colunas: [
      ['id', 'integer'], ['titulo', 'text'], ['data', 'timestamptz'], ['local', 'text'], ['createdAt', 'timestamptz'], ['cidade', 'text'],
    ],
  },
  Noticia: {
    chave: 'id',
    colunas: [['id', 'integer'], ['titulo', 'text'], ['conteudo', 'text'], ['link', 'text'], ['createdAt', 'timestamp']],
  },
  Livro: {
    chave: 'id',
    colunas: [['id', 'integer'], ['titulo', 'text'], ['autor', 'text'], ['descricao', 'text'], ['imagem', 'bytea'], ['imagemTipo', 'text'], ['createdAt', 'timestamp']],
  },
  Projeto: {
    chave: 'id',
    colunas: [['id', 'integer'], ['data', 'timestamp'], ['descricao', 'text']],
  },
  Sobre: {
    chave: 'ano',
    colunas: [['ano', 'integer'], ['imagem', 'bytea'], ['imagemTipo', 'text'], ['descricao', 'text']],
  },
};

const SEQUENCIAS = ['Agenda', 'Noticia', 'Livro', 'Projeto'];
const JSON_NULOS = new Set(['Integrante.seo', 'Espetaculo.seo', 'Premio.seo', 'PaginaSite.seo']);
const TABELAS_DA_IMPORTACAO = [
  'Agenda', 'Noticia', 'Livro', 'Projeto', 'Sobre', 'Midia', 'UsoMidia', 'ConfiguracaoSite', 'CanalContato',
  'ItemMenu', 'Integrante', 'Espetaculo', 'SecaoEspetaculo', 'Premio', 'Galeria', 'FotoGaleria', 'PaginaSite',
  'SecaoHome', 'MarcoHistorico', 'AliasURL', 'ExecucaoImportacao', 'ItemImportacao',
];
const MIGRACOES_NECESSARIAS = ['0_base_legada', '20261108020000_estrutura_conteudo_migracao'];

export async function checksumsMigracoesNecessarias() {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../prisma/migrations');
  return Promise.all(MIGRACOES_NECESSARIAS.map(async (nome) => {
    const sql = await readFile(path.join(raiz, nome, 'migration.sql'));
    return { nome, checksum: createHash('sha256').update(sql).digest('hex') };
  }));
}

function exigirDelegate(cliente, nome) {
  const delegate = cliente?.[nome];
  if (!delegate || typeof delegate.findFirst !== 'function' || typeof delegate.create !== 'function' || typeof delegate.update !== 'function') {
    throw new Error(`Delegate Prisma ausente ou incompleto: ${nome}`);
  }
  return delegate;
}

function projetar(registro, campos) {
  return Object.fromEntries(campos.map((campo) => {
    if (!Object.hasOwn(registro, campo)) throw new Error(`Campo de DTO ausente: ${campo}`);
    return [campo, registro[campo]];
  }));
}

function prepararJsonNulo(modelo, dados) {
  const preparados = { ...dados };
  for (const campo of ['seo']) if (JSON_NULOS.has(`${modelo}.${campo}`) && preparados[campo] === null) preparados[campo] = Prisma.DbNull;
  return preparados;
}

function ondeAtual(modelo, linha) {
  if (modelo === 'ConfiguracaoSite') return { chave: linha.chave };
  if (modelo === 'AliasURL') return { origem: linha.origem };
  return { id: linha.id };
}

function erroConflito(chave) {
  const erro = new Error(`Destino mudou durante a gravação: ${chave}`);
  erro.code = 'CONFLITO_DESTINO';
  return erro;
}

function definirTimestampSql(coluna, tipo, indice) {
  const base = `$${indice}`;
  if (tipo === 'timestamp') return `${base}::timestamp`;
  if (tipo === 'timestamptz') return `${base}::timestamptz`;
  if (tipo === 'bytea') return `${base}::bytea`;
  if (tipo === 'integer') return `${base}::integer`;
  if (tipo === 'text') return `${base}::text`;
  throw new Error(`Tipo legado sem conversor SQL: ${coluna}`);
}

function consultaLegada(modelo, registro) {
  const esquema = LEGADOS[modelo];
  if (!esquema) throw new Error(`Modelo legado não permitido: ${modelo}`);
  const tabela = `public."${modelo}"`;
  const chaveOrigem = registro.chaveOrigem;
  const seletor = esquema.colunas.map(([nome, tipo]) => tipo === 'timestamp' || tipo === 'timestamptz'
    ? `"${nome}"::text AS "${nome}"`
    : `"${nome}"`).join(', ');
  return { esquema, tabela, chaveOrigem, seletor };
}

async function encontrarLegado(cliente, modelo, registro) {
  const { esquema, tabela, chaveOrigem, seletor } = consultaLegada(modelo, registro);
  if (typeof cliente.$queryRawUnsafe !== 'function') throw new Error('Cliente Prisma precisa oferecer $queryRawUnsafe para leitura tipada legada');
  const linhas = await cliente.$queryRawUnsafe(`SELECT ${seletor} FROM ${tabela} WHERE "${esquema.chave}" = $1 LIMIT 1`, registro.chavePrimaria);
  const linha = linhas[0];
  if (!linha) return null;
  const dados = Object.fromEntries(esquema.colunas.map(([nome]) => [nome, linha[nome]]));
  return { id: linha[esquema.chave], hash: hashRegistroLegado(modelo, chaveOrigem, dados), linha, dados };
}

async function destinoAtual(cliente, modelo, chaveOrigem, registro) {
  if (LEGADOS[modelo]) return encontrarLegado(cliente, modelo, registro);
  const esquema = MODELOS[modelo];
  if (!esquema) throw new Error(`Modelo de destino não permitido: ${modelo}`);
  const delegate = exigirDelegate(cliente, esquema.delegate);
  const linha = await delegate.findFirst({ where: esquema.onde(registro) });
  if (!linha) return null;
  return {
    id: linha.id ?? linha.chave ?? linha.origem ?? linha.ano,
    hash: hashRegistro(projetar(linha, esquema.campos)),
    linha,
  };
}

async function gravarLegado(cliente, modelo, chaveOrigem, registro, operacao, opcoes) {
  const { esquema, tabela } = consultaLegada(modelo, registro);
  const colunas = esquema.colunas;
  const dados = registro.dados;
  for (const [nome] of colunas) if (!Object.hasOwn(dados, nome)) throw new Error(`Campo legado ausente: ${modelo}.${nome}`);
  const hashFonte = hashRegistroLegado(modelo, registro.chaveOrigem, dados);
  if (hashFonte !== opcoes.hashFonteEsperado) throw new Error(`Hash legado do plano diverge: ${chaveOrigem}`);
  if (typeof cliente.$executeRawUnsafe !== 'function') throw new Error('Cliente Prisma precisa oferecer $executeRawUnsafe para cópia legada');
  if (typeof cliente.$queryRawUnsafe !== 'function') throw new Error('Cliente Prisma precisa oferecer $queryRawUnsafe para leitura tipada legada');

  await cliente.$queryRawUnsafe(`SELECT "${esquema.chave}" FROM ${tabela} WHERE "${esquema.chave}" = $1 FOR UPDATE`, registro.chavePrimaria);
  const anterior = await encontrarLegado(cliente, modelo, registro);
  if (anterior?.hash === hashFonte) return { id: anterior.id, hash: anterior.hash };
  if (operacao === 'criar' && anterior) throw erroConflito(chaveOrigem);
  if (operacao === 'atualizar' && (!anterior || anterior.hash !== opcoes.hashDestinoEsperado)) throw erroConflito(chaveOrigem);

  const valores = colunas.map(([nome]) => dados[nome]);
  const placeholders = colunas.map(([nome, tipo], indice) => definirTimestampSql(nome, tipo, indice + 1));
  const conflito = esquema.chave;
  const atualizacoes = colunas.filter(([nome]) => nome !== conflito).map(([nome]) => `"${nome}" = EXCLUDED."${nome}"`).join(', ');
  const sql = `INSERT INTO ${tabela} (${colunas.map(([nome]) => `"${nome}"`).join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT ("${conflito}") DO ${operacao === 'atualizar' ? `UPDATE SET ${atualizacoes}` : 'NOTHING'}`;
  const parametros = operacao === 'criar' ? valores : [...valores];
  await cliente.$executeRawUnsafe(sql, ...parametros);
  const gravado = await encontrarLegado(cliente, modelo, registro);
  if (!gravado || gravado.hash !== hashFonte) throw erroConflito(chaveOrigem);
  return { id: gravado.id, hash: gravado.hash };
}

export function criarRepositorioPrisma(prisma) {
  if (typeof prisma?.execucaoImportacao?.upsert !== 'function' || typeof prisma.execucaoImportacao.update !== 'function') throw new Error('Delegate Prisma ausente ou incompleto: execucaoImportacao');
  if (typeof prisma?.itemImportacao?.findUnique !== 'function' || typeof prisma.itemImportacao.findFirst !== 'function' || typeof prisma.itemImportacao.upsert !== 'function') throw new Error('Delegate Prisma ausente ou incompleto: itemImportacao');
  if (typeof prisma.$transaction !== 'function') throw new Error('Cliente Prisma precisa oferecer transações interativas');
  if (typeof prisma.$queryRawUnsafe !== 'function') throw new Error('Cliente Prisma precisa oferecer $queryRawUnsafe para pré-verificação');

  return {
    async verificarPermissoes() {
      const tabelas = await prisma.$queryRawUnsafe(`
        SELECT c.relname AS tabela,
          has_table_privilege(current_user, c.oid, 'SELECT') AS pode_ler,
          has_table_privilege(current_user, c.oid, 'INSERT') AS pode_inserir,
          has_table_privilege(current_user, c.oid, 'UPDATE') AS pode_atualizar,
          (NOT c.relrowsecurity OR papel.rolsuper OR papel.rolbypassrls OR (c.relowner = papel.oid AND NOT c.relforcerowsecurity)) AS ignora_rls
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_roles papel ON papel.rolname = current_user
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname = ANY($1::text[])
      `, TABELAS_DA_IMPORTACAO);
      const porNome = new Map(tabelas.map((item) => [item.tabela, item]));
      const ausentes = TABELAS_DA_IMPORTACAO.filter((nome) => !porNome.has(nome));
      const semPermissao = TABELAS_DA_IMPORTACAO.filter((nome) => {
        const item = porNome.get(nome);
        return item && (!item.pode_ler || !item.pode_inserir || !item.pode_atualizar || !item.ignora_rls);
      });
      if (ausentes.length || semPermissao.length) throw new Error('Acesso PostgreSQL insuficiente para a importação; confira schema, grants e RLS do destino');
      const sequencias = await prisma.$queryRawUnsafe(`
        SELECT t.tabela,
          pg_get_serial_sequence(format('public.%I', t.tabela), 'id') AS sequencia,
          COALESCE(has_sequence_privilege(current_user, pg_get_serial_sequence(format('public.%I', t.tabela), 'id'), 'USAGE'), FALSE) AS pode_usar,
          COALESCE(has_sequence_privilege(current_user, pg_get_serial_sequence(format('public.%I', t.tabela), 'id'), 'UPDATE'), FALSE) AS pode_ajustar
        FROM unnest($1::text[]) AS t(tabela)
      `, SEQUENCIAS);
      const sequenciasPorNome = new Map(sequencias.map((item) => [item.tabela, item]));
      const semPermissaoDeSequencia = SEQUENCIAS.filter((nome) => {
        const item = sequenciasPorNome.get(nome);
        return !item?.sequencia || !item.pode_usar || !item.pode_ajustar;
      });
      if (semPermissaoDeSequencia.length) throw new Error('Acesso PostgreSQL insuficiente às sequences legadas; confira grants USAGE e UPDATE do destino');
      let historico;
      try {
        historico = await prisma.$queryRawUnsafe(
          'SELECT migration_name, checksum, finished_at, rolled_back_at FROM public."_prisma_migrations" WHERE migration_name = ANY($1::text[])',
          MIGRACOES_NECESSARIAS,
        );
      } catch {
        throw new Error('Histórico Prisma do destino ausente ou ilegível; registre/aplique o baseline e a migração editorial antes da importação');
      }
      const checksums = await checksumsMigracoesNecessarias();
      const divergencias = checksums.filter((esperada) => {
        const aplicada = historico.find((item) => item.migration_name === esperada.nome);
        return !aplicada || aplicada.checksum !== esperada.checksum || !aplicada.finished_at || aplicada.rolled_back_at;
      });
      if (divergencias.length) throw new Error(`Histórico Prisma do destino incompleto ou divergente: ${divergencias.map((item) => item.nome).join(', ')}`);
      return { apto: true, tabelasConferidas: TABELAS_DA_IMPORTACAO.length };
    },

    iniciarOuRetomarExecucao(execucao) {
      return prisma.execucaoImportacao.upsert({ where: { id: execucao.id }, create: execucao, update: {} });
    },

    async atualizarEstadoExecucao(id, estado) {
      const dados = { estado };
      if (estado === 'VERIFICADO') dados.concluidoEm = new Date();
      return prisma.execucaoImportacao.update({ where: { id }, data: dados });
    },

    obterItem(execucaoId, chaveOrigem) {
      return prisma.itemImportacao.findUnique({ where: { execucaoId_chaveOrigem: { execucaoId, chaveOrigem } } });
    },

    gravarItem(item) {
      const { execucaoId, chaveOrigem } = item;
      const atualizaveis = { ...item };
      delete atualizaveis.id;
      delete atualizaveis.execucaoId;
      delete atualizaveis.chaveOrigem;
      return prisma.itemImportacao.upsert({
        where: { execucaoId_chaveOrigem: { execucaoId, chaveOrigem } },
        create: item,
        update: atualizaveis,
      });
    },

    async obterUltimoItemVerificado(destinoSha256, chaveOrigem) {
      return prisma.itemImportacao.findFirst({
        where: { estado: 'VERIFICADO', chaveOrigem, execucao: { is: { destinoSha256 } } },
        orderBy: [{ execucao: { iniciadoEm: 'desc' } }, { atualizadoEm: 'desc' }, { id: 'desc' }],
        select: { hashFonte: true, hashDestinoImportado: true, destinoId: true },
      });
    },

    ajustarSequenciasLegadas() {
      return ajustarSequenciasLegadas(prisma, { confirmarDestinoDiferente: true });
    },

    buscarDestino(modelo, chaveOrigem, registro) {
      return destinoAtual(prisma, modelo, chaveOrigem, registro);
    },

    async gravarDestino(modelo, chaveOrigem, registro, operacao, opcoes) {
      return prisma.$transaction(async (transacao) => {
        if (LEGADOS[modelo]) return gravarLegado(transacao, modelo, chaveOrigem, registro, operacao, opcoes);
        const esquema = MODELOS[modelo];
        if (!esquema) throw new Error(`Modelo de destino não permitido: ${modelo}`);
        const delegate = exigirDelegate(transacao, esquema.delegate);
        const dadosFonte = projetar(registro, esquema.campos);
        const hashFonte = hashRegistro(dadosFonte);
        if (hashFonte !== opcoes.hashFonteEsperado) throw new Error(`Hash do DTO diverge do plano: ${chaveOrigem}`);
        const atual = await destinoAtual(transacao, modelo, chaveOrigem, registro);
        if (atual?.hash === hashFonte) return { id: atual.id, hash: atual.hash };
        if (operacao === 'criar' && atual) throw erroConflito(chaveOrigem);
        if (operacao === 'atualizar' && (!atual || atual.hash !== opcoes.hashDestinoEsperado)) throw erroConflito(chaveOrigem);

        const dados = prepararJsonNulo(modelo, dadosFonte);
        const where = atual ? ondeAtual(modelo, atual.linha) : ondeAtual(modelo, dadosFonte);
        if (atual && Object.hasOwn(dados, 'id') && dados.id !== atual.linha.id) throw erroConflito(chaveOrigem);
        if (operacao === 'criar') await delegate.create({ data: dados });
        else await delegate.update({ where, data: dados });
        const gravado = await destinoAtual(transacao, modelo, chaveOrigem, registro);
        if (!gravado || gravado.hash !== hashFonte) throw new Error(`Verificação do destino divergiu: ${chaveOrigem}`);
        return { id: gravado.id, hash: gravado.hash };
      }, { isolationLevel: 'Serializable' });
    },
  };
}

/** Reposiciona sequences depois da cópia integral de IDs a partir de um banco diferente. */
export async function ajustarSequenciasLegadas(prisma, { confirmarDestinoDiferente = false } = {}) {
  if (confirmarDestinoDiferente !== true) throw new Error('Confirme explicitamente que os registros vieram de outro banco');
  if (typeof prisma?.$transaction !== 'function') throw new Error('Cliente Prisma precisa oferecer transações interativas');
  return prisma.$transaction(async (transacao) => {
    if (typeof transacao.$queryRawUnsafe !== 'function') throw new Error('Cliente Prisma precisa oferecer $queryRawUnsafe');
    const resultados = [];
    for (const tabela of SEQUENCIAS) {
      const relacao = `public."${tabela}"`;
      const chave = await transacao.$queryRawUnsafe(`SELECT pg_get_serial_sequence('${relacao}', 'id') AS sequencia`);
      const sequencia = chave[0]?.sequencia;
      if (typeof sequencia !== 'string' || !sequencia) throw new Error(`Sequence serial não encontrada: ${tabela}.id`);
      await transacao.$queryRawUnsafe(`SELECT setval($1::regclass, GREATEST(COALESCE(MAX("id"), 1), 1), COUNT(*) > 0) FROM ${relacao}`, sequencia);
      resultados.push({ tabela, chave: 'id', ajustada: true });
    }
    return resultados;
  }, { isolationLevel: 'Serializable' });
}
