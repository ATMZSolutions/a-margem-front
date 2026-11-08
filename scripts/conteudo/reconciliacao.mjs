import { createHash } from 'node:crypto';

export const TABELAS_LEGADAS = ['Agenda', 'Livro', 'Noticia', 'Projeto', 'Sobre'];
const digest = (valor) => createHash('sha256').update(valor).digest('hex');
const identificar = (nome) => `"${nome.replaceAll('"', '""')}"`;

export async function lerCatalogoSomenteLeitura(cliente) {
  await cliente.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await cliente.query("SET LOCAL statement_timeout = '30s'");
    const { rows: tabelas } = await cliente.query(`SELECT c.relname AS tabela, c.relkind AS tipo, c.relrowsecurity AS rls,
      c.relforcerowsecurity AS forcar_rls, pg_get_userbyid(c.relowner) AS proprietario, c.relacl::text AS acl FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f') ORDER BY c.relname`);
    const { rows: colunas } = await cliente.query(`SELECT c.relname AS tabela, a.attname AS coluna, a.attnum AS ordem,
      format_type(a.atttypid, a.atttypmod) AS tipo, a.attnotnull AS obrigatoria,
      pg_get_expr(d.adbin, d.adrelid) AS padrao, a.attidentity AS identidade, a.attgenerated AS gerada,
      coll.collname AS collation, pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) AS sequencia
      FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      LEFT JOIN pg_collation coll ON coll.oid = a.attcollation
      WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum`);
    const { rows: constraints } = await cliente.query(`SELECT c.relname AS tabela, con.conname AS nome, con.contype AS tipo,
      pg_get_constraintdef(con.oid, true) AS definicao, con.convalidated AS validada
      FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' ORDER BY c.relname, con.conname`);
    const { rows: indices } = await cliente.query(`SELECT tablename AS tabela, indexname AS nome, indexdef AS definicao
      FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`);
    const { rows: sequencias } = await cliente.query(`SELECT sequencename AS nome, data_type AS tipo, start_value::text AS inicio,
      min_value::text AS minimo, max_value::text AS maximo, increment_by::text AS incremento, cycle AS ciclo, cache_size::text AS cache
      FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename`);
    const { rows: politicas } = await cliente.query(`SELECT tablename AS tabela, policyname AS nome, permissive, roles, cmd, qual, with_check
      FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname`);
    const { rows: gatilhos } = await cliente.query(`SELECT c.relname AS tabela, t.tgname AS nome, pg_get_triggerdef(t.oid, true) AS definicao
      FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND NOT t.tgisinternal ORDER BY c.relname, t.tgname`);
    const { rows: permissoes } = await cliente.query(`SELECT table_name AS tabela, grantee AS papel, privilege_type AS privilegio
      FROM information_schema.role_table_grants WHERE table_schema = 'public' ORDER BY table_name, grantee, privilege_type`);
    const { rows: permissoesPadrao } = await cliente.query(`SELECT pg_get_userbyid(d.defaclrole) AS papel, d.defaclobjtype AS tipo, d.defaclacl::text AS acl FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace WHERE n.nspname = 'public' OR d.defaclnamespace = 0 ORDER BY papel, tipo, acl`);
    const { rows: historico } = await cliente.query("SELECT to_regclass('public._prisma_migrations')::text AS tabela");
    const migracoes = historico[0]?.tabela ? (await cliente.query('SELECT migration_name, checksum, finished_at::text, rolled_back_at::text FROM public._prisma_migrations ORDER BY migration_name')).rows : [];
    return { estado: 'catalogo-somente-leitura', tabelas, colunas, constraints, indices, sequencias, politicas, gatilhos, permissoes, permissoesPadrao, historicoPresente: Boolean(historico[0]?.tabela), migracoes };
  } finally { await cliente.query('ROLLBACK'); }
}

// Gerador restrito às estruturas inspecionadas deste projeto; desconhecidos bloqueiam o baseline.
export function prepararBaseline(catalogo) {
  const problemas = [];
  const tabelas = catalogo.tabelas.filter((item) => TABELAS_LEGADAS.includes(item.tabela));
  if (tabelas.length !== TABELAS_LEGADAS.length) problemas.push('Conjunto de tabelas legadas incompleto');
  if (catalogo.historicoPresente) problemas.push('Histórico remoto presente: não substituir por baseline sem conciliar migrações aplicadas');
  if (tabelas.some((item) => item.tipo !== 'r')) problemas.push('Tabela particionada/externa não suportada pelo gerador');
  const colunas = catalogo.colunas.filter((item) => TABELAS_LEGADAS.includes(item.tabela));
  const tipos = /^(integer|text|bytea|timestamp(?:\([0-6]\))? (?:with|without) time zone)$/;
  for (const coluna of colunas) {
    if (!tipos.test(coluna.tipo) || coluna.identidade || coluna.gerada || (coluna.collation && coluna.collation !== 'default')) problemas.push(`Coluna não suportada: ${coluna.tabela}.${coluna.coluna}`);
    if (coluna.padrao && coluna.padrao !== 'now()' && coluna.padrao !== 'CURRENT_TIMESTAMP' && !/^nextval\('[\w".]+'::regclass\)$/.test(coluna.padrao)) problemas.push(`Default não suportado: ${coluna.tabela}.${coluna.coluna}`);
  }
  const constraints = catalogo.constraints.filter((item) => TABELAS_LEGADAS.includes(item.tabela));
  if (constraints.some((item) => item.tipo !== 'p' || !item.validada)) problemas.push('Constraint adicional exige revisão do gerador');
  const indices = catalogo.indices.filter((item) => TABELAS_LEGADAS.includes(item.tabela));
  if (indices.some((item) => !constraints.some((constraint) => constraint.tabela === item.tabela && constraint.nome === item.nome))) problemas.push('Índice adicional exige revisão do baseline');
  if (catalogo.politicas.some((item) => TABELAS_LEGADAS.includes(item.tabela))) problemas.push('Políticas RLS customizadas exigem revisão do baseline');
  if (catalogo.gatilhos.some((item) => TABELAS_LEGADAS.includes(item.tabela))) problemas.push('Gatilho customizado exige revisão do baseline');
  const sequenciasUsadas = [];
  for (const coluna of colunas.filter((item) => item.sequencia)) {
    const nome = coluna.sequencia.replace(/^public\./, '').replaceAll('"', '');
    const sequencia = catalogo.sequencias.find((item) => item.nome === nome);
    if (nome !== `${coluna.tabela}_${coluna.coluna}_seq`) problemas.push(`Nome de sequência customizado: ${nome}`);
    if (!sequencia || sequencia.tipo !== 'integer' || sequencia.inicio !== '1' || sequencia.minimo !== '1' || sequencia.maximo !== '2147483647' || sequencia.incremento !== '1' || sequencia.ciclo || sequencia.cache !== '1') problemas.push(`Sequência não padrão: ${nome}`);
    if (coluna.padrao !== `nextval('"${nome}"'::regclass)` && coluna.padrao !== `nextval('${nome}'::regclass)`) problemas.push(`Default/ownership da sequência exige revisão: ${nome}`);
    sequenciasUsadas.push(nome);
  }
  if (colunas.some((item) => item.padrao?.startsWith('nextval') && !item.sequencia)) problemas.push('Sequência sem ownership de coluna');
  if (problemas.length) return { problemas, sql: null, schema: null };
  const linhas = ['-- Baseline do estado legado observado. Criar somente em banco vazio.', '-- No banco existente: registrar como aplicado futuramente; NÃO executar este SQL.', '-- RLS reproduzido do catálogo; permissões por papel são inventariadas separadamente.', ''];
  const modelos = ['generator client {\n  provider = "prisma-client-js"\n}\n', 'datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n'];
  for (const tabela of tabelas) {
    const campos = colunas.filter((item) => item.tabela === tabela.tabela);
    const pks = constraints.filter((item) => item.tabela === tabela.tabela);
    if (pks.length !== 1 || !/^PRIMARY KEY \("?\w+"?\)$/.test(pks[0].definicao)) throw new Error(`Chave primária não suportada: ${tabela.tabela}`);
    linhas.push(`CREATE TABLE public.${identificar(tabela.tabela)} (`);
    linhas.push([...campos.map((coluna) => `    ${identificar(coluna.coluna)} ${coluna.sequencia ? 'SERIAL' : coluna.tipo.toUpperCase()}${coluna.obrigatoria ? ' NOT NULL' : ''}${coluna.padrao && !coluna.sequencia ? ` DEFAULT ${coluna.padrao}` : ''}`), ...pks.map((pk) => `    CONSTRAINT ${identificar(pk.nome)} ${pk.definicao}`)].join(',\n'));
    linhas.push(');');
    if (tabela.rls) linhas.push(`ALTER TABLE public.${identificar(tabela.tabela)} ENABLE ROW LEVEL SECURITY;`);
    if (tabela.forcar_rls) linhas.push(`ALTER TABLE public.${identificar(tabela.tabela)} FORCE ROW LEVEL SECURITY;`);
    linhas.push('');
    const modelo = tabela.tabela === 'Livro' ? 'Book' : tabela.tabela;
    const pkCampo = pks[0].definicao.match(/^PRIMARY KEY \("?(\w+)"?\)$/)[1];
    const camposPrisma = campos.map((coluna) => {
      let tipo = coluna.tipo === 'integer' ? 'Int' : coluna.tipo === 'text' ? 'String' : coluna.tipo === 'bytea' ? 'Bytes' : 'DateTime';
      if (!coluna.obrigatoria) tipo += '?';
      const precisao = coluna.tipo.match(/\((\d)\)/)?.[1] ?? '6';
      const nativo = coluna.tipo.startsWith('timestamp') ? ` @db.${coluna.tipo.includes('without') ? 'Timestamp' : 'Timestamptz'}(${precisao})` : '';
      return `  ${coluna.coluna} ${tipo}${coluna.coluna === pkCampo ? ` @id${pks[0].nome !== `${tabela.tabela}_pkey` ? `(map: "${pks[0].nome}")` : ''}` : ''}${coluna.sequencia ? ' @default(autoincrement())' : coluna.padrao ? ' @default(now())' : ''}${nativo}`;
    });
    modelos.push(`model ${modelo} {\n${camposPrisma.join('\n')}\n${modelo !== tabela.tabela ? `\n  @@map("${tabela.tabela}")\n` : ''}}\n`);
  }
  const sql = `${linhas.join('\n').trimEnd()}\n`;
  const schema = `${modelos.join('\n')}\n`;
  return { problemas: [], sql, schema, sha256: digest(sql), sequenciasUsadas, foraDoEscopo: catalogo.tabelas.filter((item) => !TABELAS_LEGADAS.includes(item.tabela)).map((item) => item.tabela) };
}
