import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { hash, inventariar } from './inventario.mjs';
import { prepararImportacao } from './preparacao.mjs';

vi.mock('node:child_process', () => ({ execFileSync: (_comando, argumentos) => argumentos[0] === 'rev-parse' ? 'commit-de-teste\n' : '' }));

const raiz = fileURLToPath(new URL('../../', import.meta.url));

function atualizarHash(manifesto) {
  const dados = structuredClone(manifesto);
  delete dados.sha256;
  return { ...dados, sha256: hash(JSON.stringify(dados)) };
}

function manifestoVazio() {
  return atualizarHash({
    versao: 1,
    fontes: [],
    conteudo: { integrantes: [], espetaculos: [], premios: [], fotosProjetos: [], contatos: [], configuracoes: [], menus: [], aliasesConfigurados: [], conflitos: [] },
    midias: [], ausentes: [], banco: { estado: 'snapshot-somente-leitura', registros: { Livro: [] }, midias: [] },
  });
}

describe('preparação local da migração', () => {
  it('valida bytes reais e mapeia inventário para os modelos novos sem incluir payload no resumo', async () => {
    const manifesto = await inventariar(raiz);
    const preparado = await prepararImportacao(manifesto, raiz);

    expect(preparado.resumo).toMatchObject({
      bucket: 'site-publico',
      midiasUnicas: 64,
      modelos: {
        configuracoes: 39,
        canaisContato: 4,
        itensMenu: 10,
        aliases: 10,
        integrantes: 6,
        espetaculos: 2,
        secoesEspetaculo: 7,
        premios: 1,
        galerias: 3,
        fotosGaleria: 41,
        paginasSite: 13,
        secoesHome: 4,
        marcosHistoricos: 0,
      },
      gravacoesRemotas: 0,
    });
    expect(preparado.resumo.hashDocumentos).toMatch(/^[a-f0-9]{64}$/);
    expect(preparado.documentos.espetaculos[0].estado).toBe('PUBLICADO');
    expect(preparado.documentos.paginasSite.some((item) => item.caminho === '/coletivo/integrante/[nome]')).toBe(true);
    expect(preparado.documentos.secoesHome.map((item) => item.tipo)).toEqual(['Main', 'AgendaHome', 'Sobre', 'Contato']);
    expect(preparado.documentos.configuracoes.some((item) => item.chave.endsWith('.css'))).toBe(false);
    expect(preparado.documentos.paginasSite.find((item) => item.caminho === '/')?.configuracao.fontes.some((item) => item.chave.endsWith('.css'))).toBe(false);
    expect(preparado.documentos.midias.some((item) => item.id === preparado.documentos.espetaculos[0].capaId)).toBe(true);
    expect(preparado.payloads.some((item) => item.mime === 'image/vnd.microsoft.icon')).toBe(true);
    expect(preparado.resumo).not.toHaveProperty('payload');
  }, 30000);

  it('confere MIME, SHA e tamanho de blobs antes de projetar os usos legados', async () => {
    const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: '#3b82f6' } }).png().toBuffer();
    const sha256 = hash(bytes);
    const manifestoBase = manifestoVazio();
    delete manifestoBase.sha256;
    manifestoBase.banco.registros.Livro.push({ chaveOrigem: 'banco:Livro:7', id: 7, titulo: 'Livro', autor: 'Autoria', descricao: 'Texto', imagemTipo: 'image/png', createdAt: '2024-01-02 03:04:05.123', imagemSha256: sha256 });
    manifestoBase.banco.registros.Sobre = [{ chaveOrigem: 'banco:Sobre:2024', ano: 2024, descricao: 'Marco de teste', imagemTipo: 'image/png', imagemSha256: sha256 }];
    manifestoBase.banco.midias.push({ chaveOrigem: 'banco:Livro:7:imagem', tabela: 'Livro', registro: 7, sha256, bytes: bytes.length, mimeDeclarado: 'image/png', base64: bytes.toString('base64') });
    manifestoBase.banco.midias.push({ chaveOrigem: 'banco:Sobre:2024:imagem', tabela: 'Sobre', registro: 2024, sha256, bytes: bytes.length, mimeDeclarado: 'image/png', base64: bytes.toString('base64') });
    const manifesto = atualizarHash(manifestoBase);
    const preparado = await prepararImportacao(manifesto, raiz);

    expect(preparado.documentos.usosMidia).toContainEqual(expect.objectContaining({ chaveOrigem: 'banco:Livro:7:imagem', dominio: 'Livro', registro: '7', campo: 'imagem' }));
    expect(preparado.documentos.usosMidia).toContainEqual(expect.objectContaining({ chaveOrigem: 'banco:Sobre:2024:imagem', dominio: 'MarcoHistorico', campo: 'imagem' }));
    expect(preparado.documentos.marcosHistoricos).toContainEqual(expect.objectContaining({ ano: 2024, anoLegado: 2024, descricao: 'Marco de teste', estado: 'PUBLICADO' }));
    expect(preparado.payloads.find((item) => item.sha256 === sha256).mime).toBe('image/png');
    expect(preparado.payloads).toHaveLength(1);
    expect(preparado.registrosLegados.find((item) => item.tabela === 'Livro').dados.imagem).toEqual(bytes);
    expect(preparado.registrosLegados.find((item) => item.tabela === 'Livro').dados.createdAt).toBe('2024-01-02 03:04:05.123');

    const invalido = structuredClone(manifesto);
    delete invalido.sha256;
    invalido.banco.midias[0].mimeDeclarado = 'image/jpeg';
    await expect(prepararImportacao(atualizarHash(invalido), raiz)).rejects.toThrow('MIME declarado diverge do conteúdo detectado');

    const truncado = structuredClone(manifesto);
    delete truncado.sha256;
    truncado.banco.midias[0].base64 = Buffer.from('conteúdo quebrado').toString('base64');
    truncado.banco.midias[0].bytes = Buffer.from('conteúdo quebrado').length;
    truncado.banco.midias[0].sha256 = hash(Buffer.from('conteúdo quebrado'));
    await expect(prepararImportacao(atualizarHash(truncado), raiz)).rejects.toThrow('Conteúdo de blob não reconhecido');
  });

  it('detecta alteração local de arquivo desde a geração do manifesto', async () => {
    const original = await inventariar(raiz);
    const item = original.midias.find((midia) => midia.referencias.length > 0);
    const manifesto = structuredClone(manifestoVazio());
    manifesto.midias = [{ ...item, bytes: item.bytes + 1 }];
    await expect(prepararImportacao(atualizarHash(manifesto), raiz)).rejects.toThrow(`Arquivo mudou desde o inventário: ${item.url}`);
  }, 30000);
});
