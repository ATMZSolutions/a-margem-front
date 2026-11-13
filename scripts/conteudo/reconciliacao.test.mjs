import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { prepararBaseline, lerCatalogoSomenteLeitura } from './reconciliacao.mjs';

const catalogo = JSON.parse(await readFile(new URL('./amostras/catalogo-legado.json', import.meta.url), 'utf8'));

describe('baseline do estado legado', () => {
  it('reproduz o catálogo observado, incluindo datas, blobs e RLS, sem SQL destrutivo', async () => {
    const resultado = prepararBaseline(catalogo);
    expect(resultado.problemas).toEqual([]);
    expect(resultado.sql).toBe(await readFile('prisma/migrations/0_base_legada/migration.sql', 'utf8'));
    expect(resultado.sql.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(5);
    expect(resultado.sql.match(/CREATE TABLE/g)).toHaveLength(5);
    expect(resultado.sql).toContain('TIMESTAMP(6) WITH TIME ZONE');
    expect(resultado.sql).toContain('"imagem" BYTEA');
    expect(resultado.sql).not.toMatch(/\b(DROP|INSERT|DELETE|TRUNCATE|UPDATE)\b/);
    expect(resultado.schema).toContain('@db.Timestamptz(6)');
    expect(resultado.schema).toContain('@db.Timestamp(3)');
  });
  it('não substitui histórico aplicado e bloqueia colunas ou constraints desconhecidas', () => {
    expect(prepararBaseline({ ...catalogo, historicoPresente: true }).sql).toBeNull();
    const alterado = structuredClone(catalogo);
    alterado.colunas[0].padrao = 'executar_funcao()';
    alterado.constraints[0].tipo = 'c';
    expect(prepararBaseline(alterado).problemas).toHaveLength(3);
  });
  it('rejeita sequências customizadas, índices extras, políticas e gatilhos não representados', () => {
    const alterado = structuredClone(catalogo);
    alterado.sequencias[0].incremento = '2';
    alterado.indices.push({ tabela: 'Agenda', nome: 'outro' });
    alterado.politicas.push({ tabela: 'Livro' });
    alterado.gatilhos.push({ tabela: 'Sobre' });
    expect(prepararBaseline(alterado).problemas).toHaveLength(4);
    expect(prepararBaseline({ ...catalogo, tabelas: [] }).sql).toBeNull();
  });
  it('preserva hashes dos quatro scripts arquivados', async () => {
    const { createHash } = await import('node:crypto');
    const manifesto = JSON.parse(await readFile('prisma/historico-arquivado/manifesto.json', 'utf8'));
    for (const item of manifesto) {
      const bytes = await readFile(`prisma/historico-arquivado/${item.nome}/migration.sql`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256);
    }
  });
  it('mantém RLS nas novas tabelas apesar das permissões padrão herdadas', async () => {
    const sql = await readFile('prisma/migrations/20261108020000_estrutura_conteudo_migracao/migration.sql', 'utf8');
    const tabelas = [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map((item) => item[1]);
    expect(tabelas).toHaveLength(17);
    for (const nome of tabelas) expect(sql).toContain(`ALTER TABLE "${nome}" ENABLE ROW LEVEL SECURITY;`);
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|DISABLE ROW LEVEL SECURITY|CREATE POLICY)\b/);
  });
});

describe('baseline: ramos de bloqueio e geração', () => {
  const clonar = () => structuredClone(catalogo);
  const tabela = (c, nome) => c.tabelas.find((item) => item.tabela === nome);
  it('informa tabelas fora do escopo legado', () => {
    const alterado = clonar();
    alterado.tabelas.push({ tabela: 'Nova', tipo: 'r' });
    expect(prepararBaseline(alterado).foraDoEscopo).toEqual(['Nova']);
  });
  it('bloqueia tabelas que não são relações comuns', () => {
    const alterado = clonar();
    tabela(alterado, 'Agenda').tipo = 'p';
    expect(prepararBaseline(alterado).problemas).toContain('Tabela particionada/externa não suportada pelo gerador');
  });
  it('bloqueia identidade, coluna gerada e collation não padrão, mas aceita collation default ou nula', () => {
    for (const [campo, valor] of [['identidade', 'a'], ['gerada', 's'], ['collation', 'C']]) {
      const alterado = clonar();
      alterado.colunas[1][campo] = valor;
      expect(prepararBaseline(alterado).problemas).toEqual([`Coluna não suportada: Agenda.${alterado.colunas[1].coluna}`]);
    }
    const alterado = clonar();
    alterado.colunas[1].tipo = 'varchar';
    expect(prepararBaseline(alterado).problemas).toHaveLength(1);
  });
  it('bloqueia sequência com nome customizado e default de sequência sem ownership', () => {
    const alterado = clonar();
    alterado.colunas[0].sequencia = 'public."outra_seq"';
    expect(prepararBaseline(alterado).problemas.some((item) => item.startsWith('Nome de sequência customizado'))).toBe(true);
    const semDono = clonar();
    semDono.colunas[0].sequencia = null;
    expect(prepararBaseline(semDono).problemas).toContain('Sequência sem ownership de coluna');
    const padraoSemSequencia = clonar();
    padraoSemSequencia.colunas[1].padrao = null;
    padraoSemSequencia.colunas[1].tabela = 'Agenda';
    expect(prepararBaseline(padraoSemSequencia).problemas).toEqual([]);
  });
  it('rejeita chave primária ausente, composta ou com mais de uma constraint', () => {
    const semPk = clonar();
    semPk.constraints = semPk.constraints.filter((item) => item.tabela !== 'Agenda');
    semPk.indices = semPk.indices.filter((item) => item.tabela !== 'Agenda');
    expect(() => prepararBaseline(semPk)).toThrow('Chave primária não suportada: Agenda');
    const composta = clonar();
    composta.constraints[0].definicao = 'PRIMARY KEY (id, titulo)';
    expect(() => prepararBaseline(composta)).toThrow('Chave primária não suportada: Agenda');
  });
  it('gera RLS opcional/forçado e nome de chave primária customizado', () => {
    const alterado = clonar();
    tabela(alterado, 'Agenda').rls = false;
    tabela(alterado, 'Livro').forcar_rls = true;
    alterado.constraints[0].nome = 'chave_agenda';
    alterado.indices[0].nome = 'chave_agenda';
    const resultado = prepararBaseline(alterado);
    expect(resultado.problemas).toEqual([]);
    expect(resultado.sql).toContain('ALTER TABLE public."Livro" FORCE ROW LEVEL SECURITY;');
    expect(resultado.sql).not.toContain('ALTER TABLE public."Agenda" ENABLE');
    expect(resultado.schema).toContain('@id(map: "chave_agenda")');
  });
});

describe('catálogo somente leitura', () => {
  it('consulta somente metadados e reverte a transação no sucesso e na falha', async () => {
    let historicoTabela = null;
    const query = vi.fn(async (sql) => {
      if (sql.includes('pg_attribute')) return { rows: catalogo.colunas };
      if (sql.includes('pg_constraint con')) return { rows: catalogo.constraints };
      if (sql.includes('pg_indexes')) return { rows: catalogo.indices };
      if (sql.includes('pg_sequences')) return { rows: catalogo.sequencias };
      if (sql.includes('to_regclass')) return { rows: [{ tabela: historicoTabela }] };
      if (sql.includes('migration_name')) return { rows: [{ migration_name: '0_base' }] };
      if (sql.includes('c.relkind IN')) return { rows: catalogo.tabelas };
      return { rows: [] };
    });
    const resultado = await lerCatalogoSomenteLeitura({ query });
    expect(resultado.historicoPresente).toBe(false);
    expect(resultado.colunas).toEqual(catalogo.colunas);
    expect(query.mock.calls[0][0]).toContain('READ ONLY');
    expect(query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
    expect(query.mock.calls.every(([sql]) => /^(SELECT|BEGIN|ROLLBACK|SET LOCAL)\b/.test(sql))).toBe(true);
    historicoTabela = 'public._prisma_migrations';
    const comHistorico = await lerCatalogoSomenteLeitura({ query });
    expect(comHistorico.historicoPresente).toBe(true);
    expect(comHistorico.migracoes).toEqual([{ migration_name: '0_base' }]);
    historicoTabela = null;
    query.mockRejectedValueOnce(new Error('Conexão indisponível'));
    await expect(lerCatalogoSomenteLeitura({ query })).rejects.toThrow('Conexão indisponível');
    query.mockImplementationOnce(async () => ({ rows: [] })).mockRejectedValueOnce(new Error('Falha no catálogo'));
    await expect(lerCatalogoSomenteLeitura({ query })).rejects.toThrow('Falha no catálogo');
    expect(query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
  });
});
