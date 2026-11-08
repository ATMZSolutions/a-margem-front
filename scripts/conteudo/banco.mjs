import { createHash } from 'node:crypto';
import pg from 'pg';

const TABELAS = {
  Agenda: ['id', 'titulo', 'data', 'local', 'createdAt', 'cidade'],
  Noticia: ['id', 'titulo', 'conteudo', 'link', 'createdAt'],
  Livro: ['id', 'titulo', 'autor', 'descricao', 'imagem', 'imagemTipo', 'createdAt'],
  Projeto: ['id', 'data', 'descricao'],
  Sobre: ['ano', 'imagem', 'imagemTipo', 'descricao'],
};
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function lerBancoSomenteLeitura(cliente) {
  await cliente.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await cliente.query("SET LOCAL statement_timeout = '30s'");
    await cliente.query("SET LOCAL lock_timeout = '5s'");
    const { rows: colunas } = await cliente.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position");
    for (const [tabela, nomes] of Object.entries(TABELAS)) {
      for (const nome of nomes) if (!colunas.some((coluna) => coluna.table_name === tabela && coluna.column_name === nome)) throw new Error('Schema incompatível');
    }
    const incompatibilidades = [];
    for (const tabela of ['Livro', 'Sobre']) if (colunas.find((coluna) => coluna.table_name === tabela && coluna.column_name === 'imagem').data_type !== 'bytea') incompatibilidades.push(`${tabela}.imagem não é bytea`);
    if (incompatibilidades.length) throw new Error('Coluna de imagem incompatível');
    // Timestamp sem timezone é preservado textualmente, sem conversão para o fuso da máquina.
    const registros = {};
    const midias = [];
    for (const [tabela, nomes] of Object.entries(TABELAS)) {
      const selecao = nomes.map((nome) => {
        const tipo = colunas.find((coluna) => coluna.table_name === tabela && coluna.column_name === nome).data_type;
        return tipo.startsWith('timestamp') ? `"${nome}"::text AS "${nome}"` : `"${nome}"`;
      }).join(', ');
      const chave = tabela === 'Sobre' ? 'ano' : 'id';
      const { rows } = await cliente.query(`SELECT ${selecao} FROM public."${tabela}" ORDER BY "${chave}"`);
      registros[tabela] = rows.map((registro) => {
        const { imagem, ...dados } = registro;
        if (imagem != null) {
          if (!Buffer.isBuffer(imagem)) throw new Error('Blob inválido');
          const digest = sha256(imagem);
          midias.push({ chaveOrigem: `banco:${tabela}:${registro[chave]}:imagem`, tabela, registro: registro[chave], sha256: digest, bytes: imagem.length, mimeDeclarado: registro.imagemTipo, base64: imagem.toString('base64') });
          dados.imagemSha256 = digest;
        }
        return { chaveOrigem: `banco:${tabela}:${registro[chave]}`, ...dados };
      });
    }
    const { rows: existencia } = await cliente.query("SELECT to_regclass('public._prisma_migrations')::text AS tabela");
    const migracoes = existencia[0]?.tabela ? (await cliente.query('SELECT migration_name, checksum, finished_at::text, rolled_back_at::text, applied_steps_count FROM public._prisma_migrations ORDER BY started_at, migration_name')).rows : [];
    // Nenhuma transação é confirmada, mesmo após sucesso.
    return { historicoPresente: Boolean(existencia[0]?.tabela), estado: 'snapshot-somente-leitura', colunas: colunas.filter((coluna) => Object.hasOwn(TABELAS, coluna.table_name)), registros, midias, migracoes, pendencias: ['Comparar histórico/schema real com migrações locais', 'Confirmar identidade do destino e revisão publicada'] };
  } finally {
    await cliente.query('ROLLBACK');
  }
}

export async function conectarELerBanco(url, criarCliente = (configuracao) => new pg.Client(configuracao), leitor = lerBancoSomenteLeitura) {
  if (!url) throw new Error('Defina ORIGEM_DATABASE_URL para a leitura explícita da origem');
  let endereco;
  try { endereco = new URL(url); } catch { throw new Error('ORIGEM_DATABASE_URL inválida'); }
  if (!['postgres:', 'postgresql:'].includes(endereco.protocol)) throw new Error('Origem deve ser PostgreSQL');
  const sslmode = endereco.searchParams.get('sslmode');
  const supabaseHost = endereco.hostname.endsWith('.supabase.co') || endereco.hostname.endsWith('.pooler.supabase.com');
  const configuracao = {
    connectionString: url,
    connectionTimeoutMillis: 10000,
    application_name: 'amargem-inventario-somente-leitura',
    options: '-c default_transaction_read_only=on',
  };
  if (sslmode === 'disable') configuracao.ssl = false;
  else if (sslmode === 'require' || (!sslmode && supabaseHost) || (sslmode === 'prefer' && supabaseHost)) {
    // The node-postgres URL parser does not consistently translate libpq's sslmode.
    // Require TLS explicitly for Supabase, without logging or changing credentials.
    endereco.searchParams.delete('sslmode');
    configuracao.connectionString = endereco.toString();
    configuracao.ssl = { rejectUnauthorized: false };
  } else if (sslmode && !['prefer', 'verify-ca', 'verify-full'].includes(sslmode)) {
    throw new Error('sslmode da origem inválido');
  }
  const cliente = criarCliente(configuracao);
  try {
    await cliente.connect();
    const snapshot = await leitor(cliente);
    return { ...snapshot, identidadeOrigemSha256: sha256(`${endereco.host}${endereco.pathname}`) };
  } catch {
    // Erros do driver podem incluir parâmetros/host. Não imprimir credenciais nem SQL/dados.
    throw new Error('Falha na leitura da origem. Verifique acesso, conexão e compatibilidade do schema; nenhuma gravação foi solicitada.');
  } finally { await cliente.end(); }
}


export function conferirHistorico(banco, migracoesLocais) {
  const problemas = [];
  if (!banco.historicoPresente || !banco.migracoes.length) problemas.push('Origem sem histórico Prisma aplicado: baseline precisa de reconciliação antes de deploy');
  const locais = new Map(migracoesLocais.map((item) => [item.nome, item.sha256]));
  for (const migracao of banco.migracoes) {
    if (!locais.has(migracao.migration_name)) problemas.push(`Migração remota sem arquivo local: ${migracao.migration_name}`);
    else if (locais.get(migracao.migration_name) !== migracao.checksum) problemas.push(`Checksum divergente: ${migracao.migration_name}`);
    if (!migracao.finished_at && !migracao.rolled_back_at) problemas.push(`Migração incompleta: ${migracao.migration_name}`);
  }
  return { problemas, locaisPendentes: migracoesLocais.filter((item) => !banco.migracoes.some((remota) => remota.migration_name === item.nome && remota.finished_at && !remota.rolled_back_at)).map((item) => item.nome) };
}
