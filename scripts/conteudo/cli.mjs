import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdir, writeFile, chmod, readdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { inventariar, hash } from './inventario.mjs';
import { planejarMigracao } from './migracao.mjs';
import { prepararImportacao } from './preparacao.mjs';
import { conectarELerBanco, conferirHistorico } from './banco.mjs';
import { loadEnvFile } from 'node:process';

async function executar() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { ambiente: { type: 'string' }, saida: { type: 'string' }, manifesto: { type: 'string' }, 'dry-run': { type: 'boolean' }, 'ler-banco': { type: 'boolean' }, 'usar-banco-atual': { type: 'boolean' } } });
  const comando = positionals[0];
  if (positionals.length !== 1 || !['inventariar', 'migrar'].includes(comando)) throw new Error('Use inventariar ou migrar --dry-run');
  if (!['local', 'staging', 'producao'].includes(values.ambiente)) throw new Error('Informe --ambiente local|staging|producao');
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const saida = path.resolve(raiz, values.saida ?? '.conteudo-migracao');
  if (comando === 'migrar' && (!values['dry-run'] || !values.manifesto)) throw new Error('Nesta etapa somente migrar --dry-run --manifesto <arquivo> está disponível');
  if (values['usar-banco-atual'] && !values['ler-banco']) throw new Error('--usar-banco-atual exige --ler-banco');
  if (values['ler-banco'] && comando !== 'inventariar') throw new Error('--ler-banco só é permitido no inventário');
  let resultado;
  let resumoPreparacao;
  if (comando === 'inventariar') resultado = await inventariar(raiz);
  else {
    const manifesto = JSON.parse(await readFile(path.resolve(raiz, values.manifesto), 'utf8'));
    resultado = planejarMigracao(manifesto, values.ambiente);
    const preparado = await prepararImportacao(manifesto, raiz);
    resumoPreparacao = preparado.resumo;
    resultado.preparacao = resumoPreparacao;
  }
  if (values['ler-banco']) {
    for (const nome of ['.env.local', '.env']) {
      try { loadEnvFile(path.join(raiz, nome)); } catch (erro) { if (erro.code !== 'ENOENT') throw new Error('Falha ao carregar configuração local'); }
    }
    resultado.banco = await conectarELerBanco(values['usar-banco-atual'] ? process.env.DATABASE_URL : process.env.ORIGEM_DATABASE_URL);
    const pastas = await readdir(path.join(raiz, 'prisma/migrations'), { withFileTypes: true });
    const locais = await Promise.all(pastas.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name)).map(async (item) => ({ nome: item.name, sha256: hash(await readFile(path.join(raiz, 'prisma/migrations', item.name, 'migration.sql'))) })));
    resultado.banco.conferenciaHistorico = conferirHistorico(resultado.banco, locais);
    delete resultado.sha256;
    resultado.sha256 = hash(JSON.stringify(resultado));
  }
  await mkdir(saida, { recursive: true, mode: 0o700 });
  const nome = comando === 'inventariar' ? 'inventario' : 'simulacao';
  const destinoJson = path.join(saida, `${nome}.json`);
  try { await chmod(destinoJson, 0o600); } catch (erro) { if (erro.code !== 'ENOENT') throw erro; }
  await writeFile(destinoJson, `${JSON.stringify(resultado, null, 2)}\n`, { mode: 0o600 });
  const resumo = comando === 'inventariar' ? [
    `Commit: ${resultado.commit}; árvore alterada: ${resultado.arvoreAlterada}.`,
    `Fontes: ${resultado.fontes.length}; arquivos: ${resultado.midias.length}; bytes: ${resultado.midias.reduce((soma, item) => soma + item.bytes, 0)}.`,
    `Integrantes: ${resultado.conteudo.integrantes.length}; espetáculos: ${resultado.conteudo.espetaculos.length}; prêmios: ${resultado.conteudo.premios.length}; fotos de projetos: ${resultado.conteudo.fotosProjetos.length}.`,
    `Ausentes: ${resultado.ausentes.length}; conflitos: ${resultado.conteudo.conflitos.length}; grupos duplicados: ${resultado.duplicadas.length}.`,
    `Contatos: ${resultado.conteudo.contatos.length}; configurações: ${resultado.conteudo.configuracoes.length}; menu: ${resultado.conteudo.menus.length}; aliases: ${resultado.conteudo.aliasesConfigurados.length}.`,
    `Banco: ${resultado.banco.estado}.`,
    ...(resultado.banco.conferenciaHistorico?.problemas ?? []),
  ] : [
    `Objetos únicos validados: ${resumoPreparacao.midiasUnicas}; bytes: ${resumoPreparacao.bytesDeMidia}.`,
    `Registros projetados por modelo: ${Object.entries(resumoPreparacao.modelos).map(([modelo, quantidade]) => `${modelo}=${quantidade}`).join(', ')}.`,
    `Registros legados mapeados para cópia futura com chaves preservadas: ${Object.entries(resumoPreparacao.registrosLegadosPreservados).map(([tabela, quantidade]) => `${tabela}=${quantidade}`).join(', ') || 'snapshot ausente'}.`,
    `Fontes CSS globais excluídas da configuração editável para conversão em opções seguras: ${resumoPreparacao.configuracoesCssLegadoExcluidas}.`,
    `Hash dos DTOs: ${resumoPreparacao.hashDocumentos}.`,
    ...resultado.bloqueiosExecucao,
  ];
  await writeFile(path.join(saida, `${nome}.md`), `# ${comando === 'inventariar' ? 'Inventário local' : 'Simulação local'}\n\n${resumo.join('\n\n')}\n`);
  console.log(resumo.join('\n'));
  console.log(`Relatórios: ${saida}/${nome}.{json,md}`);
  if (comando === 'inventariar' && (resultado.ausentes.length || resultado.conteudo.conflitos.length || resultado.midias.some((item) => item.erro || !item.formato))) process.exitCode = 1;
}
executar().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
