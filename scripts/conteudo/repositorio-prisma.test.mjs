import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { executarImportacao } from './executor.mjs';
import { hashRegistro, hashRegistroLegado } from './hashes.mjs';
import { ajustarSequenciasLegadas, checksumsMigracoesNecessarias, criarRepositorioPrisma } from './repositorio-prisma.mjs';

function corresponde(linha, where) {
  if (where.OR) return where.OR.some((alternativa) => corresponde(linha, alternativa));
  if (where.AND) return where.AND.every((alternativa) => corresponde(linha, alternativa));
  return Object.entries(where).every(([campo, valor]) => {
    if (valor && typeof valor === 'object' && !Array.isArray(valor) && !(valor instanceof Date)) return corresponde(linha, valor);
    return linha[campo] === valor;
  });
}

function clientePrismaFalso() {
  const tabelas = new Map();
  const execucoes = new Map();
  const itens = new Map();
  const transacoes = [];
  const sqls = [];
  const escritasPrisma = [];
  let relogio = 0;
  const tabela = (nome) => {
    if (!tabelas.has(nome)) tabelas.set(nome, new Map());
    return tabelas.get(nome);
  };
  const delegate = (nome, pk = 'id') => ({
    async findFirst({ where }) { return [...tabela(nome).values()].find((linha) => corresponde(linha, where)) ?? null; },
    async findUnique({ where }) {
      if (nome === 'itemImportacao') return itens.get(`${where.execucaoId_chaveOrigem.execucaoId}:${where.execucaoId_chaveOrigem.chaveOrigem}`) ?? null;
      return [...tabela(nome).values()].find((linha) => corresponde(linha, where)) ?? null;
    },
    async create({ data }) {
      const chave = String(data[pk]);
      if (tabela(nome).has(chave)) throw new Error(`unique constraint ${nome}.${pk}`);
      escritasPrisma.push({ modelo: nome, data });
      const dadosBanco = Object.fromEntries(Object.entries(data).map(([campo, valor]) => [campo, valor === Prisma.DbNull ? null : valor]));
      const linha = { ...dadosBanco, atualizadoEm: new Date(++relogio) };
      tabela(nome).set(chave, linha);
      return linha;
    },
    async update({ where, data }) {
      const linha = [...tabela(nome).values()].find((item) => corresponde(item, where));
      if (!linha) throw new Error(`not found ${nome}`);
      escritasPrisma.push({ modelo: nome, data });
      const dadosBanco = Object.fromEntries(Object.entries(data).map(([campo, valor]) => [campo, valor === Prisma.DbNull ? null : valor]));
      const atualizada = { ...linha, ...dadosBanco, atualizadoEm: new Date(++relogio) };
      tabela(nome).set(String(linha[pk]), atualizada);
      return atualizada;
    },
  });

  const execucaoImportacao = {
    async upsert({ where, create, update }) {
      const linha = execucoes.get(where.id);
      if (linha) return { ...linha, ...update };
      const nova = { ...create, iniciadoEm: new Date(++relogio) };
      execucoes.set(where.id, nova);
      return nova;
    },
    async update({ where, data }) {
      const linha = execucoes.get(where.id);
      if (!linha) throw new Error('execução ausente');
      const atualizada = { ...linha, ...data };
      execucoes.set(where.id, atualizada);
      return atualizada;
    },
  };
  const itemImportacao = {
    async findUnique({ where }) { return itens.get(`${where.execucaoId_chaveOrigem.execucaoId}:${where.execucaoId_chaveOrigem.chaveOrigem}`) ?? null; },
    async findFirst({ where, orderBy }) {
      const candidatos = [...itens.values()].filter((item) => {
        const execucao = execucoes.get(item.execucaoId);
        return item.estado === where.estado && item.chaveOrigem === where.chaveOrigem && execucao?.destinoSha256 === where.execucao.is.destinoSha256;
      });
      candidatos.sort((a, b) => execucoes.get(b.execucaoId).iniciadoEm - execucoes.get(a.execucaoId).iniciadoEm);
      void orderBy;
      return candidatos[0] ? { hashFonte: candidatos[0].hashFonte, hashDestinoImportado: candidatos[0].hashDestinoImportado, destinoId: candidatos[0].destinoId } : null;
    },
    async upsert({ where, create, update }) {
      const chave = `${where.execucaoId_chaveOrigem.execucaoId}:${where.execucaoId_chaveOrigem.chaveOrigem}`;
      const anterior = itens.get(chave);
      const linha = { ...(anterior ?? create), ...update, ...(!anterior ? create : {}), atualizadoEm: new Date(++relogio) };
      itens.set(chave, linha);
      return linha;
    },
  };

  const prisma = {
    execucaoImportacao,
    itemImportacao,
    configuracaoSite: delegate('configuracaoSite', 'chave'),
    integrante: delegate('integrante'),
    premio: delegate('premio'),
    async $transaction(callback, options) {
      transacoes.push(options);
      return callback(prisma);
    },
    async $queryRawUnsafe(sql, ...params) {
      sqls.push(sql);
      if (sql.includes('FROM pg_class')) return params[0].map((tabela) => ({ tabela, pode_ler: true, pode_inserir: true, pode_atualizar: true, ignora_rls: true }));
      if (sql.includes('FROM unnest($1::text[]) AS t(tabela)')) return params[0].map((tabela) => ({
        tabela, sequencia: `public.${tabela}_id_seq`, pode_usar: true, pode_ajustar: true,
      }));
      if (sql.includes('FROM public."_prisma_migrations"')) return (await checksumsMigracoesNecessarias())
        .filter((item) => params[0].includes(item.nome))
        .map((item) => ({ migration_name: item.nome, checksum: item.checksum, finished_at: new Date(), rolled_back_at: null }));
      const tabelaSequencia = /pg_get_serial_sequence\('public\."(\w+)"', 'id'\)/.exec(sql)?.[1];
      if (tabelaSequencia) return [{ sequencia: `public."${tabelaSequencia}_id_seq"` }];
      if (sql.includes('SELECT setval')) return [{ setval: true }];
      const identificador = /FROM public\."(\w+)"/.exec(sql)?.[1];
      if (!identificador) return [];
      const definicao = /WHERE "(id|ano)" = \$1/.exec(sql);
      if (!definicao) return [];
      const linha = tabela(identificador).get(String(params[0]));
      return linha ? [{ ...linha }] : [];
    },
    async $executeRawUnsafe(sql, ...params) {
      sqls.push(sql);
      const identificador = /INSERT INTO public\."(\w+)"/.exec(sql)?.[1];
      const colunasTexto = /INSERT INTO public\."\w+" \(([^)]+)\)/.exec(sql)?.[1];
      if (!identificador || !colunasTexto) throw new Error('SQL de insert desconhecido');
      const colunas = [...colunasTexto.matchAll(/"(\w+)"/g)].map((match) => match[1]);
      const linha = Object.fromEntries(colunas.map((coluna, indice) => [coluna, params[indice]]));
      const chave = identificador === 'Sobre' ? 'ano' : 'id';
      const anterior = tabela(identificador).get(String(linha[chave]));
      if (!anterior || sql.includes('DO UPDATE')) tabela(identificador).set(String(linha[chave]), { ...anterior, ...linha });
      return 1;
    },
  };
  return { prisma, tabelas, execucoes, itens, transacoes, sqls, escritasPrisma };
}

const bucketConfig = { bucket: 'site-publico', maxFileSizeBytes: 1024, allowedMimeTypes: ['image/png'] };

function planoConfiguracao(texto) {
  return {
    documentos: { configuracoes: [{ chave: 'home', versao: 1, dados: { texto } }] },
    registrosLegados: [], payloads: [], resumo: { bucket: bucketConfig.bucket },
  };
}

function contexto(repository, manifestoSha256) {
  return {
    repository,
    storage: { async conferirOuCriarBucket() {}, async enviarEVerificar() {} },
    ambiente: 'staging',
    destinoRef: 'projeto-teste-123',
    topologia: 'mesmo-banco',
    manifestoSha256,
    origemSha256: 'a'.repeat(64),
    commitOrigem: 'abcdef1234567',
    bucketConfig,
  };
}

describe('adaptador PostgreSQL/Prisma por cliente injetado', () => {
  it('localiza prêmio pela combinação slug/ano usando filtros escalares do Prisma', async () => {
    const falso = clientePrismaFalso();
    const repository = criarRepositorioPrisma(falso.prisma);
    const premio = {
      id: 'premio-1', chaveOrigem: 'premio:um:2024', slug: 'premio-um', titulo: 'Prêmio Um', ano: '2024',
      evento: 'Evento', descricao: 'Descrição', fotoId: null, ordem: 0, estado: 'PUBLICADO', seo: null,
    };
    falso.tabelas.set('premio', new Map([[premio.id, premio]]));

    expect(await repository.buscarDestino('Premio', 'Premio:premio:um:2024', {
      ...premio, id: 'outro-id', chaveOrigem: 'outra-chave',
    })).toMatchObject({ id: premio.id, hash: hashRegistro(premio) });
  });

  it('retoma estado persistido, atualiza pela versão verificada e detecta alteração concorrente', async () => {
    const falso = clientePrismaFalso();
    const repository = criarRepositorioPrisma(falso.prisma);
    const primeira = await executarImportacao(planoConfiguracao('um'), contexto(repository, '1'.repeat(64)));
    expect(primeira).toMatchObject({ criados: 1, verificados: 1 });
    expect(await executarImportacao(planoConfiguracao('um'), contexto(repository, '1'.repeat(64))))
      .toMatchObject({ ignorados: 1, verificados: 1 });

    expect(await executarImportacao(planoConfiguracao('dois'), contexto(repository, '2'.repeat(64))))
      .toMatchObject({ atualizados: 1, verificados: 1 });
    const linha = falso.tabelas.get('configuracaoSite').get('home');
    expect(linha.dados.texto).toBe('dois');

    falso.tabelas.get('configuracaoSite').set('home', { ...linha, dados: { texto: 'edição concorrente' } });
    await expect(executarImportacao(planoConfiguracao('três'), contexto(repository, '3'.repeat(64))))
      .rejects.toThrow(/estado CONFLITO/);
    expect(falso.tabelas.get('configuracaoSite').get('home').dados.texto).toBe('edição concorrente');
    expect(falso.transacoes.every((opcao) => opcao.isolationLevel === 'Serializable')).toBe(true);
  });

  it('confere a versão lida dentro da transação antes de atualizar', async () => {
    const falso = clientePrismaFalso();
    const repository = criarRepositorioPrisma(falso.prisma);
    const anterior = { chave: 'home', versao: 1, dados: { texto: 'antigo' } };
    falso.tabelas.set('configuracaoSite', new Map([['home', { ...anterior }]]));
    const hashAnterior = hashRegistro(anterior);
    const novo = { chave: 'home', versao: 1, dados: { texto: 'novo' } };
    falso.tabelas.get('configuracaoSite').set('home', { ...anterior, dados: { texto: 'alteração paralela' } });

    await expect(repository.gravarDestino('ConfiguracaoSite', 'ConfiguracaoSite:home', novo, 'atualizar', {
      hashDestinoEsperado: hashAnterior,
      hashFonteEsperado: hashRegistro(novo),
    })).rejects.toMatchObject({ code: 'CONFLITO_DESTINO' });
    expect(falso.tabelas.get('configuracaoSite').get('home').dados.texto).toBe('alteração paralela');
  });

  it('grava null de JSON opcional como SQL NULL do Prisma', async () => {
    const falso = clientePrismaFalso();
    const repository = criarRepositorioPrisma(falso.prisma);
    const registro = {
      id: 'integrante-1', chaveOrigem: 'integrante:1', slug: 'atriz-1', nome: 'Pessoa',
      fichaTecnica: 'Atriz', biografia: 'Biografia', fotoId: null, ordem: 0, estado: 'PUBLICADO', seo: null,
    };
    const resultado = await repository.gravarDestino('Integrante', 'Integrante:integrante:1', registro, 'criar', {
      hashDestinoEsperado: null,
      hashFonteEsperado: hashRegistro(registro),
    });
    expect(resultado.hash).toBe(hashRegistro(registro));
    expect(falso.tabelas.get('integrante').get('integrante-1').seo).toBeNull();
    expect(falso.escritasPrisma.at(-1).data.seo).toBe(Prisma.DbNull);
  });

  it('copia os cinco modelos legados por SQL parametrizado e preserva blobs e timestamps', async () => {
    const falso = clientePrismaFalso();
    const repository = criarRepositorioPrisma(falso.prisma);
    const linhas = [
      ['Agenda', 'banco:Agenda:2', 2, { id: 2, titulo: 'Encontro', data: '2024-01-01 12:00:00+00', local: 'Recife', createdAt: '2023-12-01 10:00:00+00', cidade: 'Recife' }],
      ['Noticia', 'banco:Noticia:3', 3, { id: 3, titulo: 'Nota', conteudo: 'Texto', link: '/nota', createdAt: '2024-02-03 04:05:06.123' }],
      ['Livro', 'banco:Livro:4', 4, { id: 4, titulo: 'Livro', autor: 'Autoria', descricao: 'Resumo', imagem: Buffer.from('capa'), imagemTipo: 'image/png', createdAt: '2024-02-03 04:05:06.123' }],
      ['Projeto', 'banco:Projeto:5', 5, { id: 5, data: '2024-02-03 04:05:06.123', descricao: 'Projeto antigo' }],
      ['Sobre', 'banco:Sobre:2024', 2024, { ano: 2024, imagem: Buffer.from('foto'), imagemTipo: 'image/jpeg', descricao: 'Trajetória' }],
    ];

    for (const [tabela, chaveOrigem, chavePrimaria, dados] of linhas) {
      const registro = { tabela, chaveOrigem, chavePrimaria, dados, hashFonte: hashRegistroLegado(tabela, chaveOrigem, dados), imagemSha256: null };
      const gravado = await repository.gravarDestino(tabela, `${tabela}:${chaveOrigem}`, registro, 'criar', {
        hashDestinoEsperado: null,
        hashFonteEsperado: registro.hashFonte,
      });
      expect(gravado.hash).toBe(registro.hashFonte);
      expect(falso.tabelas.get(tabela).get(String(chavePrimaria))).toMatchObject(dados);
    }
    expect(falso.sqls.filter((sql) => sql.startsWith('INSERT INTO'))).toHaveLength(5);
    expect(falso.sqls.every((sql) => !sql.includes('capa') && !sql.includes('Encontro'))).toBe(true);
  });

  it('normaliza o instante com fuso sem perder microssegundos e preserva timestamp de parede', () => {
    const utc = { data: '2024-01-01 12:00:00.123456+00' };
    const recife = { data: '2024-01-01 09:00:00.123456-03' };
    expect(hashRegistroLegado('Agenda', 'banco:Agenda:1', utc)).toBe(hashRegistroLegado('Agenda', 'banco:Agenda:1', recife));
    expect(hashRegistroLegado('Projeto', 'banco:Projeto:1', { data: '2024-01-01 12:00:00.123' }))
      .not.toBe(hashRegistroLegado('Projeto', 'banco:Projeto:1', { data: '2024-01-01 09:00:00.123' }));
  });

  it('só ajusta sequences depois de confirmação explícita de cópia entre bancos', async () => {
    const falso = clientePrismaFalso();
    await expect(ajustarSequenciasLegadas(falso.prisma)).rejects.toThrow('Confirme explicitamente');
    expect(falso.sqls).toHaveLength(0);
    expect(await ajustarSequenciasLegadas(falso.prisma, { confirmarDestinoDiferente: true })).toHaveLength(4);
    expect(falso.sqls.filter((sql) => sql.includes('SELECT setval'))).toHaveLength(4);
  });

  it('bloqueia a execução quando uma tabela não permite escrita ou bypass de RLS', async () => {
    const falso = clientePrismaFalso();
    const queryOriginal = falso.prisma.$queryRawUnsafe;
    falso.prisma.$queryRawUnsafe = async (sql, ...params) => {
      if (sql.includes('FROM pg_class')) return params[0].map((tabela) => ({
        tabela, pode_ler: true, pode_inserir: tabela !== 'CanalContato', pode_atualizar: true, ignora_rls: true,
      }));
      return queryOriginal(sql, ...params);
    };
    const repository = criarRepositorioPrisma(falso.prisma);

    await expect(repository.verificarPermissoes()).rejects.toThrow('grants e RLS');
    expect(falso.execucoes.size).toBe(0);
  });

  it('bloqueia a execução quando faltam USAGE ou UPDATE nas sequences legadas', async () => {
    const falso = clientePrismaFalso();
    const queryOriginal = falso.prisma.$queryRawUnsafe;
    falso.prisma.$queryRawUnsafe = async (sql, ...params) => {
      if (sql.includes('FROM unnest($1::text[]) AS t(tabela)')) return params[0].map((tabela) => ({
        tabela, sequencia: `public.${tabela}_id_seq`, pode_usar: true, pode_ajustar: tabela !== 'Agenda',
      }));
      return queryOriginal(sql, ...params);
    };
    const repository = criarRepositorioPrisma(falso.prisma);

    await expect(repository.verificarPermissoes()).rejects.toThrow('sequences legadas');
    expect(falso.execucoes.size).toBe(0);
  });

  it('bloqueia gravações se o baseline ou a migração editorial não estiverem registrados com checksum local', async () => {
    const falso = clientePrismaFalso();
    const queryOriginal = falso.prisma.$queryRawUnsafe;
    falso.prisma.$queryRawUnsafe = async (sql, ...params) => {
      if (sql.includes('FROM public."_prisma_migrations"')) return [{
        migration_name: '0_base_legada', checksum: 'f'.repeat(64), finished_at: new Date(), rolled_back_at: null,
      }];
      return queryOriginal(sql, ...params);
    };
    const repository = criarRepositorioPrisma(falso.prisma);

    await expect(repository.verificarPermissoes()).rejects.toThrow('Histórico Prisma do destino incompleto ou divergente');
    expect(falso.execucoes.size).toBe(0);
  });
});
