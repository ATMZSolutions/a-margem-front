import { loadEnvFile } from 'node:process';
import { parseArgs } from 'node:util';
import { mkdir, writeFile, chmod, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conectarELerBanco } from './banco.mjs';
import { lerCatalogoSomenteLeitura, prepararBaseline } from './reconciliacao.mjs';

async function executar() {
  const { values } = parseArgs({ options: { 'usar-banco-atual': { type: 'boolean' }, saida: { type: 'string' } } });
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  for (const nome of ['.env.local', '.env']) {
    try { loadEnvFile(path.join(raiz, nome)); } catch (erro) { if (erro.code !== 'ENOENT') throw new Error('Falha ao carregar configuração local'); }
  }
  const catalogo = await conectarELerBanco(values['usar-banco-atual'] ? process.env.DATABASE_URL : process.env.ORIGEM_DATABASE_URL, undefined, lerCatalogoSomenteLeitura);
  const baseline = prepararBaseline(catalogo);
  if (!baseline.problemas.length) {
    const versionado = await readFile(path.join(raiz, 'prisma/migrations/0_base_legada/migration.sql'), 'utf8');
    const normalizarFim = (sql) => sql.replace(/(?:\r?\n)+$/, '');
    baseline.confereComBaselineVersionado = normalizarFim(baseline.sql) === normalizarFim(versionado);
    if (!baseline.confereComBaselineVersionado) baseline.problemas.push('Estado observado diverge do baseline versionado; não registrar como aplicado');
  }
  const saida = path.resolve(raiz, values.saida ?? '.conteudo-migracao/reconciliacao');
  await mkdir(saida, { recursive: true, mode: 0o700 });
  async function salvar(nome, valor) {
    const destino = path.join(saida, nome);
    try { await chmod(destino, 0o600); } catch (erro) { if (erro.code !== 'ENOENT') throw erro; }
    await writeFile(destino, valor, { mode: 0o600 });
  }
  await salvar('catalogo.json', `${JSON.stringify(catalogo, null, 2)}\n`);
  await salvar('baseline.json', `${JSON.stringify(baseline, null, 2)}\n`);
  if (!baseline.problemas.length) {
    await salvar('baseline.sql', baseline.sql);
    await salvar('schema-legado.prisma', baseline.schema);
  } else {
    await salvar('baseline.sql', '-- BLOQUEADO: consulte baseline.json; não aplicar este arquivo.\n');
    await salvar('schema-legado.prisma', '// BLOQUEADO: consulte baseline.json.\n');
  }
  await salvar('resumo.md', `# Reconciliação somente leitura\n\nTabelas públicas: ${catalogo.tabelas.length}. Colunas: ${catalogo.colunas.length}. Histórico presente: ${catalogo.historicoPresente}.\n\nBaseline coincide com versão local: ${baseline.confereComBaselineVersionado ?? false}.\n\n${baseline.problemas.join('\n') || 'Sem divergências estruturais no escopo do gerador. Registro do baseline no banco ainda não executado.'}\n`);
  console.log(JSON.stringify({ tabelas: catalogo.tabelas.map((item) => item.tabela), historicoPresente: catalogo.historicoPresente, problemas: baseline.problemas, arquivos: saida }, null, 2));
  if (baseline.problemas.length) process.exitCode = 1;
}
executar().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
