import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { extrairFonte, inventariar, normalizar } from './inventario.mjs';

vi.mock('node:child_process', () => ({ execFileSync: (_comando, argumentos) => (argumentos[0] === 'rev-parse' ? 'commit\n' : ' M arquivo\n') }));
vi.mock('./adaptadores.mjs', () => ({ adaptarConfiguracoes: () => ({ conflitos: ['adaptador'] }) }));

const integrantes = [{ id: 'bento', nome: 'Francisco Bento', image: '/coletivo/bento.webp', fichaTecnica: 'Ficha', biografia: 'Bio' }];

function fontes({ listaLegada = integrantes, paginaLeitor = false, fonteFallback = false } = {}) {
  return [
    { caminho: 'src/data/integrantes.ts', variaveis: [{ nome: 'integrantes', valor: integrantes }], textos: [] },
    {
      caminho: 'src/app/coletivo/page.tsx',
      variaveis: listaLegada === null ? [] : [{ nome: 'integrantes', valor: listaLegada }],
      textos: paginaLeitor ? [{ valor: '@/lib/publicContent' }] : [],
    },
    { caminho: 'src/lib/publicContent.ts', variaveis: [], textos: fonteFallback ? [{ valor: '@/data/integrantes' }] : [] },
    { caminho: 'src/data/espetaculos.ts', variaveis: [{ nome: 'shows', valor: [] }, { nome: 'espetaculosData', valor: [] }], textos: [] },
    { caminho: 'src/data/premios.ts', variaveis: [{ nome: 'premios', valor: [] }], textos: [] },
    { caminho: 'src/data/projetos.ts', variaveis: [{ nome: 'projectImgs', valor: [] }], textos: [] },
  ];
}

describe('inventário de integrantes', () => {
  it('preserva o modo legado quando a página contém uma lista literal própria', () => {
    const lista = [{ id: 'bento', nome: 'Francisco Bento', image: '/coletivo/bento.webp' }];
    const resultado = normalizar(fontes({ listaLegada: lista }));
    expect(resultado.integrantes).toEqual([{ chaveOrigem: 'integrante:bento', ordem: 0, ...integrantes[0] }]);
    expect(resultado.conflitos).toEqual([]);
  });

  it('usa a fonte compartilhada quando a rota lê a listagem pública com fallback legado', () => {
    const resultado = normalizar(fontes({ listaLegada: null, paginaLeitor: true, fonteFallback: true }));
    expect(resultado.integrantes).toEqual([{ chaveOrigem: 'integrante:bento', ordem: 0, ...integrantes[0] }]);
    expect(resultado.conflitos).toEqual([]);
  });

  it('bloqueia a extração se a rota dinâmica não estiver ligada à fonte legado conhecida', () => {
    expect(() => normalizar(fontes({ listaLegada: null, paginaLeitor: true })))
      .toThrow('Fonte de integrantes não vinculada');
  });
});

describe('inventário: divergências de conteúdo', () => {
  const alterar = (nome, variavel, valor, base = fontes()) => {
    base.find((fonte) => fonte.caminho === nome).variaveis.find((item) => item.nome === variavel).valor = valor;
    return base;
  };
  it('registra integrante inexistente e quantidade divergente', () => {
    const resultado = normalizar(fontes({ listaLegada: [{ id: 'outro', nome: 'X', image: 'y' }, { id: 'bento', nome: 'Outro nome', image: '/coletivo/bento.webp' }] }));
    expect(resultado.conflitos).toEqual(['Integrante divergente: outro', 'Integrante divergente: bento', 'Quantidade divergente de integrantes']);
    expect(normalizar(fontes({ listaLegada: [] })).conflitos).toEqual(['Quantidade divergente de integrantes']);
  });
  it('registra imagem divergente do perfil', () => {
    expect(normalizar(fontes({ listaLegada: [{ id: 'bento', nome: 'Francisco Bento', image: 'outra.webp' }] })).conflitos).toEqual(['Integrante divergente: bento']);
  });
  it('registra espetáculos sem detalhe, quantidade divergente e chaves duplicadas', () => {
    const base = alterar('src/data/espetaculos.ts', 'espetaculosData', [{ title: 'Ópera Única' }, { title: 'Opera unica' }]);
    alterar('src/data/espetaculos.ts', 'shows', [{ title: 'Ópera Única', sinopse: 'S' }, { title: 'Outro' }, { title: 'Mais um' }], base);
    const resultado = normalizar(base);
    expect(resultado.conflitos).toEqual(expect.arrayContaining(['Quantidade divergente de espetáculos']));
    expect(resultado.espetaculos[0]).toMatchObject({ slug: 'opera-unica', sinopse: 'S' });
    const sem = normalizar(alterar('src/data/espetaculos.ts', 'espetaculosData', [{ title: 'A' }]));
    expect(sem.conflitos).toContain('Espetáculo divergente: A');
  });
  it('registra chaves duplicadas em prêmios', () => {
    const premio = { title: 'Melhor', year: 2020 };
    expect(normalizar(alterar('src/data/premios.ts', 'premios', [premio, premio])).conflitos).toEqual(['Chaves duplicadas: premios']);
  });
  it('exige vínculo completo com o leitor público quando não há lista legada', () => {
    const semPagina = fontes().filter((fonte) => fonte.caminho !== 'src/app/coletivo/page.tsx');
    expect(() => normalizar(semPagina)).toThrow('Fonte de integrantes não vinculada');
    const semTextos = fontes({ listaLegada: null });
    delete semTextos[1].textos;
    delete semTextos[2].textos;
    expect(() => normalizar(semTextos)).toThrow('Fonte de integrantes não vinculada');
    const semLeitor = fontes({ listaLegada: null, paginaLeitor: true, fonteFallback: true }).filter((fonte) => fonte.caminho !== 'src/lib/publicContent.ts');
    expect(() => normalizar(semLeitor)).toThrow('Fonte de integrantes não vinculada');
  });
});

describe('extrairFonte', () => {
  it('usa TS por padrão, ignora JSX vazio e preserva posição dos textos', () => {
    const resultado = extrairFonte('a.ts', 'const a = 1 + 1;\nconst b = "x";');
    expect(resultado.variaveis).toEqual([{ nome: 'b', valor: 'x' }]);
    expect(resultado.textos).toEqual([expect.objectContaining({ tipo: 'literal', valor: 'x', linha: 2 })]);
    expect(extrairFonte('a.tsx', 'const t = <p>   </p>;').textos).toEqual([]);
  });
});

describe('inventariar em árvore temporária', () => {
  const escrever = async (raiz, arquivos) => {
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      await mkdir(path.dirname(path.join(raiz, nome)), { recursive: true });
      await writeFile(path.join(raiz, nome), conteudo);
    }
  };
  const base = {
    'src/data/integrantes.ts': 'export const integrantes = [];',
    'src/app/coletivo/page.tsx': 'export const integrantes = [];',
    'src/data/espetaculos.ts': 'export const shows = []; export const espetaculosData = [];',
    'src/data/premios.ts': 'export const premios = [];',
    'src/data/projetos.ts': 'export const projectImgs = [];',
    'src/app/admin/ignorado.ts': 'const a = "/admin.png";',
    'src/app/api/ignorado.ts': 'const a = "/api.png";',
    'src/ignorado.test.ts': 'const a = "/teste.png";',
    'src/uso.tsx': 'const a = "/ok.png"; const b = "/ausente.png";',
    'next.config.ts': 'const redirect = "/antigo.png";',
    'src/estilo.css': ".a{background:url('/css.png')} .b{background:url(/css.png)}\n.c{background:url(\"/ok.png\")} .d{background:url(/solo.png)}",
  };
  it('classifica mídia, CSS, aliases, ausentes, ícones e erros de decodificação', async () => {
    const raiz = await mkdtemp(path.join(os.tmpdir(), 'inventario-'));
    try {
      const png = await sharp({ create: { width: 2, height: 3, channels: 3, background: '#fff' } }).png().toBuffer();
      await escrever(raiz, base);
      await escrever(raiz, {
        'public/ok.png': png,
        'public/css.png': png,
        'public/copia.png': png,
        'public/solo.png': 'nao-e-imagem-2',
        'public/quebrado.png': 'nao-e-imagem',
        'public/a.ico': Buffer.from([0, 0, 1, 0]),
        'public/b.ico': Buffer.from([1, 0, 1, 0]),
        'public/c.ico': Buffer.from([0, 1, 1, 0]),
        'public/d.ico': Buffer.from([0, 0, 2, 0]),
        'public/e.ico': Buffer.from([0, 0, 1, 1]),
        'src/app/favicon.ico': Buffer.from([0, 0, 1, 0, 9]),
      });
      const manifesto = await inventariar(raiz);
      const midia = (arquivo) => manifesto.midias.find((item) => item.arquivo === arquivo);
      expect(manifesto.aliases).toEqual(['/antigo.png']);
      expect(manifesto.ausentes.map((item) => item.url)).toEqual(['/ausente.png']);
      expect(midia('public/ok.png')).toMatchObject({ formato: 'png', largura: 2, altura: 3 });
      expect(new Set(midia('public/ok.png').referencias.map((item) => item.fonte))).toEqual(new Set(['src/estilo.css', 'src/uso.tsx']));
      expect(midia('public/solo.png').referencias).toEqual([{ fonte: 'src/estilo.css', linha: 2 }]);
      expect(midia('public/css.png').referencias.length).toBeGreaterThanOrEqual(2);
      expect(midia('public/quebrado.png')).toMatchObject({ formato: null, erro: 'Formato não decodificado pelo sharp' });
      expect(midia('public/a.ico')).toMatchObject({ formato: 'ico', url: '/a.ico' });
      for (const nome of ['b', 'c', 'd', 'e']) expect(midia(`public/${nome}.ico`)).toMatchObject({ formato: null });
      expect(midia('public/a.ico').erro).toBeUndefined();
      expect(midia('src/app/favicon.ico')).toMatchObject({ url: '/favicon.ico', formato: 'ico' });
      expect(manifesto.duplicadas).toEqual([expect.objectContaining({ urls: expect.arrayContaining(['/ok.png', '/css.png', '/copia.png']) })]);
      expect(manifesto.arvoreAlterada).toBe(true);
      expect(manifesto.conteudo.conflitos).toEqual(['adaptador']);
    } finally { await rm(raiz, { recursive: true, force: true }); }
  });
  it('rejeita links simbólicos na árvore de origem', async () => {
    const raiz = await mkdtemp(path.join(os.tmpdir(), 'inventario-'));
    try {
      await escrever(raiz, base);
      await symlink(path.join(raiz, 'src/uso.tsx'), path.join(raiz, 'src/link.tsx'));
      await expect(inventariar(raiz)).rejects.toThrow('Link simbólico não permitido: src/link.tsx');
    } finally { await rm(raiz, { recursive: true, force: true }); }
  });
});
