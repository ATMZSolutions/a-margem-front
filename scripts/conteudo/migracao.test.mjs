import { describe, expect, it, vi } from 'vitest';
import { extrairFonte, hash, lerLiteral, inventariar, normalizar } from './inventario.mjs';
import { decidirImportacao, planejarMigracao } from './migracao.mjs';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

vi.mock('node:child_process', () => ({ execFileSync: (_comando, argumentos) => argumentos[0] === 'rev-parse' ? 'commit-de-teste\n' : '' }));

function manifestoBase() {
  const dados = { versao: 1, conteudo: { integrantes: [{ chaveOrigem: 'integrante:bento', nome: 'Bento' }], conflitos: [] }, ausentes: [], midias: [
    { sha256: 'abc', formato: 'jpeg', bytes: 100, url: '/a.jpg', referencias: [{}] },
    { sha256: 'abc', formato: 'jpeg', bytes: 100, url: '/b.jpg', referencias: [{}] },
    { sha256: 'def', formato: 'png', bytes: 20, url: '/sem-uso.png', referencias: [] },
  ] };
  return { ...dados, sha256: hash(JSON.stringify(dados)) };
}

describe('extração de conteúdo sem execução', () => {
  it('preserva acentos/quebras de linha e não executa chamadas', () => {
    const resultado = extrairFonte('pagina.tsx', 'const pessoas = [{ nome: "Iná", texto: `a\\nb` }]; const perigo = process.exit(); const tela = <p>Olá mundo</p>');
    expect(resultado.variaveis).toEqual([{ nome: 'pessoas', valor: [{ nome: 'Iná', texto: 'a\nb' }] }]);
    expect(resultado.textos.some((item) => item.valor === 'Olá mundo' && item.tipo === 'jsx')).toBe(true);
  });
  it('rejeita spreads e expressões dinâmicas', () => {
    const arvore = ts.createSourceFile('x.ts', 'const x = [...segredo]', ts.ScriptTarget.Latest, true);
    expect(() => lerLiteral(arvore.statements[0].declarationList.declarations[0].initializer)).toThrow();
  });
});

describe('simulação da migração', () => {
  it('deduplica arquivos, preserva usos e não inclui arquivo sem referência', () => {
    const plano = planejarMigracao(manifestoBase(), 'local');
    expect(plano.objetos).toHaveLength(1);
    expect(plano.objetos[0].origens).toEqual(['/a.jpg', '/b.jpg']);
    expect(plano.objetos[0].chave).toBe('originais/abc.jpg');
    expect(plano.gravacoesRemotas).toBe(0);
    expect(plano.bloqueiosExecucao.length).toBeGreaterThan(0);
  });
  it('rejeita manifesto adulterado e ambiente desconhecido', () => {
    const manifesto = manifestoBase();
    manifesto.midias[0].bytes++;
    expect(() => planejarMigracao(manifesto, 'local')).toThrow('Manifesto inválido');
    expect(() => planejarMigracao(manifestoBase(), 'outro')).toThrow('Ambiente obrigatório');
  });
  it('bloqueia referências ausentes mesmo em manifesto íntegro', () => {
    const dados = manifestoBase();
    delete dados.sha256;
    dados.ausentes.push({ url: '/perdida.jpg' });
    expect(() => planejarMigracao({ ...dados, sha256: hash(JSON.stringify(dados)) }, 'staging')).toThrow('arquivos ausentes');
  });
  it('ignora repetição e protege edições feitas no destino', () => {
    expect(decidirImportacao('a')).toBe('criar');
    expect(decidirImportacao('a', { hashFonteImportada: 'a', hashDestinoAtual: 'b', hashDestinoImportado: 'b' })).toBe('ignorar');
    expect(decidirImportacao('c', { hashFonteImportada: 'a', hashDestinoAtual: 'b', hashDestinoImportado: 'b' })).toBe('atualizar');
    expect(decidirImportacao('a', { hashFonteImportada: 'a', hashDestinoAtual: 'editado', hashDestinoImportado: 'b' })).toBe('conflito');
  });
  it('inclui registros/blobs do snapshot sem repetir bytes no plano e deduplica com arquivo local', () => {
    const dados = manifestoBase();
    delete dados.sha256;
    dados.banco = { estado: 'snapshot-somente-leitura', registros: { Livro: [{ chaveOrigem: 'banco:Livro:1', titulo: 'Livro' }] }, midias: [{ chaveOrigem: 'banco:Livro:1:imagem', sha256: 'abc', bytes: 100, base64: 'SEGREDO' }, { chaveOrigem: 'banco:Sobre:2023:imagem', sha256: 'novo', bytes: 200, base64: 'SEGREDO' }] };
    const plano = planejarMigracao({ ...dados, sha256: hash(JSON.stringify(dados)) }, 'local');
    expect(plano.objetos).toHaveLength(2);
    expect(plano.entidades.some((item) => item.chaveOrigem === 'banco:Livro:1')).toBe(true);
    expect(plano.objetos[0].origens).toContain('banco:Livro:1:imagem');
    expect(JSON.stringify(plano)).not.toContain('SEGREDO');
    expect(plano.bloqueiosExecucao).not.toContain('Banco de origem não consultado');
  });
});


describe('inventário completo do checkout', () => {
  it('reconcilia os domínios e valida mídia real sem acessar o banco', async () => {
    const raiz = fileURLToPath(new URL('../../', import.meta.url));
    const manifesto = await inventariar(raiz);
    expect(manifesto.commit).toBe('commit-de-teste');
    expect(manifesto.banco.estado).toBe('nao-consultado');
    expect(manifesto.conteudo.integrantes).toHaveLength(6);
    expect(manifesto.conteudo.espetaculos).toHaveLength(2);
    expect(manifesto.conteudo.premios).toHaveLength(1);
    expect(manifesto.conteudo.fotosProjetos).toHaveLength(27);
    expect(manifesto.conteudo.conflitos).toEqual([]);
    expect(manifesto.ausentes).toEqual([]);
    expect(manifesto.midias.some((item) => item.formato === 'svg')).toBe(true);
    expect(manifesto.midias.some((item) => item.formato === 'ico')).toBe(true);
    expect(manifesto.duplicadas.length).toBeGreaterThan(0);
    expect(planejarMigracao(manifesto, 'staging').objetos.length).toBeGreaterThan(0);
    const fontes = structuredClone(manifesto.fontes);
    fontes.find((fonte) => fonte.caminho === 'src/app/coletivo/page.tsx').variaveis.find((item) => item.nome === 'integrantes').valor[0].nome = 'Divergente';
    expect(normalizar(fontes).conflitos).toContain('Integrante divergente: bento');
    expect(() => normalizar([])).toThrow('Fonte obrigatória ausente');
  });
});
