import { describe, expect, it, vi } from 'vitest';
import { conectarELerBanco, lerBancoSomenteLeitura, conferirHistorico } from './banco.mjs';

function clienteDeTeste() {
  const estrutura = { Agenda: ['id', 'titulo', 'data', 'local', 'createdAt', 'cidade'], Noticia: ['id', 'titulo', 'conteudo', 'link', 'createdAt'], Livro: ['id', 'titulo', 'autor', 'descricao', 'imagem', 'imagemTipo', 'createdAt'], Projeto: ['id', 'data', 'descricao'], Sobre: ['ano', 'imagem', 'imagemTipo', 'descricao'] };
  const colunas = Object.entries(estrutura).flatMap(([table_name, nomes]) => nomes.map((column_name) => ({ table_name, column_name, data_type: column_name === 'imagem' ? 'bytea' : column_name === 'data' ? 'timestamp without time zone' : 'text' })));
  const query = vi.fn(async (sql) => {
    if (sql.includes('information_schema')) return { rows: colunas };
    if (sql.includes('to_regclass')) return { rows: [{ tabela: '_prisma_migrations' }] };
    if (sql.includes('FROM public._prisma_migrations')) return { rows: [{ migration_name: 'inicial', checksum: 'abc' }] };
    if (sql.includes('FROM public."Livro"')) return { rows: [{ id: 7, titulo: 'Obra', imagem: Buffer.from('bytes originais'), imagemTipo: 'image/png' }] };
    if (sql.includes('FROM public."Sobre"')) return { rows: [{ ano: 2023, descricao: 'Memória', imagem: null }] };
    if (sql.includes('FROM public."Agenda"')) return { rows: [{ id: 9, data: '2024-01-01 12:00:00' }] };
    return { rows: [] };
  });
  return { query, connect: vi.fn(), end: vi.fn(), colunas };
}

describe('snapshot do banco sem gravação', () => {
  it('usa snapshot consistente, preserva blobs/datas e sempre faz rollback', async () => {
    const cliente = clienteDeTeste();
    const resultado = await lerBancoSomenteLeitura(cliente);
    expect(cliente.query.mock.calls[0][0]).toBe('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    expect(cliente.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
    expect(cliente.query.mock.calls.some(([sql]) => /\b(COMMIT|INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/.test(sql))).toBe(false);
    expect(resultado.midias[0].base64).toBe(Buffer.from('bytes originais').toString('base64'));
    expect(resultado.registros.Livro[0].imagem).toBeUndefined();
    expect(resultado.registros.Livro[0].imagemSha256).toBe(resultado.midias[0].sha256);
    expect(resultado.registros.Sobre[0].chaveOrigem).toBe('banco:Sobre:2023');
    expect(resultado.registros.Agenda[0].data).toBe('2024-01-01 12:00:00');
    expect(cliente.query.mock.calls.some(([sql]) => sql.includes('"data"::text'))).toBe(true);
  });
  it('aborta schema incompatível e reverte mesmo com erro', async () => {
    const cliente = clienteDeTeste();
    cliente.colunas.pop();
    await expect(lerBancoSomenteLeitura(cliente)).rejects.toThrow('Schema incompatível');
    expect(cliente.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
  });
  it('bloqueia imagem textual herdada em vez de tratá-la como blob', async () => {
    const cliente = clienteDeTeste();
    cliente.colunas.find((item) => item.table_name === 'Livro' && item.column_name === 'imagem').data_type = 'text';
    await expect(lerBancoSomenteLeitura(cliente)).rejects.toThrow('Coluna de imagem incompatível');
  });
  it('força readonly na conexão e não vaza credenciais nos erros', async () => {
    const cliente = clienteDeTeste();
    const fabrica = vi.fn(() => cliente);
    const resultado = await conectarELerBanco('postgres://usuario:segredo@localhost/banco', fabrica);
    expect(fabrica.mock.calls[0][0].options).toBe('-c default_transaction_read_only=on');
    expect(fabrica.mock.calls[0][0].ssl).toBeUndefined();
    expect(resultado.identidadeOrigemSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(cliente.end).toHaveBeenCalledOnce();
    cliente.connect.mockRejectedValueOnce(new Error('segredo'));
    await expect(conectarELerBanco('postgres://usuario:segredo@localhost/banco', fabrica)).rejects.toThrow('Falha na leitura da origem');
    await expect(conectarELerBanco()).rejects.toThrow('Defina ORIGEM_DATABASE_URL');
    await expect(conectarELerBanco('https://example.com')).rejects.toThrow('PostgreSQL');
  });

  it('exige TLS para Supabase e respeita explicitamente sslmode=disable', async () => {
    const cliente = clienteDeTeste();
    const fabrica = vi.fn(() => cliente);
    await conectarELerBanco('postgres://usuario:segredo@aws-1-us-east-2.pooler.supabase.com:5432/postgres', fabrica);
    expect(fabrica.mock.calls[0][0].ssl).toEqual({ rejectUnauthorized: false });
    expect(new URL(fabrica.mock.calls[0][0].connectionString).searchParams.has('sslmode')).toBe(false);

    const semTls = vi.fn(() => clienteDeTeste());
    await conectarELerBanco('postgres://usuario:segredo@localhost/banco?sslmode=disable', semTls);
    expect(semTls.mock.calls[0][0].ssl).toBe(false);
  });
});


it('reconcilia histórico local/remoto e bloqueia baseline ausente ou checksum divergente', () => {
  expect(conferirHistorico({ historicoPresente: false, migracoes: [] }, [{ nome: 'nova', sha256: 'a' }]).problemas[0]).toContain('baseline');
  const resultado = conferirHistorico({ historicoPresente: true, migracoes: [{ migration_name: 'inicial', checksum: 'alterado', finished_at: null }, { migration_name: 'remota', checksum: 'a', finished_at: 'ontem' }] }, [{ nome: 'inicial', sha256: 'a' }]);
  expect(resultado.problemas).toHaveLength(3);
  expect(resultado.locaisPendentes).toEqual(['inicial']);
});
